from dataset_loader import REFERENCE_SLOT_CAPACITY


def get_slot_load_factor(current_bookings, capacity):
    if capacity <= 0:
        capacity = REFERENCE_SLOT_CAPACITY
    return round((current_bookings / capacity) * 100, 1)


def get_slot_status(load_factor):
    if load_factor >= 100:
        return "full"
    if load_factor >= 80:
        return "almost_full"
    return "available"


def balance_slots(slots):
    if not slots:
        return {"suggested_slots": [], "all_slots": []}

    for s in slots:
        current = s.get("current_bookings", 0) or 0
        capacity = s.get("capacity", 0) or 0
        if capacity <= 0:
            capacity = REFERENCE_SLOT_CAPACITY
            s["capacity"] = capacity
        lf = get_slot_load_factor(current, capacity)
        s["load_factor"] = lf
        s["status"] = get_slot_status(lf)

    available = [s for s in slots if s["status"] != "full"]
    available.sort(key=lambda x: x["load_factor"])

    return {
        "suggested_slots": available,
        "all_slots": slots,
        "total": len(slots),
        "available_count": len(available),
        "full_count": len(slots) - len(available),
    }


def check_doctor_load(doctor):
    current = doctor.get("current_patients_today", 0) or 0
    max_cap = doctor.get("max_patients_per_day", 40) or 40
    if max_cap <= 0:
        max_cap = 40
    load_index = round((current / max_cap) * 100, 1)

    return {
        "load_index": load_index,
        "overloaded": load_index >= 75,
        "status": (
            "overloaded"
            if load_index >= 75
            else "busy"
            if load_index >= 50
            else "available"
        ),
        "message": (
            f"Doctor is at {load_index}% capacity. "
            + (
                "Consider another doctor."
                if load_index >= 75
                else "Moderately busy."
                if load_index >= 50
                else "Available."
            )
        ),
    }
