"""
CrowdCare AI Care Assistant.

Reuses the existing symptom classifier and priority classifier as the
single source of truth for medical routing — this module only manages
conversation flow and natural-language phrasing. The Ollama LLM is
optional at every layer: if it is missing, not running, has no model
pulled, or times out, the chatbot still functions correctly using
deterministic fallbacks.
"""

import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from datetime import datetime

from emergency_priority import classify_priority
from symptom_classifier import suggest_department

try:
    import ollama
    OLLAMA_AVAILABLE = True
except Exception as _import_error:
    print(f"[chatbot] Ollama package not available: {_import_error}")
    OLLAMA_AVAILABLE = False

OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_TIMEOUT_SECONDS = 8

_executor = ThreadPoolExecutor(max_workers=2)

# session_id -> {"history": [...], "turns": int}
_conversations = {}

MIN_WORDS_TO_COMPLETE = 6
MAX_TURNS_BEFORE_FORCE_COMPLETE = 4

FORBIDDEN_DIAGNOSIS_TERMS = [
    "dengue", "malaria", "chikungunya", "typhoid", "cholera", "leptospirosis",
    "covid", "covid-19", "influenza", "pneumonia", "tuberculosis", "cancer",
    "diabetes", "hypertension", "asthma", "bronchitis", "migraine", "stroke",
    "heart attack", "appendicitis",
]

CLARIFYING_QUESTIONS = [
    "How long have you been experiencing this?",
    "Is the discomfort mild, moderate, or severe?",
    "Have you noticed any other symptoms along with this?",
    "Has this happened before, or is this the first time?",
]

SYSTEM_PROMPT = """You are CrowdCare's hospital triage assistant.
You help patients describe their symptoms so the system can suggest the right
hospital department. You are NOT a doctor.

Rules:
1. Never name or suggest a specific disease, infection, or diagnosis.
2. Ask exactly ONE short, relevant follow-up question at a time.
3. Never repeat a question the patient has already answered.
4. Keep replies short - one or two sentences, plain language.
5. If the patient describes anything sounding like an emergency (chest pain,
   trouble breathing, unconsciousness, severe bleeding, stroke symptoms),
   do not ask further questions - say clearly that this needs immediate
   emergency care.
6. Do not repeat medical jargon back at the patient.

Respond only with the next thing you would say to the patient - no labels,
no JSON, just the message text."""


def _get_session(session_id):
    if session_id not in _conversations:
        _conversations[session_id] = {"history": [], "turns": 0}
    return _conversations[session_id]


def reset_session(session_id):
    _conversations.pop(session_id, None)


def _combined_patient_text(history):
    return " ".join(m["content"] for m in history if m["role"] == "user")


def _sanitize_reply(reply_text):
    lowered = reply_text.lower()
    for term in FORBIDDEN_DIAGNOSIS_TERMS:
        if term in lowered:
            return (
                "I can't confirm a specific condition from symptoms alone - "
                "a doctor will need to examine you for that. "
                + CLARIFYING_QUESTIONS[0]
            )
    return reply_text


def _run_ollama_chat(messages):
    response = ollama.chat(model=OLLAMA_MODEL, messages=messages)
    return response["message"]["content"].strip()


def _call_ollama(messages):
    if not OLLAMA_AVAILABLE:
        raise RuntimeError("Ollama package not available")

    future = _executor.submit(_run_ollama_chat, messages)
    try:
        return future.result(timeout=OLLAMA_TIMEOUT_SECONDS)
    except FutureTimeoutError:
        raise RuntimeError("Ollama timed out")


def _next_clarifying_question(turns):
    index = min(turns, len(CLARIFYING_QUESTIONS) - 1)
    return CLARIFYING_QUESTIONS[index]


def _looks_complete(text, turns):
    word_count = len(text.split())
    if word_count >= MIN_WORDS_TO_COMPLETE:
        return True
    if turns >= MAX_TURNS_BEFORE_FORCE_COMPLETE:
        return True
    return False


def handle_chat_message(session_id, message):
    session = _get_session(session_id)
    session["history"].append({"role": "user", "content": message})
    session["turns"] += 1

    combined_text = _combined_patient_text(session["history"])
    month = datetime.now().month

    priority, _level = classify_priority(combined_text)

    if priority == "emergency":
        reply = (
            "This may be a medical emergency. Please go to the nearest "
            "Emergency department right now or call for emergency help - "
            "don't wait for further questions."
        )
        session["history"].append({"role": "assistant", "content": reply})
        return {
            "reply": reply,
            "is_complete": True,
            "department": "Emergency",
            "urgency": "emergency",
            "summary": combined_text,
            "seasonal_alert": None,
            "session_id": session_id,
        }

    complete = _looks_complete(combined_text, session["turns"])

    if not complete:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}] + session["history"]
            reply = _sanitize_reply(_call_ollama(messages))
        except Exception as error:
            print(f"[chatbot] Ollama unavailable, using fallback question: {error}")
            reply = _next_clarifying_question(session["turns"] - 1)

        session["history"].append({"role": "assistant", "content": reply})
        return {
            "reply": reply,
            "is_complete": False,
            "department": None,
            "urgency": None,
            "summary": None,
            "seasonal_alert": None,
            "session_id": session_id,
        }

    result = suggest_department(combined_text, month)
    department = result.get("department", "General Medicine")
    seasonal_alert = result.get("seasonal_alert")
    urgency = priority  # 'urgent' or 'normal' here, 'emergency' already returned above

    closing_reply = f"Based on what you've shared, {department} would be the right department for this."
    if urgency == "urgent":
        closing_reply += " Given your symptoms, please try to be seen soon rather than waiting."

    session["history"].append({"role": "assistant", "content": closing_reply})

    return {
        "reply": closing_reply,
        "is_complete": True,
        "department": department,
        "urgency": urgency,
        "summary": combined_text,
        "seasonal_alert": seasonal_alert,
        "session_id": session_id,
    }