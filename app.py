from flask import Flask, request, jsonify
import joblib
import re
from langdetect import detect
from deep_translator import GoogleTranslator
import random
import json
import os
import sys
import uuid
import pytz
import pandas as pd
from difflib import get_close_matches
from datetime import datetime
from flask_cors import CORS
from flask import send_file

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4

from doctor_recommender import recommend_doctors
from specialist_mapper import get_specialist
from symptom_matcher import rule_based_match
from enhanced_matcher import enhanced_predict_disease
from voice_input import get_voice_input
from advanced_features import news_service, personalization_service, multilingual_service



chatbot_path = os.path.join(os.path.dirname(__file__), "AI-Health-Chatbot-main")
sys.path.append(chatbot_path)
from Health_Chat_bot import chatbot_logic, extract_symptoms, predict_disease, cols

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load artifacts
VECTORIZER = joblib.load(os.path.join(BASE_DIR, "model", "tfidf_vectorizer.pkl"))
LABEL_ENCODER = joblib.load(os.path.join(BASE_DIR, "model", "label_encoder.pkl"))
MODEL = joblib.load(os.path.join(BASE_DIR, "model", "disease_model_logreg.pkl"))   # or rf


app = Flask(__name__)
CORS(app)

# -------------------------
# Storage
# -------------------------
BOOKING_FILE = os.path.join(BASE_DIR, "appointments.json")
otp_storage = {}

def load_appointments():
    if not os.path.exists(BOOKING_FILE):
        return []
    with open(BOOKING_FILE, "r") as f:
        return json.load(f)

def save_appointments(data):
    with open(BOOKING_FILE, "w") as f:
        json.dump(data, f, indent=4)


# -------------------------
# Home
# -------------------------
@app.route("/")
def home():
    return jsonify({"message": "Disease Prediction API Running"})



# -------------------------
# All Doctors
# -------------------------
@app.route("/api/doctors", methods=["GET"])
def get_all_doctors():
    try:
        from doctor_recommender import df as doctors_df

        def _normalize_doctors_frame(source_df):
            frame = source_df.copy()
            frame.columns = frame.columns.str.lower().str.strip()
            required_cols = ["doctor name", "specialization", "location", "rating", "availability"]

            rename_map = {}
            if "doctor_name" in frame.columns and "doctor name" not in frame.columns:
                rename_map["doctor_name"] = "doctor name"
            if "specialist" in frame.columns and "specialization" not in frame.columns:
                rename_map["specialist"] = "specialization"
            if rename_map:
                frame = frame.rename(columns=rename_map)

            for col in required_cols:
                if col not in frame.columns:
                    frame[col] = ""

            frame["specialization"] = frame["specialization"].astype(str).str.lower().str.strip()
            frame["rating"] = pd.to_numeric(frame["rating"], errors="coerce").fillna(0)
            return frame[required_cols]

        specialization = request.args.get("specialization", "").strip().lower()
        force_reload = request.args.get("force_reload", "").strip().lower() in ("1", "true", "yes")
        doctors = _normalize_doctors_frame(doctors_df)

        if force_reload:
            doctors = pd.DataFrame()

        if doctors.empty:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            fallback_files = [
                os.path.join(base_dir, "dataset", "doctordataset.csv"),
                os.path.join(base_dir, "dataset", "clean_doctor_dataset.csv"),
            ]
            for file_path in fallback_files:
                if os.path.exists(file_path):
                    candidate = _normalize_doctors_frame(pd.read_csv(file_path))
                    if not candidate.empty:
                        doctors = candidate
                        break

        alias_map = {
            "vasular surgon": "vascular surgeons",
            "vascular surgeon": "vascular surgeons",
            "vascular surgeons": "vascular surgeons",
            "addictionlogists": "addictionologists",
            "addictionologist": "addictionologists",
            "addictionologists": "addictionologists",
            "dietician": "dietitian",
            "dietitians": "dietitian",
            "dietitian": "dietitian",
        }

        if specialization in alias_map:
            specialization = alias_map[specialization]

        if specialization and specialization != "all":
            filtered = doctors[doctors["specialization"].str.contains(specialization, case=False, na=False)]

            # Fuzzy fallback when user sends near-match specialization text
            if filtered.empty:
                available_specs = doctors["specialization"].dropna().astype(str).unique().tolist()
                close = get_close_matches(specialization, available_specs, n=1, cutoff=0.75)
                if close:
                    filtered = doctors[doctors["specialization"].str.contains(close[0], case=False, na=False)]

            doctors = filtered
        doctors = doctors.sort_values("rating", ascending=False)
        result  = doctors[["doctor name","specialization","location","rating","availability"]].to_dict(orient="records")
        return jsonify({"doctors": result, "count": len(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Prediction
# -------------------------
@app.route("/predict", methods=["POST"])
def predict():

    data = request.json or {}
    original_text = data.get("symptoms", "").strip()

    if not original_text:
        return jsonify({"error": "No symptoms provided"}), 400

    try:
        detected_lang = detect(original_text)
    except:
        detected_lang = "en"

    translated_text = original_text

    if detected_lang != "en":
        try:
            translated_text = GoogleTranslator(source="auto", target="en").translate(original_text)
        except:
            translated_text = original_text

    translated_text = translated_text.lower()
    # FIX: keep letters, spaces AND commas - do NOT replace spaces with underscores.
    # symptom_matcher.py normalises internally; converting spaces to _ broke matching.
    translated_text = re.sub(r"[^a-z, ]", "", translated_text)

    user_symptoms = [s.strip() for s in translated_text.split(",") if s.strip()]
    try:
        # Extract demographics
        age           = data.get("age", None)
        gender        = data.get("gender", None)
        duration_days = data.get("duration_days", None)

        # Use enhanced prediction (combines rule-based + ML + demographics)
        result = enhanced_predict_disease(
            user_symptoms, age=age, gender=gender, duration_days=duration_days
        )

        if "error" in result:
            # Fallback to AI chatbot if enhanced prediction fails
            symptoms_list = extract_symptoms(original_text, cols)
            disease, confidence = predict_disease(symptoms_list)
            specialist = get_specialist(disease)
            doctors = recommend_doctors(specialist)

            return jsonify({
                "original_text": original_text,
                "translated_text": translated_text,
                "diseases": [(disease, confidence)],
                "confidence": confidence,
                "specialist": specialist,
                "doctors": doctors,
                "method": "fallback_ai"
            })

        # Enhanced prediction successful
        predictions = result["predictions"]
        top_prediction = predictions[0]
        specialist = top_prediction["specialist"]
        doctors = recommend_doctors(specialist)

        return jsonify({
            "original_text": original_text,
            "translated_text": translated_text,
            "predictions": predictions,
            "confidence": top_prediction["confidence"],
            "specialist": specialist,
            "doctors": doctors,
            "urgency": result.get("urgency", "MEDIUM"),
            "disclaimer": result.get("disclaimer", ""),
            "method": "enhanced_ml"
        })

    except Exception as e:
        print("Prediction error:", e)
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# ------------------------- ADVANCED FEATURES ENDPOINTS -------------------------

# ------------------------- Medical News -------------------------
def _translate_news_articles(articles, target_lang):
    """Translate selected news fields to requested language."""
    if not target_lang or target_lang == "en":
        return articles

    translated = []
    for article in articles:
        item = dict(article)
        for key in ("title", "description", "category"):
            value = item.get(key)
            if value:
                try:
                    item[key] = multilingual_service.translate_text(value, target_lang)
                except Exception:
                    # Keep original text if translation fails for any item
                    item[key] = value
        translated.append(item)
    return translated

@app.route("/api/news", methods=["GET"])
def get_medical_news():
    """Get latest medical news"""
    try:
        limit = int(request.args.get('limit', 10))
        lang = request.args.get('lang', 'en')
        news = news_service.fetch_medical_news(limit)
        news = _translate_news_articles(news, lang)
        return jsonify({"news": news, "count": len(news), "language": lang})
    except Exception as e:
        return jsonify({"error": f"News fetch failed: {str(e)}"}), 500

@app.route("/api/news/<category>", methods=["GET"])
def get_medical_news_by_category(category):
    """Get medical news by category"""
    try:
        limit = int(request.args.get('limit', 10))
        lang = request.args.get('lang', 'en')
        all_news = news_service.fetch_medical_news(50)  # Get more to filter

        filtered_news = [article for article in all_news
                        if article.get('category', '').lower() == category.lower()]
        filtered_news = _translate_news_articles(filtered_news[:limit], lang)

        return jsonify({"news": filtered_news, "count": len(filtered_news), "language": lang})
    except Exception as e:
        return jsonify({"error": f"Category news fetch failed: {str(e)}"}), 500

# ------------------------- User Personalization -------------------------
# In app.py - Added profile creation endpoint
@app.route('/api/create-profile', methods=['POST'])
def create_profile():
    try:
        profile_data = request.json
        # Save profile to database/file
        return jsonify({"success": True, "message": "Profile created successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@app.route("/api/user/profile", methods=["POST"])
def create_user_profile():
    """Create user profile"""
    try:
        data = request.json
        user_id = personalization_service.create_user_profile(data)
        return jsonify({"user_id": user_id, "message": "Profile created successfully"})
    except Exception as e:
        return jsonify({"error": f"Profile creation failed: {str(e)}"}), 500

@app.route("/api/user/profile/<user_id>", methods=["GET"])
def get_user_profile(user_id):
    """Get user profile"""
    try:
        profile = personalization_service.get_user_profile(user_id)
        if profile:
            return jsonify(profile)
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Profile fetch failed: {str(e)}"}), 500

@app.route("/api/user/profile/<user_id>", methods=["PUT"])
def update_user_profile(user_id):
    """Update user profile"""
    try:
        data = request.json
        success = personalization_service.update_user_profile(user_id, data)
        if success:
            return jsonify({"message": "Profile updated successfully"})
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Profile update failed: {str(e)}"}), 500

@app.route("/api/user/history/<user_id>", methods=["GET"])
def get_user_history(user_id):
    """Get user prediction history"""
    try:
        limit = int(request.args.get('limit', 10))
        history = personalization_service.get_user_history(user_id, limit)
        return jsonify({"history": history, "count": len(history)})
    except Exception as e:
        return jsonify({"error": f"History fetch failed: {str(e)}"}), 500

@app.route("/api/predict/personalized", methods=["POST"])
def personalized_prediction():
    """Get personalized prediction based on user profile"""
    try:
        data = request.json
        user_id = data.get('user_id')
        symptoms = data.get('symptoms', [])
        language = data.get('language', 'en')

        # Get base prediction
        base_result = enhanced_predict_disease(symptoms)

        if "error" in base_result:
            return jsonify({"error": base_result["error"]}), 500

        # Personalize predictions
        personalized_predictions = personalization_service.personalize_predictions(
            user_id, base_result["predictions"]
        )

        # Sort by confidence
        personalized_predictions.sort(key=lambda x: x['confidence'], reverse=True)

        # Translate if needed
        if language != 'en':
            personalized_predictions = multilingual_service.translate_prediction_results(
                personalized_predictions, language
            )

        # Add to user history
        if user_id:
            history_data = {
                'symptoms': symptoms,
                'predictions': personalized_predictions,
                'specialist': personalized_predictions[0]['specialist'] if personalized_predictions else '',
                'urgency': base_result.get('urgency', 'MEDIUM')
            }
            personalization_service.add_prediction_history(user_id, history_data)

        return jsonify({
            "predictions": personalized_predictions,
            "personalized": True,
            "user_id": user_id,
            "language": language,
            "urgency": base_result.get("urgency", "MEDIUM"),
            "disclaimer": base_result.get("disclaimer", "")
        })

    except Exception as e:
        return jsonify({"error": f"Personalized prediction failed: {str(e)}"}), 500

# ------------------------- Multilingual Support -------------------------
@app.route("/api/languages", methods=["GET"])
def get_supported_languages():
    """Get list of supported languages"""
    try:
        languages = multilingual_service.supported_languages
        return jsonify({"languages": languages})
    except Exception as e:
        return jsonify({"error": f"Language list fetch failed: {str(e)}"}), 500

@app.route("/api/translate", methods=["POST"])
def translate_text():
    """Translate text"""
    try:
        data = request.json
        text = data.get('text', '')
        target_lang = data.get('target_lang', 'en')
        source_lang = data.get('source_lang')

        translated = multilingual_service.translate_text(text, target_lang, source_lang)
        return jsonify({"original": text, "translated": translated, "target_lang": target_lang})
    except Exception as e:
        return jsonify({"error": f"Translation failed: {str(e)}"}), 500

@app.route("/api/ui/translations/<lang_code>", methods=["GET"])
def get_ui_translations(lang_code):
    """Get UI translations for language"""
    try:
        translations = multilingual_service.get_ui_translations(lang_code)
        return jsonify({"language": lang_code, "translations": translations})
    except Exception as e:
        return jsonify({"error": f"UI translations fetch failed: {str(e)}"}), 500

@app.route("/api/detect-language", methods=["POST"])
def detect_language():
    """Detect language of input text"""
    try:
        data = request.json
        text = data.get('text', '')
        detected_lang = multilingual_service.detect_language(text)
        return jsonify({"text": text, "detected_language": detected_lang})
    except Exception as e:
        return jsonify({"error": f"Language detection failed: {str(e)}"}), 500


# ------------------------- Voice -------------------------
@app.route("/voice", methods=["POST"])
def voice():
    data = request.json or {}
    language = data.get("language", "english")

    voice_text = get_voice_input(language)
    return jsonify({"voice_text": voice_text})


# -------------------------
# Book Appointment
# -------------------------
@app.route("/book", methods=["POST"])
def book():

    data = request.json
    appointments = load_appointments()

    # Check slot
    for a in appointments:
        if (
            a["doctor"] == data["doctor"]
            and a["date"] == data["date"]
            and a["time"] == data["time"]
            and a["status"] == "Confirmed"
        ):
            return jsonify({"error": "Slot already booked"}), 400

    india = pytz.timezone("Asia/Kolkata")
    now = datetime.now(india)

    new_appointment = {
        "patient_name": data["name"],
        "phone": data["phone"],
        "doctor": data["doctor"],
        "date": data["date"],
        "time": data["time"],
        "booked_on": now.strftime("%d-%m-%Y"),
        "booked_at": now.strftime("%I:%M %p"),
        "status": "Confirmed"
    }

    appointments.append(new_appointment)
    save_appointments(appointments)

    return jsonify({"message": "Appointment Confirmed"})


# -------------------------
# Get Booked Slots
# -------------------------
@app.route("/booked-slots", methods=["POST"])
def booked_slots():

    data = request.json
    doctor = data["doctor"]
    date = data["date"]

    appointments = load_appointments()

    booked = [
        a["time"]
        for a in appointments
        if a["doctor"] == doctor
        and a["date"] == date
        and a["status"] == "Confirmed"
    ]

    return jsonify(booked)


# -------------------------
# Get All Appointments
# -------------------------
@app.route("/appointments", methods=["GET"])
def get_appointments():
    try:
        appointments = load_appointments()
        appointments = list(reversed(appointments))
        return jsonify({"appointments": appointments, "count": len(appointments)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------
# Cancel
# -------------------------
@app.route("/cancel", methods=["POST"])
def cancel():

    data = request.json
    appointments = load_appointments()

    for a in appointments:
        if (
            a["doctor"] == data["doctor"]
            and a["date"] == data["date"]
            and a["time"] == data["time"]
        ):
            a["status"] = "Cancelled"

    save_appointments(appointments)

    return jsonify({"message": "Appointment Cancelled"})


# -------------------------
# Reschedule
# -------------------------
@app.route("/reschedule", methods=["POST"])
def reschedule():

    data = request.json
    appointments = load_appointments()

    for a in appointments:
        if (
            a["doctor"] == data["doctor"]
            and a["date"] == data["old_date"]
            and a["time"] == data["old_time"]
        ):
            a["date"] = data["new_date"]
            a["time"] = data["new_time"]

    save_appointments(appointments)

    return jsonify({"message": "Appointment Rescheduled"})


# -------------------------
# Generate PDF (INDIAN TIME FIXED)
# -------------------------
@app.route("/generate-pdf", methods=["POST"])
def generate_pdf():

    data = request.json

    india = pytz.timezone("Asia/Kolkata")
    now = datetime.now(india)

    booking_date = now.strftime("%d-%m-%Y")
    booking_time = now.strftime("%I:%M %p")

    file_path = "appointment.pdf"
    doc = SimpleDocTemplate(file_path, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph("<b>Appointment Confirmation</b>", styles["Title"]))
    elements.append(Spacer(1, 0.5 * inch))

    table_data = [
        ["Patient Name", data["name"]],
        ["Phone", data["phone"]],
        ["Doctor", data["doctor"]],
        ["Appointment Date", data["date"]],
        ["Appointment Time", data["time"]],
        ["Booked On (Indian Date)", booking_date],
        ["Booked At (Indian Time)", booking_time],
    ]

    table = Table(table_data, colWidths=[200, 250])
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
    ]))

    elements.append(table)
    doc.build(elements)

    return send_file(file_path, as_attachment=True)


# -------------------------
# OTP System
# -------------------------
@app.route("/send-otp", methods=["POST"])
def send_otp():

    phone = request.json["phone"]
    otp = random.randint(100000, 999999)

    otp_storage[phone] = otp
    print("OTP:", otp)

    return jsonify({"message": "OTP Sent"})


@app.route("/verify-otp", methods=["POST"])
def verify():

    phone = request.json["phone"]
    entered_otp = int(request.json["otp"])

    if otp_storage.get(phone) == entered_otp:
        return jsonify({"message": "Login Successful"})
    else:
        return jsonify({"error": "Invalid OTP"}), 400

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json or {}
        message = data.get("message", "").strip()
        session_id = data.get("session_id", "default")
        
        if not message:
            return jsonify({"reply": "I didn't catch that. Could you please say it again?"})

        response = chatbot_logic(session_id, message)
        return jsonify(response)
    except Exception as e:
        print("Chatbot error:", str(e))
        return jsonify({"reply": "I'm having a bit of trouble connecting to my diagnostic engine. Please try again in a moment."}), 500


if __name__ == "__main__":
    app.run(debug=True,port=5000)
