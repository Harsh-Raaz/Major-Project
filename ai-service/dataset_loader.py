"""
Load and clean CSV datasets once at import. Exposes globals for seasonal logic,
busy-hour fallbacks, doctor benchmarks, and default slot capacity hints.
"""
import calendar
from pathlib import Path
import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent / "data"
RAW_DIR = DATA_DIR / "raw"


def _clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out.columns = [
        str(c).strip().lower().replace(" ", "_").replace("/", "_").replace(".", "")
        for c in out.columns
    ]
    return out


def _month_name_to_num(name):
    if not isinstance(name, str) or not name.strip():
        return None
    name = name.strip().title()
    for i in range(1, 13):
        if calendar.month_name[i] == name:
            return i
    return None


def _load_indian_diseases():
    path = DATA_DIR / "indian_diseases.csv"
    if not path.exists():
        path = RAW_DIR / "indian_diseases.csv"
    if not path.exists():
        return {}
    df = pd.read_csv(path, low_memory=False)
    df = _clean_columns(df)
    df = df.drop_duplicates()
    if "disease_name" in df.columns:
        df["disease_name"] = df["disease_name"].fillna("").astype(str).str.strip()
    if "month" in df.columns:
        df["month_num"] = df["month"].apply(_month_name_to_num)
    else:
        df["month_num"] = None
    df = df.dropna(subset=["month_num"])
    df["month_num"] = df["month_num"].astype(int)
    if "year" in df.columns:
        df["year"] = pd.to_numeric(df["year"], errors="coerce")
        df = df[df["year"].fillna(0) >= 2018]
    out = {}
    for m, grp in df.groupby("month_num"):
        top = (
            grp["disease_name"]
            .value_counts()
            .head(6)
            .index.tolist()
        )
        out[int(m)] = [t for t in top if t]
    return out


def _load_appointment_patterns():
    path = RAW_DIR / "appointments.csv"
    if not path.exists():
        return []
    df = pd.read_csv(path)
    df = _clean_columns(df)
    df = df.drop_duplicates()
    if "appointment_time" not in df.columns or "appointment_date" not in df.columns:
        return []
    df["appointment_time"] = df["appointment_time"].fillna("09:00:00").astype(str)

    def hour_from_time(t: str) -> int:
        parts = str(t).strip().split(":")
        try:
            return int(float(parts[0])) % 24
        except (ValueError, IndexError):
            return 9

    df["hour"] = df["appointment_time"].map(hour_from_time)
    df["appointment_date"] = pd.to_datetime(df["appointment_date"], errors="coerce")
    df = df.dropna(subset=["appointment_date"])
    day_names = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    df["day_name"] = df["appointment_date"].dt.dayofweek.map(lambda i: day_names[i])
    reason_col = "reason_for_visit" if "reason_for_visit" in df.columns else None
    rows = []
    for _, row in df.iterrows():
        dept = "General Medicine"
        if reason_col and isinstance(row.get(reason_col), str):
            r = row[reason_col].lower()
            if "emergency" in r:
                dept = "Emergency"
            elif "therapy" in r:
                dept = "General Medicine"
        rows.append(
            {
                "hour": int(row["hour"]),
                "day_name": row["day_name"],
                "department": dept,
            }
        )
    return rows


def _load_doctor_benchmarks():
    path = RAW_DIR / "doctors.csv"
    if not path.exists():
        return {}
    df = pd.read_csv(path)
    df = _clean_columns(df)
    df = df.drop_duplicates()
    col_exp = "years_experience" if "years_experience" in df.columns else None
    col_spec = "specialization" if "specialization" in df.columns else None
    if not col_exp or not col_spec:
        return {}
    df[col_exp] = pd.to_numeric(df[col_exp], errors="coerce").fillna(0)
    means = df.groupby(col_spec)[col_exp].mean()
    return {str(k).strip(): float(v) for k, v in means.items() if pd.notna(v)}


def _load_reference_slot_capacity() -> int:
    path = RAW_DIR / "hospitals_beds_statewise.csv"
    if not path.exists():
        return 5
    df = pd.read_csv(path, header=0)
    if df.shape[1] < 2:
        return 5
    totals = pd.to_numeric(df.iloc[:, -2], errors="coerce")
    beds = pd.to_numeric(df.iloc[:, -1], errors="coerce")
    ok = (totals > 0) & beds.notna() & totals.notna()
    ratio = beds[ok] / totals[ok]
    ratio = ratio.replace([np.inf, -np.inf], np.nan).dropna()
    if ratio.empty:
        return 5
    median_ratio = float(ratio.median())
    capped = int(round(min(max(median_ratio / 10.0, 3.0), 15.0)))
    return max(3, min(capped, 15))


# --- Public globals (loaded once) ---
DISEASES_BY_MONTH = _load_indian_diseases()
DEFAULT_BOOKING_PATTERNS = _load_appointment_patterns()
DOCTOR_EXP_BY_SPECIALIZATION = _load_doctor_benchmarks()
REFERENCE_SLOT_CAPACITY = _load_reference_slot_capacity()
