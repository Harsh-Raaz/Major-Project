import nltk
from nltk.tokenize import word_tokenize

from seasonal import get_seasonal_alert

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
        "unconscious",
        "not breathing",
        "severe bleeding",
        "accident",
        "stroke",
        "paralysis",
        "seizure",
        "heart attack",
        "fainted",
        "collapsed",
        "unresponsive",
    ],
    "Cardiology": [
        "chest pain",
        "chest tightness",
        "palpitations",
        "breathlessness",
        "irregular heartbeat",
        "heart",
        "blood pressure",
        "bp high",
        "bp low",
        "shortness of breath",
    ],
    "Neurology": [
        "memory loss",
        "confusion",
        "tremor",
        "migraine",
        "epilepsy",
        "numbness",
        "dizziness",
        "vertigo",
        "headache severe",
        "loss of balance",
        "slurred speech",
    ],
    "Pediatrics": [
        "child",
        "infant",
        "baby",
        "kid",
        "toddler",
        "newborn",
        "my son",
        "my daughter",
        "years old fever",
        "child vomiting",
    ],
    "Gynecology": [
        "pregnancy",
        "pregnant",
        "periods",
        "menstrual",
        "missed period",
        "delivery",
        "ovarian",
        "uterus",
        "vaginal",
        "pcos",
        "pcod",
        "menopause",
        "breast pain",
    ],
    "Gastroenterology": [
        "stomach pain",
        "abdominal pain",
        "acidity",
        "gastric",
        "ulcer",
        "liver",
        "jaundice",
        "constipation",
        "irritable bowel",
        "ibs",
        "bloating",
        "gas",
        "indigestion",
        "acid reflux",
    ],
    "Orthopedics": [
        "bone",
        "fracture",
        "knee pain",
        "back pain",
        "spine",
        "arthritis",
        "joint pain",
        "shoulder pain",
        "ankle pain",
        "hip pain",
        "muscle pain",
        "sprain",
        "swollen joint",
    ],
    "Dermatology": [
        "skin",
        "acne",
        "eczema",
        "psoriasis",
        "hair fall",
        "itching",
        "rashes",
        "pimples",
        "fungal",
        "ringworm",
        "hives",
        "allergy skin",
        "dry skin",
        "pigmentation",
    ],
    "Ophthalmology": [
        "eye pain",
        "blurred vision",
        "redness in eye",
        "eye discharge",
        "vision loss",
        "watery eyes",
        "eye infection",
        "cataract",
        "eye irritation",
        "spectacles",
        "glasses",
    ],
    "General Medicine": [
        "fever",
        "cold",
        "cough",
        "fatigue",
        "headache",
        "body ache",
        "weakness",
        "vomiting",
        "nausea",
        "diarrhea",
        "rash",
        "chills",
        "sweating",
        "flu",
        "viral",
        "infection",
        "sore throat",
        "runny nose",
        "loss of appetite",
        "weight loss",
        "tiredness",
        "dengue",
        "malaria",
        "typhoid",
        "food poisoning",
    ],
}

PRIORITY_ORDER = [
    "Emergency",
    "Cardiology",
    "Neurology",
    "Pediatrics",
    "Gynecology",
    "Gastroenterology",
    "Orthopedics",
    "Dermatology",
    "Ophthalmology",
    "General Medicine",
]

DENGUE_KEYWORDS = [
    "fever",
    "headache",
    "rash",
    "joint pain",
    "pain behind eyes",
    "body ache",
    "nausea",
    "platelet",
    "dengue",
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
        score = 0
        for kw in keywords:
            if kw in text:
                score += 1
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
        if alert_data.get("alert"):
            dengue_match = sum(1 for kw in DENGUE_KEYWORDS if kw in text)
            if dengue_match >= 2 and month in [6, 7, 8, 9]:
                seasonal_alert = {
                    "warning": (
                        "Your symptoms match dengue fever patterns. "
                        "Please seek medical attention immediately and "
                        "get a platelet count test done."
                    ),
                    "season": alert_data.get("season"),
                    "risk_diseases": alert_data.get("risk_diseases"),
                    "recommended_departments": alert_data.get("alert_departments"),
                }
            else:
                diseases = alert_data.get("risk_diseases", [])
                season = alert_data.get("season", "")
                seasonal_alert = {
                    "warning": (
                        f"It is {season} season. High risk of "
                        f"{', '.join(diseases[:2])}. "
                        f"Consult a doctor promptly."
                    ),
                    "season": season,
                    "risk_diseases": diseases,
                }

    return {
        "department": top_dept,
        "confidence": confidence,
        "all_matches": sorted_depts[:3],
        "seasonal_alert": seasonal_alert,
    }
