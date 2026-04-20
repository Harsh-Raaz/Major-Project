"""
One-off preprocessing: load raw CSVs, clean, save to data/processed/.
Does not modify runtime AI modules.
"""
import re
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"


def _standardize_column_name(name):
    if name is None or (isinstance(name, float) and np.isnan(name)):
        return "unnamed"
    s = str(name).strip().lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[/\\|]+", "_", s)
    s = re.sub(r"[^a-z0-9_]+", "", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "unnamed"


def _make_unique_columns(cols):
    seen = {}
    out = []
    for c in cols:
        base = c
        if base not in seen:
            seen[base] = 0
            out.append(base)
        else:
            seen[base] += 1
            out.append("{}_{}".format(base, seen[base]))
    return out


def standardize_columns(df):
    names = [_standardize_column_name(c) for c in df.columns]
    df.columns = _make_unique_columns(names)
    return df


def fill_missing_values(df):
    df = df.copy()
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            m = df[col].mean()
            fill = 0 if pd.isna(m) else m
            df[col] = df[col].fillna(fill)
            continue
        coerced = pd.to_numeric(df[col], errors="coerce")
        numeric_ratio = float(coerced.notna().sum()) / max(len(df), 1)
        if numeric_ratio > 0.5:
            m = coerced.mean()
            fill = 0 if pd.isna(m) else m
            df[col] = coerced.fillna(fill)
        else:
            s = df[col].astype(str).replace(
                {"nan": "Unknown", "NaT": "Unknown", "None": "Unknown"}
            )
            df[col] = s.fillna("Unknown")
            df[col] = df[col].replace("", "Unknown")
    return df


def clean_dataframe(df):
    df = df.drop_duplicates()
    df = standardize_columns(df)
    df = fill_missing_values(df)
    return df


def _save(df, filename):
    path = PROCESSED / filename
    df.to_csv(path, index=False)
    print("Saved: {} ({} rows)".format(path, len(df)))


def _read_csv_default(path):
    return pd.read_csv(path, low_memory=False)


def _read_railways(path):
    return pd.read_csv(path, skiprows=1, header=0, engine="python")


def _read_state_insurance(path):
    return pd.read_csv(path, skiprows=2, header=0, engine="python")


def _read_ayush(path):
    names = [
        "srl",
        "state_ut",
        "hospitals_govt",
        "hospitals_local_body",
        "hospitals_others",
        "hospitals_total",
        "beds_govt",
        "beds_local_body",
        "beds_others",
        "beds_total",
    ]
    return pd.read_csv(path, skiprows=3, header=None, names=names, engine="python")


def _read_number_govt_rural_urban(path):
    df = pd.read_csv(path, skiprows=2, header=None, engine="python")
    if df.shape[1] >= 6:
        df = df.iloc[:, :6]
        df.columns = [
            "state_ut",
            "rural_hospitals_no",
            "rural_beds",
            "urban_hospitals_no",
            "urban_beds",
            "as_on_date",
        ]
    return df


def main():
    if not RAW.is_dir():
        raise SystemExit("Missing directory: {}".format(RAW))
    PROCESSED.mkdir(parents=True, exist_ok=True)

    # --- hospitals_clean.csv ---
    hospital_parts = []
    for name in ("hospitals_in_india.csv", "hospitals_india.zip.csv"):
        p = RAW / name
        if p.exists():
            h = _read_csv_default(p)
            h["source_file"] = name
            hospital_parts.append(h)
    if hospital_parts:
        hospitals_df = pd.concat(hospital_parts, ignore_index=True, sort=False)
        hospitals_df = clean_dataframe(hospitals_df)
        _save(hospitals_df, "hospitals_clean.csv")
    else:
        print("Warning: no hospital CSV found; skipped hospitals_clean.csv")

    # --- doctors_clean.csv ---
    p = RAW / "doctors.csv"
    if p.exists():
        _save(clean_dataframe(_read_csv_default(p)), "doctors_clean.csv")
    else:
        print("Warning: doctors.csv missing; skipped doctors_clean.csv")

    # --- appointments_clean.csv ---
    p = RAW / "appointments.csv"
    if p.exists():
        _save(clean_dataframe(_read_csv_default(p)), "appointments_clean.csv")
    else:
        print("Warning: appointments.csv missing; skipped appointments_clean.csv")

    # --- diseases_clean.csv ---
    p = RAW / "indian_diseases.csv"
    if p.exists():
        _save(clean_dataframe(_read_csv_default(p)), "diseases_clean.csv")
    else:
        print("Warning: indian_diseases.csv missing; skipped diseases_clean.csv")

    # --- er_clean.csv ---
    p = RAW / "hospital_er_data.csv"
    if p.exists():
        _save(clean_dataframe(_read_csv_default(p)), "er_clean.csv")
    else:
        print("Warning: hospital_er_data.csv missing; skipped er_clean.csv")

    # --- beds_clean.csv (combine all bed-related sources) ---
    bed_parts = []

    p = RAW / "hospitals_beds_statewise.csv"
    if p.exists():
        b = _read_csv_default(p)
        b["beds_source"] = "hospitals_beds_statewise.csv"
        bed_parts.append(b)

    p = RAW / "railways_hospitals_beds.csv"
    if p.exists():
        b = _read_railways(p)
        b["beds_source"] = "railways_hospitals_beds.csv"
        bed_parts.append(b)

    p = RAW / "ministry_of_defence_hospitals_beds.csv"
    if p.exists():
        b = _read_csv_default(p)
        b["beds_source"] = "ministry_of_defence_hospitals_beds.csv"
        bed_parts.append(b)

    p = RAW / "state_insurance_hospitals_beds.csv"
    if p.exists():
        b = _read_state_insurance(p)
        b["beds_source"] = "state_insurance_hospitals_beds.csv"
        bed_parts.append(b)

    p = RAW / "ayush_hospitals_number_and_beds.csv"
    if p.exists():
        b = _read_ayush(p)
        b["beds_source"] = "ayush_hospitals_number_and_beds.csv"
        bed_parts.append(b)

    p = RAW / "number_of_govt_hospitals_rural_urban.csv"
    if p.exists():
        b = _read_number_govt_rural_urban(p)
        b["beds_source"] = "number_of_govt_hospitals_rural_urban.csv"
        bed_parts.append(b)

    if bed_parts:
        beds_df = pd.concat(bed_parts, ignore_index=True, sort=False)
        beds_df = clean_dataframe(beds_df)
        _save(beds_df, "beds_clean.csv")
    else:
        print("Warning: no beds CSV found; skipped beds_clean.csv")

    # billing.csv is loaded from raw but not mapped to the six outputs above.
    p = RAW / "billing.csv"
    if p.exists():
        print(
            "Note: billing.csv is not written to a fixed output name "
            "(only the six targets above are produced)."
        )

    print("Done.")


if __name__ == "__main__":
    main()
