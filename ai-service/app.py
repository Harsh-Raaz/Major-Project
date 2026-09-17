from datetime import datetime
from uuid import uuid4

from ml.predict import predict_noshow
from flask import Flask, jsonify, request
from flask_cors import CORS

import dataset_loader  # noqa: F401 — load CSVs once at startup
from busy_hours import analyze_busy_hours
from chatbot import handle_chat_message, reset_session
from emergency_priority import classify_priority, prioritize_queue
from load_balancer import balance_slots, check_doctor_load
from recommender import recommend_doctors, recommend_hospitals
from seasonal import get_seasonal_alert, get_full_seasonal_calendar
from symptom_classifier import suggest_department
from wait_time import estimate_wait

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Hospital AI Service running", "port": 5001})


@app.route("/recommend-hospital", methods=["POST"])
def hospital_recommendation():
    try:
        data = request.get_json(silent=True) or {}
        hospitals = data.get("hospitals", [])
        patient_lat = data.get("patient_lat", 12.9716)
        patient_lng = data.get("patient_lng", 77.5946)

        if not hospitals:
            return jsonify([])

        result = recommend_hospitals(hospitals, patient_lat, patient_lng)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/recommend-doctor", methods=["POST"])
def doctor_recommendation():
    try:
        data = request.get_json(silent=True) or {}
        doctors = data.get("doctors", [])

        if not doctors:
            return jsonify([])

        result = recommend_doctors(doctors)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/suggest-department", methods=["POST"])
def department_suggestion():
    try:
        data = request.get_json(silent=True) or {}
        symptoms = data.get("symptoms", "")
        month = data.get("month", datetime.now().month)

        result = suggest_department(symptoms, month)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/seasonal-alert", methods=["POST"])
def seasonal_alert():
    try:
        data = request.get_json(silent=True) or {}
        month = data.get("month", datetime.now().month)
        symptoms = data.get("symptoms", "")

        result = get_seasonal_alert(month, symptoms)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/seasonal-calendar", methods=["GET"])
def seasonal_calendar():
    try:
        return jsonify(get_full_seasonal_calendar())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/estimate-wait", methods=["POST"])
def wait_estimate():
    try:
        data = request.get_json(silent=True) or {}
        patients_before = data.get("patients_before", 0)
        avg_consultation_mins = data.get("avg_consultation_mins", 12)

        result = estimate_wait(patients_before, avg_consultation_mins)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/load-balance-slot", methods=["POST"])
def load_balance_slot():
    try:
        data = request.get_json(silent=True) or {}
        slots = data.get("slots", [])
        result = balance_slots(slots)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/check-doctor-load", methods=["POST"])
def doctor_load():
    try:
        data = request.get_json(silent=True) or {}
        doctor = data.get("doctor", {})
        result = check_doctor_load(doctor)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/emergency-priority", methods=["POST"])
def emergency_priority():
    try:
        data = request.get_json(silent=True) or {}
        patients = data.get("patients", [])
        result = prioritize_queue(patients)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/classify-priority", methods=["POST"])
def classify_priority_endpoint():
    try:
        data = request.get_json(silent=True) or {}
        symptoms = data.get("symptoms", "")
        priority, level = classify_priority(symptoms)
        return jsonify(
            {
                "priority": priority,
                "priority_level": level,
                "action": {
                    "emergency": "Immediate attention required.",
                    "urgent": "Must be seen within 30 minutes.",
                    "normal": "Normal queue.",
                }[priority],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/busy-hours", methods=["POST"])
def busy_hours_endpoint():
    try:
        data = request.get_json(silent=True) or {}
        bookings = data.get("bookings", [])
        result = analyze_busy_hours(bookings)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict-noshow", methods=["POST"])
def noshow_prediction():
    try:
        data = request.get_json(silent=True) or {}

        result = predict_noshow(data)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/chatbot/message", methods=["POST"])
def chatbot_message():
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get("session_id") or data.get("sessionId") or f"anon-{uuid4().hex[:8]}"
        message = data.get("message", "")

        if not message or not str(message).strip():
            return jsonify({
                "reply": "Please tell me a little more about your symptoms so I can help.",
                "is_complete": False,
                "department": None,
                "urgency": None,
                "summary": None,
                "seasonal_alert": None,
                "session_id": session_id,
            }), 400

        result = handle_chat_message(session_id, str(message).strip())
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/chatbot/reset", methods=["POST"])
def chatbot_reset():
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get("session_id") or data.get("sessionId")
        if session_id:
            reset_session(session_id)
        return jsonify({"status": "reset", "session_id": session_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True, threaded=True)
