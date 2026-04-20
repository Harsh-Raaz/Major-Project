EMERGENCY_KEYWORDS = [
    "chest pain",
    "not breathing",
    "unconscious",
    "stroke",
    "accident",
    "severe bleeding",
    "seizure",
    "paralysis",
    "heart attack",
    "fainted",
    "collapsed",
    "unresponsive",
    "difficulty breathing",
    "cannot breathe",
]

URGENT_KEYWORDS = [
    "high fever",
    "child fever",
    "infant fever",
    "severe pain",
    "bleeding",
    "104",
    "105",
    "vomiting blood",
    "severe headache",
    "broken bone",
    "fracture",
    "deep cut",
    "allergic reaction",
    "baby not breathing",
    "newborn",
    "severe burn",
]


def classify_priority(symptoms):
    if not symptoms:
        return "normal", 3

    text = symptoms.lower()

    if any(kw in text for kw in EMERGENCY_KEYWORDS):
        return "emergency", 1

    if any(kw in text for kw in URGENT_KEYWORDS):
        return "urgent", 2

    return "normal", 3


def prioritize_queue(patients):
    if not patients:
        return {
            "queue": [],
            "total": 0,
            "emergency_count": 0,
            "urgent_count": 0,
            "normal_count": 0,
        }

    for p in patients:
        symptoms = p.get("symptoms", "")
        priority, level = classify_priority(symptoms)
        p["priority"] = priority
        p["priority_level"] = level
        p["action"] = {
            "emergency": "Immediate attention required. Alert doctor and staff now.",
            "urgent": "Urgent case. Must be seen within 30 minutes.",
            "normal": "Normal queue. Wait for scheduled slot.",
        }[priority]

    patients.sort(key=lambda x: x["priority_level"])

    return {
        "queue": patients,
        "total": len(patients),
        "emergency_count": sum(1 for p in patients if p["priority"] == "emergency"),
        "urgent_count": sum(1 for p in patients if p["priority"] == "urgent"),
        "normal_count": sum(1 for p in patients if p["priority"] == "normal"),
    }
