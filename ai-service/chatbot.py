"""
CrowdCare AI Care Assistant - triage brain.

Reuses the existing symptom classifier and priority classifier as the
single source of truth for medical routing. This module manages adaptive
conversation flow: it tracks four clinical signals (duration, severity,
temperature, functional impact), asks only for what is still missing,
treats "I don't know" as a valid answer, and checks for emergency
escalation on every single turn, not just the first message.

Ollama is optional at every layer. If it is missing, not running, has no
model pulled, or times out, the chatbot still functions correctly using
deterministic fallback questions.
"""

import os
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from datetime import datetime

from emergency_priority import classify_priority
from symptom_classifier import suggest_department
import sys
print("[chatbot] chatbot.py loaded - closing-reply hardened v2")

try:
    import ollama
    OLLAMA_AVAILABLE = True
except Exception as _import_error:
    print(f"[chatbot] Ollama package not available: {_import_error}")
    OLLAMA_AVAILABLE = False

OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_TIMEOUT_SECONDS = 8
MAX_TURNS_BEFORE_FORCE_COMPLETE = 6

_executor = ThreadPoolExecutor(max_workers=2)

# session_id -> {
#   "history": [{"role": "user"/"assistant", "content": str}, ...],
#   "turns": int,
#   "signals": {"duration": bool, "severity": bool, "temperature": bool, "functional_impact": bool},
#   "last_asked": str or None,
# }
_conversations = {}

SIGNAL_ORDER = ["duration", "severity", "temperature", "functional_impact"]

# Ananya's original question set, kept verbatim as the deterministic backbone.
FALLBACK_QUESTIONS = {
    "duration": "How long have you had these symptoms?",
    "severity": "How severe are your symptoms?",
    "temperature": "What is your temperature?",
    "functional_impact": "Are you able to eat and drink normally and perform your usual activities?",
}

FORBIDDEN_DIAGNOSIS_TERMS = [
    "dengue", "malaria", "chikungunya", "typhoid", "cholera", "leptospirosis",
    "covid", "covid-19", "influenza", "pneumonia", "tuberculosis", "cancer",
    "diabetes", "hypertension", "asthma", "bronchitis", "migraine", "stroke",
    "heart attack", "appendicitis",
]

SKIP_PATTERNS = [
    r"\bi don'?t know\b", r"\bnot sure\b", r"\bno idea\b", r"\bcan'?t say\b",
    r"\bskip\b", r"\bnot certain\b", r"\bunsure\b", r"\bhard to say\b",
]

DURATION_PATTERNS = [
    r"\b\d+\s*(day|days|week|weeks|month|months|hour|hours)\b",
    r"\bsince\s+(yesterday|today|last\s+(night|week|month)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    r"\byesterday\b", r"\btoday\b", r"\bfor\s+a\s+(few|couple\s+of)\s+(days|weeks)\b",
]

SEVERITY_PATTERNS = [
    r"\bmild\b", r"\bmoderate\b", r"\bsevere\b", r"\bslight(ly)?\b",
    r"\bintense\b", r"\bunbearable\b", r"\bmanageable\b",
    r"\b(really|very|quite|extremely)\s+(bad|painful)\b",
    r"\ba\s+little\b", r"\bgetting\s+(worse|better)\b",
]

TEMPERATURE_PATTERNS = [
    r"\b\d{2,3}(\.\d+)?\s*(°\s*[fc]|degrees?\s*[fc]?)\b",
    r"\bno\s+fever\b", r"\bhaven'?t\s+checked\b", r"\bfeels?\s+(hot|warm)\b",
    r"\bhigh\s+fever\b", r"\bnormal\s+temperature\b",
]

FUNCTIONAL_PATTERNS = [
    r"\bcan'?t\s+(eat|sleep|work|walk)\b", r"\bcan\s+(eat|sleep|work|walk)\b",
    r"\bnormal\s+activities\b", r"\bbedridden\b", r"\bmanaging\s+(fine|okay|ok)\b",
    r"\b(unable|able)\s+to\s+(eat|drink|work)\b",
]

SYSTEM_PROMPT = """You are CrowdCare's hospital triage assistant.
You help patients describe their symptoms so the system can suggest the right
hospital department. You are NOT a doctor.

Rules:
1. Never name or suggest a specific disease, infection, or diagnosis.
2. Never agree with, confirm, or validate a patient's own guess about what
   condition they might have. If they suggest a diagnosis themselves, do not
   confirm or deny it - redirect to asking about their actual symptoms.
3. Ask exactly ONE short, relevant follow-up question at a time, about
   whichever specific thing you are told to ask about.
4. Never repeat a question the patient has already answered.
5. Keep replies short - one or two sentences, plain language.
6. If the patient describes anything sounding like an emergency (chest pain,
   trouble breathing, unconsciousness, severe bleeding, stroke symptoms),
   do not ask further questions - say clearly that this needs immediate
   emergency care.
7. Do not repeat medical jargon back at the patient.
8. Stay neutral and factual. Do not reassure the patient that something is
   "probably fine" or "nothing to worry about" - that is not your call to make.

Respond only with the next thing you would say to the patient - no labels,
no JSON, just the message text."""

CLOSING_SYSTEM_PROMPT = """You are CrowdCare's hospital triage assistant. The
conversation is now finished - you have enough information. Your ONLY job
right now is to tell the patient, in one short factual sentence, which
hospital department is appropriate for them. Do not ask any questions. Do
not name a specific disease. Do not use the word "assistant" or any role
label in your reply - just the sentence itself."""


def _strip_role_artifacts(text):
    text = text.strip()
    text = re.sub(r'^(assistant|system|user)\s*[:\-]?\s*\n*', '', text, flags=re.IGNORECASE)
    return text.strip()


def _sanitize_reply(reply_text):
    reply_text = _strip_role_artifacts(reply_text)
    lowered = reply_text.lower()
    for term in FORBIDDEN_DIAGNOSIS_TERMS:
        if term in lowered:
            return (
                "I can't confirm a specific condition from symptoms alone - "
                "a doctor will need to examine you for that."
            )
    return reply_text


def _looks_unsafe_as_closing_reply(text, department):
    if "?" in text:
        return True
    lowered = text.strip().lower()
    if lowered.startswith("assistant") or lowered.startswith("system") or lowered.startswith("user"):
        return True
    if len(text) > 220:
        return True
    if not text.strip():
        return True
    if department.lower() not in lowered:
        return True
    refusal_phrases = [
        "not authorized", "cannot determine", "can't determine",
        "unable to determine", "not able to determine", "i cannot",
        "i can't", "i'm not able", "not qualified", "as an ai",
    ]
    if any(phrase in lowered for phrase in refusal_phrases):
        return True
    return False


def _generate_closing_reply(department, fallback_reply):
    print(f"[chatbot] >>> _generate_closing_reply CALLED for department={department}", flush=True)
    try:
        instruction = {
            "role": "user",
            "content": f"The right department for this patient is {department}. Tell them this in one short sentence.",
        }
        messages = [{"role": "system", "content": CLOSING_SYSTEM_PROMPT}, instruction]
        raw_reply = _call_ollama(messages)
        reply = _sanitize_reply(raw_reply)

        if _looks_unsafe_as_closing_reply(reply):
            print(f"[chatbot] Closing reply failed safety check, using template. Raw model output was: {raw_reply!r}", flush=True)
            return fallback_reply

        print(f"[chatbot] Closing reply generated by Ollama: {reply!r}", flush=True)
        return reply
    except Exception as error:
        print(f"[chatbot] Ollama unavailable for closing reply, using template: {error}", flush=True)
        return fallback_reply


def _get_session(session_id):
    if session_id not in _conversations:
        _conversations[session_id] = {
            "history": [],
            "turns": 0,
            "signals": {sig: False for sig in SIGNAL_ORDER},
            "last_asked": None,
        }
    return _conversations[session_id]


def reset_session(session_id):
    _conversations.pop(session_id, None)


def _combined_patient_text(history):
    return " ".join(m["content"] for m in history if m["role"] == "user")


def _is_skip_response(text):
    lowered = text.lower()
    return any(re.search(p, lowered) for p in SKIP_PATTERNS)


def _matches_any(text, patterns):
    lowered = text.lower()
    return any(re.search(p, lowered) for p in patterns)


def _update_signals(session, latest_message, combined_text):
    if session["last_asked"] and _is_skip_response(latest_message):
        session["signals"][session["last_asked"]] = True

    if _matches_any(combined_text, DURATION_PATTERNS):
        session["signals"]["duration"] = True
    if _matches_any(combined_text, SEVERITY_PATTERNS):
        session["signals"]["severity"] = True
    if _matches_any(combined_text, TEMPERATURE_PATTERNS):
        session["signals"]["temperature"] = True
    if _matches_any(combined_text, FUNCTIONAL_PATTERNS):
        session["signals"]["functional_impact"] = True


def _next_missing_signal(session):
    for sig in SIGNAL_ORDER:
        if not session["signals"][sig]:
            return sig
    return None


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


def _ask_for_signal(session, signal):
    fallback = FALLBACK_QUESTIONS[signal]
    try:
        instruction = {
            "role": "system",
            "content": (
                f"Ask the patient this, in your own natural words, and ask "
                f"nothing else: {fallback}"
            ),
        }
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + session["history"] + [instruction]
        return _sanitize_reply(_call_ollama(messages))
    except Exception as error:
        print(f"[chatbot] Ollama unavailable, using fallback question: {error}")
        return fallback


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

    _update_signals(session, message, combined_text)
    missing_signal = _next_missing_signal(session)
    complete = missing_signal is None or session["turns"] >= MAX_TURNS_BEFORE_FORCE_COMPLETE

    if not complete:
        reply = _ask_for_signal(session, missing_signal)
        session["last_asked"] = missing_signal
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
    urgency = priority

    closing_reply = f"Based on what you've shared, {department} would be the right department for this."
    if urgency == "urgent":
        closing_reply += " Given your symptoms, please try to be seen soon rather than waiting."

    closing_reply = _generate_closing_reply(department, closing_reply)

    session["history"].append({"role": "assistant", "content": closing_reply})

    return {
        "reply": closing_reply,
        "is_complete": True,
        "department": department,
        "urgency": urgency,
        "summary": combined_text,
        "signals_collected": session["signals"],
        "seasonal_alert": seasonal_alert,
        "session_id": session_id,
    }