import math

from dataset_loader import DOCTOR_EXP_BY_SPECIALIZATION


def _dataset_exp_floor(doctor: dict):
    for label in (doctor.get("department"), doctor.get("qualification")):
        if not isinstance(label, str):
            continue
        lab = label.strip()
        if lab in DOCTOR_EXP_BY_SPECIALIZATION:
            return DOCTOR_EXP_BY_SPECIALIZATION[lab]
        low = lab.lower()
        for spec, mean_exp in DOCTOR_EXP_BY_SPECIALIZATION.items():
            if spec.lower() in low:
                return mean_exp
    return None


def _minmax(values):
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi <= lo:
        return [0.5] * len(values)
    return [(v - lo) / (hi - lo) for v in values]


def recommend_hospitals(hospitals, patient_lat, patient_lng):
    if not hospitals:
        return []

    for h in hospitals:
        lat = h.get("lat") or 0
        lng = h.get("lng") or 0
        R = 6371
        d_lat = math.radians(lat - patient_lat)
        d_lng = math.radians(lng - patient_lng)
        a = math.sin(d_lat / 2) ** 2 + math.cos(
            math.radians(patient_lat)
        ) * math.cos(math.radians(lat)) * math.sin(d_lng / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        h["distance_km"] = round(R * c, 2)

    inv_dist = [1.0 / max(h.get("distance_km") or 0.1, 0.1) for h in hospitals]
    ratings = [float(h.get("rating") or 0) for h in hospitals]
    slots = [float(h.get("available_slots") or 0) for h in hospitals]

    n_inv = _minmax(inv_dist)
    n_r = _minmax(ratings)
    n_s = _minmax(slots)

    for i, h in enumerate(hospitals):
        # Weighted mix of normalized (1/distance), rating, and slots — same ratios as spec.
        score = 0.4 * n_inv[i] + 0.3 * n_r[i] + 0.3 * n_s[i]
        h["score"] = round(score, 3)

    hospitals.sort(key=lambda x: x["score"], reverse=True)
    return hospitals


def recommend_doctors(doctors):
    if not doctors:
        return []

    for d in doctors:
        current = d.get("current_patients_today", 0) or 0
        max_cap = d.get("max_patients_per_day", 40) or 40
        if max_cap <= 0:
            max_cap = 40
        load_frac = min(1.0, current / max_cap)
        d["load_index"] = round(load_frac * 100, 1)
        d["overloaded"] = d["load_index"] >= 75
        d["available_slots_count"] = max(0, max_cap - current)

    experiences = []
    for d in doctors:
        exp = float(d.get("experience_years", 0) or 0)
        bench = _dataset_exp_floor(d)
        if bench is not None:
            exp = max(exp, float(bench))
        experiences.append(exp)

    load_fracs = []
    for d in doctors:
        mc = d.get("max_patients_per_day", 40) or 40
        if mc <= 0:
            mc = 40
        load_fracs.append(min(1.0, (d.get("current_patients_today", 0) or 0) / mc))

    low_load = [1.0 - lf for lf in load_fracs]
    ratings = [float(d.get("rating", 0) or 0) for d in doctors]

    n_exp = _minmax(experiences)
    n_low_load = _minmax(low_load)
    n_rating = _minmax(ratings)

    for i, d in enumerate(doctors):
        score = 0.4 * n_exp[i] + 0.4 * n_low_load[i] + 0.2 * n_rating[i]
        d["score"] = round(score, 3)

    doctors.sort(key=lambda x: x["score"], reverse=True)
    return doctors
