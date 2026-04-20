from datetime import datetime

from dataset_loader import DEFAULT_BOOKING_PATTERNS


def analyze_busy_hours(bookings):
    rows = list(bookings) if bookings else []
    if not rows and DEFAULT_BOOKING_PATTERNS:
        rows = list(DEFAULT_BOOKING_PATTERNS)

    if not rows:
        return {
            "peak_hours": [],
            "peak_days": [],
            "peak_departments": [],
            "current_hour_warning": None,
        }

    hour_counts = {}
    day_counts = {}
    dept_counts = {}

    for b in rows:
        hour = b.get("hour", 0)
        if hour is None:
            hour = 0
        try:
            hour = int(hour) % 24
        except (TypeError, ValueError):
            hour = 0
        day = b.get("day_name", "Monday")
        dept = b.get("department", "General Medicine")

        hour_counts[hour] = hour_counts.get(hour, 0) + 1
        day_counts[day] = day_counts.get(day, 0) + 1
        dept_counts[dept] = dept_counts.get(dept, 0) + 1

    sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
    top_hour_count = sorted_hours[0][1] if sorted_hours else 0
    peak_hours = []
    for h, c in sorted_hours[:3]:
        next_h = (h + 1) % 24
        peak_hours.append(
            {
                "hour": h,
                "count": c,
                "label": f"{h:02d}:00 - {next_h:02d}:00",
                "level": "peak" if c == top_hour_count else "moderate",
            }
        )

    sorted_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)
    peak_days = [{"day": d, "count": c} for d, c in sorted_days[:3]]

    sorted_depts = sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)
    peak_departments = [{"department": d, "count": c} for d, c in sorted_depts[:3]]

    current_hour = datetime.now().hour
    avg_count = sum(hour_counts.values()) / len(hour_counts) if hour_counts else 0
    warning = None
    if current_hour in hour_counts and avg_count > 0:
        if hour_counts[current_hour] > avg_count * 1.5:
            warning = (
                f"Current hour {current_hour:02d}:00 is a peak hour. "
                f"Expect higher wait times than usual."
            )

    return {
        "peak_hours": peak_hours,
        "peak_days": peak_days,
        "peak_departments": peak_departments,
        "current_hour_warning": warning,
        "total_bookings_analyzed": len(rows),
    }
