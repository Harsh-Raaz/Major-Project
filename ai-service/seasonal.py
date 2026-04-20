from dataset_loader import DISEASES_BY_MONTH

SEASONAL_CALENDAR = {
    1: {
        "season": "Winter",
        "risk_diseases": ["Influenza", "Pneumonia", "Asthma", "Bronchitis"],
        "alert_departments": ["General Medicine"],
        "severity": "medium",
    },
    2: {
        "season": "Late Winter",
        "risk_diseases": ["Chickenpox", "Measles", "Flu"],
        "alert_departments": ["General Medicine", "Dermatology"],
        "severity": "medium",
    },
    3: {
        "season": "Summer",
        "risk_diseases": [
            "Heat Stroke",
            "Food Poisoning",
            "Chickenpox",
            "Dehydration",
        ],
        "alert_departments": ["Emergency", "General Medicine"],
        "severity": "high",
    },
    4: {
        "season": "Summer",
        "risk_diseases": ["Heat Stroke", "Dehydration", "Food Poisoning"],
        "alert_departments": ["Emergency", "General Medicine"],
        "severity": "high",
    },
    5: {
        "season": "Summer",
        "risk_diseases": [
            "Heat Stroke",
            "Dehydration",
            "Food Poisoning",
            "Gastroenteritis",
        ],
        "alert_departments": ["Emergency", "General Medicine", "Gastroenterology"],
        "severity": "high",
    },
    6: {
        "season": "Monsoon",
        "risk_diseases": [
            "Dengue",
            "Malaria",
            "Chikungunya",
            "Typhoid",
            "Leptospirosis",
        ],
        "alert_departments": ["General Medicine", "Emergency"],
        "severity": "critical",
    },
    7: {
        "season": "Monsoon",
        "risk_diseases": [
            "Dengue",
            "Malaria",
            "Chikungunya",
            "Typhoid",
            "Cholera",
        ],
        "alert_departments": ["General Medicine", "Emergency"],
        "severity": "critical",
    },
    8: {
        "season": "Monsoon",
        "risk_diseases": [
            "Dengue",
            "Malaria",
            "Leptospirosis",
            "Hepatitis A",
        ],
        "alert_departments": ["General Medicine", "Emergency"],
        "severity": "critical",
    },
    9: {
        "season": "Monsoon",
        "risk_diseases": ["Dengue", "Typhoid", "Gastroenteritis", "Malaria"],
        "alert_departments": ["General Medicine", "Gastroenterology"],
        "severity": "high",
    },
    10: {
        "season": "Post-Monsoon",
        "risk_diseases": ["Dengue", "Influenza", "Viral Fever"],
        "alert_departments": ["General Medicine"],
        "severity": "medium",
    },
    11: {
        "season": "Winter",
        "risk_diseases": ["Influenza", "Pneumonia", "Bronchitis", "Asthma"],
        "alert_departments": ["General Medicine"],
        "severity": "medium",
    },
    12: {
        "season": "Winter",
        "risk_diseases": ["Influenza", "Pneumonia", "Asthma", "Cold"],
        "alert_departments": ["General Medicine"],
        "severity": "medium",
    },
}


def _merge_disease_lists(calendar_list, dataset_list):
    seen = set()
    out = []
    for item in list(calendar_list) + list(dataset_list):
        if not item:
            continue
        key = item.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item.strip())
    return out[:12]


def get_seasonal_alert(month, symptoms=""):
    if month not in SEASONAL_CALENDAR:
        return {"alert": False}

    data = SEASONAL_CALENDAR[month]
    diseases_cal = data["risk_diseases"]
    from_ds = DISEASES_BY_MONTH.get(int(month), [])
    diseases = _merge_disease_lists(diseases_cal, from_ds)
    season = data["season"]
    severity = data["severity"]

    message = (
        f"It is currently {season} season in India. "
        f"High risk of {', '.join(diseases[:3])}. "
    )

    if severity == "critical":
        message += (
            "Please take precautions and consult a doctor if you have any symptoms."
        )
    elif severity == "high":
        message += "Take preventive measures and stay hydrated."
    else:
        message += "Stay warm and maintain hygiene."

    return {
        "alert": True,
        "season": season,
        "severity": severity,
        "risk_diseases": diseases,
        "alert_departments": data["alert_departments"],
        "message": message,
        "month": month,
    }
