def estimate_wait(patients_before, avg_consultation_mins):
    if patients_before < 0:
        patients_before = 0
    if avg_consultation_mins <= 0:
        avg_consultation_mins = 12

    estimated = patients_before * avg_consultation_mins

    urgency = "low"
    if estimated > 60:
        urgency = "high"
    elif estimated > 30:
        urgency = "medium"

    return {
        "estimated_wait_mins": estimated,
        "patients_before": patients_before,
        "avg_consultation_mins": avg_consultation_mins,
        "urgency": urgency,
        "message": f"Estimated waiting time is {estimated} minutes.",
    }
