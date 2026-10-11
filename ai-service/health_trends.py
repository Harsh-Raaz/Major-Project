"""Statistical demand anomalies; these signals do not diagnose disease outbreaks."""
from datetime import datetime, timedelta, timezone
from math import isfinite
from statistics import mean, pstdev

from seasonal import SEASONAL_CALENDAR

KOLKATA = timezone(timedelta(hours=5, minutes=30))


def detect_trends(series: dict, current_month: int) -> dict:
    if not isinstance(series, dict) or set(series) != {"departments", "keywords"}:
        raise ValueError("series must contain departments and keywords objects")
    if isinstance(current_month, bool) or not isinstance(current_month, int) or not 1 <= current_month <= 12:
        raise ValueError("month must be an integer from 1 to 12")
    now = datetime.now(KOLKATA)
    alerts, statuses = [], {"departments": {}, "keywords": {}}
    sufficient = 0
    season = SEASONAL_CALENDAR[current_month]
    for group, signal_type in (("departments", "department"), ("keywords", "keyword")):
        if not isinstance(series[group], dict):
            raise ValueError(f"{group} must be an object")
        for name, values in series[group].items():
            if not isinstance(name, str) or not name.strip() or len(name) > 100:
                raise ValueError("signal names must be nonempty strings of at most 100 characters")
            if not isinstance(values, list) or len(values) != 9 or any(
                isinstance(v, bool) or not isinstance(v, (int, float)) or not isfinite(v) or v < 0
                for v in values
            ):
                raise ValueError("each signal requires nine finite, nonnegative weekly counts")
            baseline, current = values[:8], values[8]
            if sum(v > 0 for v in baseline) < 4:
                statuses[group][name] = "insufficient_baseline"
                continue
            statuses[group][name] = "ok"
            sufficient += 1
            avg = mean(baseline)
            z = (current - avg) / max(pstdev(baseline), 1.0)
            ratio = current / max(avg, 1.0)
            pct = round((ratio - 1) * 100)
            tier = None
            if current >= 5:
                if ratio >= 2 and z >= 3:
                    tier = "high"
                elif ratio >= 1.5 and z >= 2:
                    tier = "elevated"
                elif ratio >= 1.25 and z >= 1:
                    tier = "watch"
            if not tier:
                continue
            seasonal_match = signal_type == "department" and name in season["alert_departments"]
            subject = f"{name} bookings" if signal_type == "department" else f'Searches mentioning "{name}"'
            message = f"{subject} are {pct}% above the 8-week average this week."
            if seasonal_match:
                message += f" This matches the usual {season['season'].lower()} illness pattern; clinical assessment and tests are needed to tell causes apart."
            else:
                message += " This is a demand signal, not a diagnosis or confirmation of an outbreak."
            alerts.append({
                "type": signal_type, "name": name, "current": current,
                "baseline_avg": round(avg, 2), "pct_change": pct,
                "z_score": round(z, 2), "tier": tier,
                "seasonal_match": seasonal_match, "message": message,
                "seasonal_diseases": list(season["risk_diseases"]) if seasonal_match else [],
            })
    ranks = {"high": 0, "elevated": 1, "watch": 2}
    alerts.sort(key=lambda a: (ranks[a["tier"]], -a["pct_change"], a["name"]))
    return {
        "generated_at": now.isoformat(),
        "window": {"current_start": (now - timedelta(days=7)).isoformat(), "current_end": now.isoformat()},
        "alerts": alerts,
        "baseline_status": "ok" if sufficient else "insufficient",
        "series_status": statuses,
    }
