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

FAQ_KNOWLEDGE_BASE = [
    {
        "id": "wait_time",
        "keywords": ["wait time", "waiting time", "how long wait", "queue time", "how is wait"],
        "answer": (
            "Wait time is calculated from real appointment data: the number of "
            "patients ahead of you, multiplied by the doctor's average "
            "consultation time plus a small buffer per patient. It updates "
            "automatically if someone ahead of you cancels."
        ),
    },
    {
        "id": "priority_levels",
        "keywords": ["urgent", "emergency", "priority level", "difference between urgent", "what does urgent mean", "what does emergency mean"],
        "answer": (
            "CrowdCare uses three priority levels. Emergency means symptoms like "
            "chest pain or difficulty breathing - seek immediate care. Urgent "
            "means you should be seen soon, such as a high fever in a child. "
            "Normal is standard priority for routine or mild symptoms."
        ),
    },
    {
        "id": "noshow_risk",
        "keywords": ["no-show", "no show", "risk score", "miss my appointment", "reminder risk"],
        "answer": (
            "The no-show risk score predicts how likely a patient is to miss "
            "an appointment, shown as low, medium, or high risk, using a "
            "machine learning model trained on real appointment patterns. "
            "High-risk appointments get a recommendation to send an extra "
            "reminder."
        ),
    },
    {
        "id": "seasonal_alert",
        "keywords": ["seasonal alert", "dengue warning", "monsoon illness", "why did i get a warning", "disease alert"],
        "answer": (
            "Seasonal alerts have three tiers - Watch, Elevated, and High risk - "
            "based on how many of your symptoms overlap with common illnesses "
            "for the current season, using real historical disease data, not "
            "just the calendar month."
        ),
    },
    {
        "id": "hospital_score",
        "keywords": ["hospital score", "why this hospital", "how are hospitals ranked", "hospital recommendation"],
        "answer": (
            "Hospitals are scored using four weighted factors: wait time (35%), "
            "distance (25%), rating (20%), and available slots (20%). You can "
            "tap 'Why this score?' on any hospital to see the exact breakdown."
        ),
    },
    {
        "id": "doctor_score",
        "keywords": ["doctor score", "why this doctor", "how are doctors ranked", "doctor recommendation"],
        "answer": (
            "Doctors are scored using rating (30%), experience (25%), available "
            "slots (25%), and current patient load (20%, subtracted as a "
            "penalty) - so an overloaded doctor won't outrank a less busy one "
            "with a similar rating."
        ),
    },
    {
        "id": "cancel_reschedule",
        "keywords": ["cancel appointment", "reschedule", "change my appointment", "how to cancel"],
        "answer": (
            "You can cancel or reschedule from your appointments dashboard. "
            "When you cancel, the slot is freed and the first person on the "
            "waitlist for it is automatically notified and promoted."
        ),
    },
    {
        "id": "waitlist",
        "keywords": ["waitlist", "full slot", "slot is full", "join waitlist"],
        "answer": (
            "If a slot is full, you can join its waitlist. You'll be notified "
            "automatically if a spot opens up - no need to keep checking "
            "manually."
        ),
    },
    {
        "id": "privacy",
        "keywords": ["privacy", "data safe", "where does my data go", "is this private", "third party"],
        "answer": (
            "Symptom conversations are processed by a language model running "
            "locally on our own server via Ollama - nothing you type here is "
            "sent to an external AI provider."
        ),
    },
]

FAQ_TRIGGER_PATTERNS = [
    r"\bhow (does|is|do)\b", r"\bwhat (does|is|are)\b", r"\bwhy (did|is|does)\b",
    r"\bexplain\b", r"\bcan you tell me about\b", r"\bhow can i\b",
]


def _looks_like_faq(text):
    lowered = text.lower()
    return any(re.search(p, lowered) for p in FAQ_TRIGGER_PATTERNS)


def _find_best_faq_match(text):
    lowered = text.lower()
    best_entry = None
    best_score = 0
    for entry in FAQ_KNOWLEDGE_BASE:
        score = sum(1 for kw in entry["keywords"] if kw in lowered)
        if score > best_score:
            best_score = score
            best_entry = entry
    return best_entry if best_score > 0 else None


def _generate_faq_answer(entry, user_message):
    fact = entry["answer"]
    try:
        instruction = {
            "role": "user",
            "content": (
                f'A patient asked: "{user_message}". Using only this fact, '
                f"answer them naturally in one or two short sentences, without "
                f"adding any information beyond it: {fact}"
            ),
        }
        messages = [{"role": "system", "content": CLOSING_SYSTEM_PROMPT}, instruction]
        raw_reply = _call_ollama(messages)
        reply = _sanitize_reply(raw_reply)
        if "?" in reply or len(reply) > 300 or not reply.strip():
            return fact
        return reply
    except Exception as error:
        print(f"[chatbot] Ollama unavailable for FAQ answer, using fact directly: {error}", flush=True)
        return fact

JARGON_TRIGGER_PATTERNS = [
    r"what does\s+(.+?)\s+mean\b",
    r"what is\s+(.+?)(?:\?|$)",
    r"explain\s+(.+?)(?:\?|$)",
    r"meaning of\s+(.+?)(?:\?|$)",
    r"translate\s+(.+?)(?:\?|$)",
    r"can you explain\s+(.+?)(?:\?|$)",
]

# If the extracted term matches one of these, this is a question about the
# platform itself, not a medical term - let FAQ or symptom routing handle
# it instead. Prevents jargon detection from swallowing platform questions
# that were phrased slightly differently than the FAQ keyword list expects.
NON_JARGON_TERMS = [
    "urgent", "emergency", "priority", "wait time", "no-show", "no show",
    "hospital score", "doctor score", "waitlist", "seasonal alert",
    "this app", "crowdcare", "this system", "this website",
]


def _extract_jargon_term(text):
    lowered = text.lower().strip()
    for pattern in JARGON_TRIGGER_PATTERNS:
        match = re.search(pattern, lowered)
        if match:
            term = match.group(1).strip(" ?.!")
            if not term or len(term) > 100:
                continue
            if any(nj in term for nj in NON_JARGON_TERMS):
                continue
            return term
    return None

JARGON_SYSTEM_PROMPT = """You are CrowdCare's medical jargon translator. A
patient has given you a medical term, abbreviation, or a line from a report
and wants it explained in plain language.

Rules:
1. Explain only what the term or finding means in general, factual terms.
2. Do not tell the patient how serious it is, whether they should worry,
   or what will happen to them.
3. Do not recommend any treatment or next step beyond suggesting they
   discuss it with their doctor if they have questions.
4. Do not diagnose anything beyond what the patient already told you.
5. Keep it short - two to three plain sentences, no medical jargon in
   the explanation itself.
6. Do not use the word "assistant" or any role label in your reply.

Respond only with the explanation itself - no labels, no JSON."""

REASSURANCE_OVERREACH_PATTERNS = [
    r"\bnothing to worry\b", r"\byou'?ll be fine\b", r"\bnot serious\b",
    r"\bnot dangerous\b", r"\bcommon and harmless\b", r"\byou should be fine\b",
    r"\bno need to worry\b", r"\bit'?s not a big deal\b",
]


def _looks_like_overreach(text):
    lowered = text.lower()
    return any(re.search(p, lowered) for p in REASSURANCE_OVERREACH_PATTERNS)


def _generate_jargon_explanation(term):
    fallback = (
        f'I can give a general explanation of "{term}", but for what it means '
        f"specifically for your situation, please check with your doctor - "
        f"they have your full history and can explain it accurately."
    )
    try:
        instruction = {
            "role": "user",
            "content": (
                f'A patient asked about this term or report finding: "{term}". '
                f"Explain what it generally means in plain language."
            ),
        }
        messages = [{"role": "system", "content": JARGON_SYSTEM_PROMPT}, instruction]
        raw_reply = _call_ollama(messages)
        reply = _strip_role_artifacts(raw_reply)

        if not reply.strip() or len(reply) > 400 or "?" in reply:
            return fallback
        if _looks_like_overreach(reply):
            return fallback

        return reply + " If you have any concerns about this, it's best to discuss it with your doctor."
    except Exception as error:
        print(f"[chatbot] Ollama unavailable for jargon explanation, using fallback: {error}", flush=True)
        return fallback

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

        if _looks_unsafe_as_closing_reply(reply,department):
            print(f"[chatbot] Closing reply failed safety check, using template. Raw model output was: {raw_reply!r}", flush=True)
            return fallback_reply

        print(f"[chatbot] Closing reply generated by Ollama: {reply!r}", flush=True)
        return reply
    except RuntimeError as error:
        print(f"[chatbot] Ollama unavailable for closing reply, using template: {error}", flush=True)
        return fallback_reply
    except Exception as error:
        print(f"[chatbot] UNEXPECTED ERROR in closing reply generation (this is a code bug, not Ollama): {type(error).__name__}: {error}", flush=True)
        return fallback_reply


def _get_session(session_id):
    if session_id not in _conversations:
        _conversations[session_id] = {
            "history": [],
            "turns": 0,
            "signals": {sig: False for sig in SIGNAL_ORDER},
            "last_asked": None,
            "symptom_messages": [],
        }
    return _conversations[session_id]


def reset_session(session_id):
    _conversations.pop(session_id, None)


def _combined_patient_text(symptom_messages):
    return " ".join(symptom_messages)


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
    priority, _level = classify_priority(message)

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
            "summary": _combined_patient_text(session["symptom_messages"]),
            "seasonal_alert": None,
            "response_type": "emergency",
            "session_id": session_id,
        }

    if _looks_like_faq(message):
        faq_entry = _find_best_faq_match(message)
        if faq_entry is not None:
            reply = _generate_faq_answer(faq_entry, message)
            session["history"].append({"role": "assistant", "content": reply})
            return {
                "reply": reply,
                "is_complete": False,
                "department": None,
                "urgency": None,
                "summary": None,
                "seasonal_alert": None,
                "response_type": "faq",
                "session_id": session_id,
            }

    jargon_term = _extract_jargon_term(message)
    if jargon_term:
        reply = _generate_jargon_explanation(jargon_term)
        session["history"].append({"role": "assistant", "content": reply})
        return {
            "reply": reply,
            "is_complete": False,
            "department": None,
            "urgency": None,
            "summary": None,
            "seasonal_alert": None,
            "response_type": "jargon_translation",
            "session_id": session_id,
        }

    session["symptom_messages"].append(message)
    session["turns"] += 1

    combined_text = _combined_patient_text(session["symptom_messages"])
    month = datetime.now().month

    combined_priority, _combined_level = classify_priority(combined_text)
    if combined_priority == "emergency":
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
            "response_type": "emergency",
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
            "response_type": "triage_question",
            "session_id": session_id,
        }

    result = suggest_department(combined_text, month)
    department = result.get("department", "General Medicine")
    seasonal_alert = result.get("seasonal_alert")
    urgency = combined_priority

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
        "response_type": "triage_complete",
        "session_id": session_id,
    }
