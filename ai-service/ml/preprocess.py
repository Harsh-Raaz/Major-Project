import pandas as pd
import json

# Load raw dataset
df = pd.read_csv("data/noshow_raw.csv")

# Convert date columns
df["ScheduledDay"] = pd.to_datetime(df["ScheduledDay"])
df["AppointmentDay"] = pd.to_datetime(df["AppointmentDay"])

# Calculate number of days between booking and appointment
df["lead_time_days"] = (
    df["AppointmentDay"] - df["ScheduledDay"]
).dt.days

# Prevent negative values
df["lead_time_days"] = df["lead_time_days"].clip(lower=0)

# Day of week:
# Monday = 0, Sunday = 6
df["appointment_dow"] = df["AppointmentDay"].dt.dayofweek

# Number of appointments associated with each patient
df["patient_appt_count"] = (
    df.groupby("PatientId")["PatientId"].transform("count")
)

# Convert Gender into numerical value
df["gender_female"] = (df["Gender"] == "F").astype(int)

# Convert target:
# 1 = No-show
# 0 = Attended
df["target"] = (df["No-show"] == "Yes").astype(int)

# Features used by the ML model
feature_cols = [
    "Age",
    "Scholarship",
    "Hipertension",
    "Diabetes",
    "Alcoholism",
    "Handcap",
    "SMS_received",
    "lead_time_days",
    "appointment_dow",
    "patient_appt_count",
    "gender_female"
]

# Keep only required columns
clean_df = df[feature_cols + ["target"]]

# Remove missing values
clean_df = clean_df.dropna()

# Remove invalid ages
clean_df = clean_df[clean_df["Age"] >= 0]

# Save cleaned dataset
clean_df.to_csv("data/noshow_clean.csv", index=False)

# Save feature names for later prediction
with open("feature_columns.json", "w") as f:
    json.dump(feature_cols, f)

print("Cleaned dataset shape:", clean_df.shape)

print("\nTarget distribution:")
print(clean_df["target"].value_counts())

print("\nTarget percentage:")
print(clean_df["target"].value_counts(normalize=True))