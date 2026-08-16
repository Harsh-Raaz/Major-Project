import nltk
from nltk.tokenize import word_tokenize

from seasonal import get_seasonal_alert, get_alert_tier

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", quiet=True)

try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab", quiet=True)

SYMPTOM_MAP = {
    "Emergency": [
        "unconscious", "not breathing", "severe bleeding", "accident",
        "stroke", "paralysis", "seizure", "heart attack", "fainted",
        "collapsed", "unresponsive", "choking", "poisoning", "overdose",
        "severe burn", "electric shock", "drowning", "head injury",
        "loss of consciousness", "convulsions", "severe allergic reaction",
        "anaphylaxis", "can't breathe", "cannot breathe", "no pulse",
    ],
    "Cardiology": [
        "chest pain", "chest tightness", "palpitations", "breathlessness",
        "irregular heartbeat", "heart", "blood pressure", "bp high",
        "bp low", "shortness of breath", "chest heaviness", "chest pressure",
        "racing heart", "fast heartbeat", "skipped heartbeat", "angina",
        "high bp", "low bp", "heart racing", "fainting spells",
        "difficulty breathing on exertion", "swelling in legs",
    ],
    "Neurology": [
        "memory loss", "confusion", "tremor", "migraine", "epilepsy",
        "numbness", "dizziness", "vertigo", "headache severe",
        "loss of balance", "slurred speech", "tingling", "weakness in limbs",
        "facial drooping", "blackout", "fits", "difficulty speaking",
        "severe headache", "constant headache", "one sided weakness",
        "double vision", "loss of coordination", "brain fog",
    ],
    "Pediatrics": [
        "child", "infant", "baby", "kid", "toddler", "newborn",
        "my son", "my daughter", "years old fever", "child vomiting",
        "child not eating", "child crying", "child rash", "child cough",
        "immunization", "vaccination", "growth concern", "child fever",
        "school age", "months old",
    ],
    "Gynecology": [
        "pregnancy", "pregnant", "periods", "menstrual", "missed period",
        "delivery", "ovarian", "uterus", "vaginal", "pcos", "pcod",
        "menopause", "breast pain", "irregular periods", "heavy bleeding",
        "period pain", "cramps", "spotting", "labor pain",
        "breast lump", "vaginal discharge", "fertility", "contraception",
    ],
    "Gastroenterology": [
        "stomach pain", "abdominal pain", "acidity", "gastric", "ulcer",
        "liver", "jaundice", "constipation", "irritable bowel", "ibs",
        "bloating", "gas", "indigestion", "acid reflux", "stomach ache",
        "belly pain", "loose motion", "blood in stool", "heartburn",
        "vomiting blood", "abdominal cramps", "food intolerance",
        "difficulty swallowing", "pancreatitis",
    ],
    "Orthopedics": [
        "bone", "fracture", "knee pain", "back pain", "spine",
        "arthritis", "shoulder pain", "ankle pain",
        "hip pain", "muscle pain", "sprain", "swollen joint",
        "leg pain", "thigh pain", "calf pain", "limb pain",
        "foot pain", "wrist pain", "elbow pain", "neck pain",
        "muscle strain", "ligament injury", "stiff joint", "bone pain",
        "spinal pain", "cannot walk", "difficulty walking", "limp",
    ],
    "Dermatology": [
        "skin", "acne", "eczema", "psoriasis", "hair fall", "itching",
        "rashes", "pimples", "fungal", "ringworm", "hives", "allergy skin",
        "dry skin", "pigmentation", "skin rash", "skin allergy",
        "boils", "blisters", "skin infection", "mole", "wart",
        "hair loss", "dandruff", "skin discoloration", "itchy skin",
    ],
    "Ophthalmology": [
        "eye pain", "blurred vision", "redness in eye", "eye discharge",
        "vision loss", "watery eyes", "eye infection", "cataract",
        "eye irritation", "spectacles", "glasses", "eye strain",
        "double vision", "eye swelling", "itchy eyes", "dry eyes",
        "sensitivity to light", "eye injury", "sty", "conjunctivitis",
    ],
    "General Medicine": [
        "fever", "cold", "cough", "fatigue", "headache", "body ache",
        "joint pain",
        "weakness", "vomiting", "nausea", "diarrhea", "rash", "chills",
        "sweating", "flu", "viral", "infection", "sore throat",
        "runny nose", "loss of appetite", "weight loss", "tiredness",
        "dengue", "malaria", "typhoid", "food poisoning", "body pain",
        "high temperature", "cold and cough", "general checkup",
        "not feeling well", "unwell", "tired", "sneezing", "congestion",
        "throat pain", "mild fever", "low energy", "feeling weak",
    ],
}

PRIORITY_ORDER = [
    "Emergency", "Cardiology", "Neurology", "Pediatrics", "Gynecology",
    "Gastroenterology", "Orthopedics", "Dermatology", "Ophthalmology",
    "General Medicine",
]

DENGUE_KEYWORDS = [
    "fever", "headache", "rash", "joint pain", "pain behind eyes",
    "body ache", "nausea", "platelet", "dengue",
]


def suggest_department(symptoms_text, month=None):
    if not symptoms_text:
        return {
            "department": "General Medicine",
            "confidence": "low",
            "all_matches": [],
            "seasonal_alert": None,
        }

    text = symptoms_text.lower()

    try:
        word_tokenize(text)
    except Exception:
        pass

    matched = {}
    for dept, keywords in SYMPTOM_MAP.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            matched[dept] = score

    if not matched:
        return {
            "department": "General Medicine",
            "confidence": "low",
            "all_matches": ["General Medicine"],
            "seasonal_alert": None,
        }

    sorted_depts = sorted(
        matched.keys(),
        key=lambda d: (
            PRIORITY_ORDER.index(d) if d in PRIORITY_ORDER else 99,
            -matched[d],
        ),
    )
    top_dept = sorted_depts[0]
    top_score = matched[top_dept]
    confidence = "high" if top_score >= 2 else "medium"

    seasonal_alert = None
    if month:
        alert_data = get_seasonal_alert(month, symptoms_text)
        if alert_data.get("alert") and top_dept in alert_data.get("alert_departments", []):
            dengue_match = [kw for kw in DENGUE_KEYWORDS if kw in text]
            tier = get_alert_tier(month, len(dengue_match), alert_data)
            season = alert_data.get("season", "")
            diseases = alert_data.get("risk_diseases", [])

            if tier == "high":
                warning = (
                    "Your symptoms match dengue fever patterns. "
                    "Please seek medical attention promptly and get a platelet count test done."
                )
            elif tier == "elevated":
                warning = (
                    f"Some of your symptoms overlap with common {season} illnesses "
                    f"({', '.join(diseases[:2])}). Monitor closely and consult a doctor if symptoms worsen."
                )
            else:
                warning = f"It is currently {season} season in Bengaluru. Stay alert for {', '.join(diseases[:2])}."

            seasonal_alert = {
                "tier": tier,
                "warning": warning,
                "season": season,
                "risk_diseases": diseases,
                "matched_keywords": dengue_match,
                "recommended_departments": alert_data.get("alert_departments"),
            }

    return {
        "department": top_dept,
        "confidence": confidence,
        "all_matches": sorted_depts[:3],
        "seasonal_alert": seasonal_alert,
    }
