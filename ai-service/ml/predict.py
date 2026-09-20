import joblib
import json
import os
import pandas as pd

# Get the folder where predict.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load trained model
model = joblib.load(
    os.path.join(BASE_DIR, "noshow_model.pkl")
)

# Load feature columns in the same order used during training
with open(
    os.path.join(BASE_DIR, "feature_columns.json")
) as f:
    feature_cols = json.load(f)


def predict_noshow(data):

    row = pd.DataFrame([{
        "Age": data.get("age", 30),
        "Scholarship": data.get("scholarship", 0),
        "Hipertension": data.get("hypertension", 0),
        "Diabetes": data.get("diabetes", 0),
        "Alcoholism": data.get("alcoholism", 0),
        "Handcap": data.get("handicap", 0),
        "SMS_received": data.get("sms_received", 1),
        "lead_time_days": data.get("lead_time_days", 1),
        "appointment_dow": data.get("appointment_dow", 1),
        "patient_appt_count": data.get("patient_appt_count", 1),
        "gender_female": data.get("gender_female", 1)
    }])[feature_cols]

    # Get probability of no-show
    prob = float(model.predict_proba(row)[0][1])

    # Convert probability into a risk category
    if prob >= 0.6:
        risk = "high"
        recommendation = "Send extra reminder and confirm by phone"

    elif prob >= 0.3:
        risk = "medium"
        recommendation = "Send SMS reminder"

    else:
        risk = "low"
        recommendation = "Standard reminder sufficient"

    return {
        "no_show_probability": round(prob, 3),
        "risk_level": risk,
        "recommendation": recommendation
    }


# Test the model directly
if __name__ == "__main__":

    test_data = {
        "age": 25,
        "lead_time_days": 10,
        "sms_received": 0,
        "appointment_dow": 0
    }

    result = predict_noshow(test_data)

    print("Prediction:")
    print(result)