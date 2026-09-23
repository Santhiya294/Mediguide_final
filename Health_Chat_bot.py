import re
import random
import pandas as pd
import numpy as np
import csv
import os
from difflib import get_close_matches
from sklearn import preprocessing
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings("ignore")

# ------------------ Load Dataset ------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

training = pd.read_csv(os.path.join(BASE_DIR, 'Data/Training.csv'))
testing = pd.read_csv(os.path.join(BASE_DIR, 'Data/Testing.csv'))

training.columns = training.columns.str.replace(r"\.\d+$", "", regex=True)
testing.columns = testing.columns.str.replace(r"\.\d+$", "", regex=True)

training = training.loc[:, ~training.columns.duplicated()]
testing = testing.loc[:, ~testing.columns.duplicated()]

cols = training.columns[:-1]
x = training[cols]
y = training['prognosis']

# ------------------ Encode Labels ------------------

le = preprocessing.LabelEncoder()
y = le.fit_transform(y)

x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.33, random_state=42
)

model = RandomForestClassifier(
    n_estimators=350,
    max_depth=None,
    random_state=42
)

model.fit(x_train, y_train)

# ------------------ Dictionaries ------------------

severityDictionary = {}
description_list = {}
precautionDictionary = {}

def getDescription():
    try:
        desc_path = os.path.join(BASE_DIR, "MasterData/symptom_Description.csv")
        if os.path.exists(desc_path):
            with open(desc_path) as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) >= 2:
                        description_list[row[0].strip()] = row[1].strip()
    except Exception as e:
        print(f"Error loading descriptions: {e}")

def getSeverityDict():
    try:
        sev_path = os.path.join(BASE_DIR, "MasterData/Symptom_severity.csv")
        if os.path.exists(sev_path):
            with open(sev_path) as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) >= 2:
                        try:
                            severityDictionary[row[0].strip()] = int(row[1])
                        except:
                            pass
    except Exception as e:
        print(f"Error loading severity: {e}")

def getprecautionDict():
    try:
        prec_path = os.path.join(BASE_DIR, "MasterData/symptom_precaution.csv")
        if os.path.exists(prec_path):
            with open(prec_path) as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) >= 5:
                        precautionDictionary[row[0].strip()] = [row[1].strip(), row[2].strip(), row[3].strip(), row[4].strip()]
    except Exception as e:
        print(f"Error loading precautions: {e}")

getDescription()
getSeverityDict()
getprecautionDict()

# ------------------ Voice Text Cleaning ------------------

def clean_voice_text(text):
    if not text: return ""
    text = str(text).lower()

    fillers = ["i have", "i am having", "i feel", "my", "the", "a", "an", "suffering from", "experiencing"]
    for word in fillers:
        text = re.sub(rf"\b{word}\b", "", text)

    voice_corrections = {
        "feaver": "fever",
        "koff": "cough",
        "hedache": "headache",
        "stomak pain": "stomach pain",
        "brething problem": "breathlessness",
        "leg pain": "leg_pain",
        "body pain": "muscle_pain",
        "chest pain": "chest_pain",
        "back pain": "back_pain",
        "joint pain": "joint_pain"
    }

    for wrong, correct in voice_corrections.items():
        text = text.replace(wrong, correct)

    return text.strip()

# ------------------ Symptom Synonyms ------------------

symptom_synonyms = {
    "stomach ache": "stomach_pain",
    "belly pain": "belly_pain",
    "tummy pain": "stomach_pain",
    "loose motion": "diarrhoea",
    "motions": "diarrhoea",
    "high temperature": "high_fever",
    "fever": "high_fever",
    "feaver": "high_fever",
    "coughing": "cough",
    "throat pain": "throat_irritation",
    "cold": "chills",
    "shortness of breath": "breathlessness",
    "body ache": "muscle_pain",
    "runny nose": "runny_nose",
    "leg swelling": "swollen_legs",
    "knee pain": "knee_pain",
    "varicose vein": "prominent_veins_on_calf",
    "joint swelling": "swelling_joints",
    "skin rash": "skin_rash",
    "itching": "itching",
    "vomiting": "vomiting",
    "fatigue": "fatigue",
    "weight loss": "weight_loss",
    "weight gain": "weight_gain",
    "yellow skin": "yellowish_skin",
    "dark urine": "dark_urine",
    "loss of appetite": "loss_of_appetite",
    "abdominal pain": "abdominal_pain",
    "yellow eyes": "yellowing_of_eyes",
    "blurred vision": "blurred_and_distorted_vision",
    "neck pain": "neck_pain",
    "dizziness": "dizziness",
    "stiff neck": "stiff_neck",
    "loss of balance": "loss_of_balance",
    "depression": "depression",
    "irritability": "irritability",
    "muscle pain": "muscle_pain",
    "red spots": "red_spots_over_body"
}

symptoms_dict = {symptom: idx for idx, symptom in enumerate(cols)}

# ------------------ Extract Symptoms ------------------

def extract_symptoms(text, all_symptoms):

    text = clean_voice_text(text)
    text = re.sub(r"[^a-z, ]", " ", text)

    extracted = set()

    for phrase, mapped in symptom_synonyms.items():
        if phrase in text:
            extracted.add(mapped)

    for symptom in all_symptoms:
        readable_symptom = symptom.replace("_", " ")
        if readable_symptom in text:
            extracted.add(symptom)

    words = re.findall(r"[a-zA-Z]+", text)
    symptom_names = [s.replace("_", " ") for s in all_symptoms]

    for word in words:
        if len(word) < 3: continue
        match = get_close_matches(word, symptom_names, n=1, cutoff=0.85)
        if match:
            for sym in all_symptoms:
                if sym.replace("_", " ") == match[0]:
                    extracted.add(sym)

    return list(extracted)

# ------------------ Predict Disease ------------------

def predict_disease(symptoms_list):

    if not symptoms_list:
        return "Unknown", 0.0

    input_vector = np.zeros(len(symptoms_dict))

    for symptom in symptoms_list:
        if symptom in symptoms_dict:
            input_vector[symptoms_dict[symptom]] = 1

    proba = model.predict_proba([input_vector])[0]
    pred = np.argmax(proba)

    disease = le.inverse_transform([pred])[0]
    # Convert to standard Python float for JSON compatibility
    confidence = float(round(proba[pred] * 100, 2))

    return disease, confidence

# ------------------ Health Quotes ------------------

health_quotes = [
    "💙 Your health is your greatest wealth.",
    "🌿 Small healthy habits lead to big results.",
    "🩺 Early care can prevent serious illness.",
    "💪 A healthy body supports a strong mind.",
    "🌞 Take care today for a healthier tomorrow."
]

# ------------------ Health Tips ------------------

health_tips = [
    "Drink enough water daily.",
    "Sleep at least 7-8 hours.",
    "Eat balanced food.",
    "Avoid self-medication.",
    "Consult a doctor if symptoms persist."
]

# ------------------ Extra Medical Questions ------------------

medical_questions = [
    "Are you experiencing severe pain?",
    "Do you feel tired or weak?",
    "Do you have difficulty breathing?",
    "Have you had this problem before?",
    "Are you taking any medications?"
]

# ------------------ Chat Sessions ------------------

chat_sessions = {}

MAX_QUESTIONS = 6
CONFIDENCE_STOP = 92

# ------------------ Chatbot Logic ------------------

def chatbot_logic(session_id, user_message):

    user_message = clean_voice_text(user_message)

    if session_id not in chat_sessions:
        chat_sessions[session_id] = {
            "stage": "collect_name",
            "name": "",
            "age": "",
            "gender": "",
            "days": "",
            "symptoms": [],
            "asked_questions": [],
            "current_symptom": None
        }

    session = chat_sessions[session_id]

    if session["stage"] == "collect_name":
        session["name"] = user_message
        session["stage"] = "collect_age"
        return {"reply": f"Nice to meet you {session['name']}. What is your age?"}

    if session["stage"] == "collect_age":
        if not user_message.isdigit():
            return {"reply": "Please enter a valid age (number)."}
        session["age"] = int(user_message)
        session["stage"] = "collect_gender"
        return {"reply": "What is your gender? (male/female)"}

    if session["stage"] == "collect_gender":
        session["gender"] = user_message
        session["stage"] = "collect_days"
        return {"reply": "How many days have you had these symptoms?"}

    if session["stage"] == "collect_days":
        session["days"] = user_message
        session["stage"] = "symptom_collection"
        return {"reply": "Please describe your symptoms."}

    if session["current_symptom"] and user_message.lower() in ["yes", "yeah", "yep"]:
        session["symptoms"].append(session["current_symptom"])
        session["current_symptom"] = None
    elif session["current_symptom"] and user_message.lower() in ["no", "nah", "not really"]:
        session["current_symptom"] = None

    detected = extract_symptoms(user_message, cols)
    for sym in detected:
        if sym not in session["symptoms"]:
            session["symptoms"].append(sym)

    if not session["symptoms"]:
        return {"reply": "I couldn't identify any specific symptoms. Can you try describing them differently? (e.g., 'I have a high fever and a cough')"}

    disease, confidence = predict_disease(session["symptoms"])

    if disease == "Unknown":
        return {
            "reply": "I'm sorry, I couldn't identify a specific condition based on those symptoms. Could you describe them in more detail or mention any other issues you're feeling?"
        }

    adjusted_confidence = float(confidence + (len(session["symptoms"]) * 2.0))
    adjusted_confidence = min(adjusted_confidence, 98.0)

    emergency_keywords = [
        "heart attack", "stroke", "cardiac", "paralysis", "emergency", "severe", "fungal infection"
    ]
    is_emergency = any(word in disease.lower() for word in emergency_keywords) or adjusted_confidence > 94

    # Ensure disease exists in training data before iloc
    matching_prognosis = training[training['prognosis'] == disease]
    if matching_prognosis.empty:
         return {
            "step": "final",
            "disease": disease,
            "confidence": round(float(adjusted_confidence), 2),
            "description": description_list.get(disease, "Information not available."),
            "precautions": precautionDictionary.get(disease, ["Consult a healthcare professional."]),
            "quote": random.choice(health_quotes),
            "health_tip": random.choice(health_tips),
            "extra_question": random.choice(medical_questions),
            "emergency": bool(is_emergency),
            "patient": {
                "name": str(session["name"]),
                "age": str(session["age"]),
                "gender": str(session["gender"]),
                "days": str(session["days"])
            }
        }

    disease_row = matching_prognosis.iloc[0]
    disease_symptoms = disease_row[:-1][disease_row[:-1] == 1].index.tolist()

    sorted_symptoms = sorted(
        disease_symptoms,
        key=lambda x: severityDictionary.get(x, 1),
        reverse=True
    )

    if len(session["asked_questions"]) < MAX_QUESTIONS and adjusted_confidence < CONFIDENCE_STOP:
        for symptom in sorted_symptoms:
            if symptom not in session["symptoms"] and symptom not in session["asked_questions"]:
                session["asked_questions"].append(symptom)
                session["current_symptom"] = symptom

                return {
                    "step": "question",
                    "disease": str(disease),
                    "confidence": round(float(adjusted_confidence), 2),
                    "next_question": f"Do you also experience {symptom.replace('_',' ')}?"
                }

    result = {
        "step": "final",
        "disease": str(disease),
        "confidence": round(float(adjusted_confidence), 2),
        "description": str(description_list.get(disease, "Information not available.")),
        "precautions": [str(p) for p in precautionDictionary.get(disease, ["Consult a healthcare professional."])],
        "quote": str(random.choice(health_quotes)),
        "health_tip": str(random.choice(health_tips)),
        "extra_question": str(random.choice(medical_questions)),
        "emergency": bool(is_emergency),
        "patient": {
            "name": str(session["name"]),
            "age": str(session["age"]),
            "gender": str(session["gender"]),
            "days": str(session["days"])
        }
    }

    chat_sessions.pop(session_id, None)
    return result