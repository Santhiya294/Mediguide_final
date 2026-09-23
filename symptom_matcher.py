


import os
import re
import math
import joblib

import pandas as pd
from collections import Counter

# ─── PATHS ───────────────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH    = os.path.join(BASE_DIR, "dataset", "final_dataset.csv")
MODEL_PATH      = os.path.join(BASE_DIR, "model", "disease_model_logreg.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "model", "tfidf_vectorizer.pkl")
ENCODER_PATH    = os.path.join(BASE_DIR, "model", "label_encoder.pkl")

# ─── DATASET ─────────────────────────────────────────────────────────────────
df    = pd.read_csv(DATASET_PATH)
TOTAL = df["disease"].nunique()
print(f"[INFO] Dataset: {len(df)} rows, {TOTAL} diseases")

# ─── ML MODEL (optional) ─────────────────────────────────────────────────────
try:
    model         = joblib.load(MODEL_PATH)
    vectorizer    = joblib.load(VECTORIZER_PATH)
    label_encoder = joblib.load(ENCODER_PATH)
    ML_OK = True
    print("[INFO] ML model loaded")
except Exception as exc:
    ML_OK = False
    print(f"[WARN] ML model not found - rule-based only ({exc})")

# ─── SYNONYM MAP ──────────────────────────────────────────────────────────────
SYNONYMS = {
    # Respiratory
    "hard to breathe"            : "shortness of breath",
    "can't breathe"              : "shortness of breath",
    "cant breathe"               : "shortness of breath",
    "difficulty breathing"       : "shortness of breath",
    "trouble breathing"          : "shortness of breath",
    "chest tightness"            : "chest tightness",
    "tight chest"                : "chest tightness",
    # GI
    "stomach ache"               : "abdominal pain",
    "stomach pain"               : "abdominal pain",
    "tummy pain"                 : "abdominal pain",
    "belly pain"                 : "abdominal pain",
    "belly ache"                 : "abdominal pain",
    "throwing up"                : "vomiting",
    "threw up"                   : "vomiting",
    "loose stool"                : "diarrhea",
    "loose motion"               : "diarrhea",
    "watery stool"               : "diarrhea",
    "blood in poop"              : "blood in stool",
    # Urinary
    "burning pee"                : "painful urination",
    "hurts to pee"               : "painful urination",
    "pain while urinating"       : "painful urination",
    "pain when urinating"        : "painful urination",
    "burning urination"          : "painful urination",
    "burning sensation urination": "painful urination",
    "pee a lot"                  : "frequent urination",
    "urinate often"              : "frequent urination",
    "peeing often"               : "frequent urination",
    # Head / Neck
    "stiff neck"                 : "neck stiffness",
    "neck stiff"                 : "neck stiffness",
    "neck pain"                  : "neck stiffness",
    "light sensitivity"          : "sensitivity to light",
    "light sensitive"            : "sensitivity to light",
    "sensitive to light"         : "sensitivity to light",
    "photophobia"                : "sensitivity to light",
    # Musculoskeletal
    "body ache"                  : "body aches",
    "body pain"                  : "body aches",
    "muscle pain"                : "muscle aches",
    "muscle ache"                : "muscle aches",
    "sore muscles"               : "muscle aches",
    "back ache"                  : "back pain",
    "backache"                   : "back pain",
    "left arm pain"              : "arm pain",
    # Cardiovascular
    "heart racing"               : "rapid heart rate",
    "heart flutter"              : "irregular heartbeat",
    "palpitation"                : "irregular heartbeat",
    "palpitations"               : "irregular heartbeat",
    "passing out"                : "fainting",
    "blackout"                   : "fainting",
    # Skin
    "skin rash"                  : "rash",
    "rash on skin"               : "rash",
    "itchy skin"                 : "itching",
    "skin itch"                  : "itching",
    # Eyes
    "blurry vision"              : "blurred vision",
    "swollen eye"                : "swollen eye",
    "red eye"                    : "eye redness",
    "pink eye"                   : "eye redness",
    # Metabolic
    "very thirsty"               : "excessive thirst",
    "always thirsty"             : "excessive thirst",
    "high sugar"                 : "excessive thirst",
    "blood sugar"                : "excessive thirst",
    # ENT
    "ear ache"                   : "ear pain",
    "earache"                    : "ear pain",
    "running nose"               : "runny nose",
    "nose bleed"                 : "nosebleed",
    # General
    "dizzy"                      : "dizziness",
    "feel dizzy"                 : "dizziness",
    "yellow skin"                : "jaundice",
    "yellow eyes"                : "jaundice",
    "yellowing"                  : "jaundice",
    "night sweat"                : "night sweats",
    "sweating at night"          : "night sweats",
    "hair falling"               : "hair loss",
    "pins and needles"           : "numbness tingling",
    "toothache"                  : "tooth pain",
    "gum pain"                   : "gum disease",
    "mouth sores"                : "mouth ulcer",
    "no appetite"                : "loss of appetite",
}

# ─── DISEASE KEYWORD BOOSTS ───────────────────────────────────────────────────
# Each matched keyword multiplies the disease score by (1 + n_matched * 0.40)
DISEASE_BOOSTS = {
    "Meningitis"              : ["neck stiffness", "stiff neck",
                                 "sensitivity to light", "seizures"],
    "Urinary Tract Infection" : ["painful urination", "blood in urine",
                                 "pelvic pain", "cloudy urine"],
    "Diabetes"                : ["excessive thirst", "frequent urination",
                                 "weight loss"],
    "Asthma"                  : ["wheezing", "chest tightness",
                                 "shortness of breath"],
    "Heart Attack"            : ["chest pain", "arm pain", "jaw pain",
                                 "sweating", "irregular heartbeat"],
    "Appendicitis"            : ["right lower abdominal pain",
                                 "loss of appetite", "right side pain"],
    "Dengue Fever"            : ["high fever", "rash", "joint pain",
                                 "eye pain", "muscle pain"],
    "Pneumonia"               : ["productive cough", "chest pain",
                                 "high fever", "difficulty breathing"],
    "Tuberculosis"            : ["night sweats", "weight loss",
                                 "blood in sputum"],
}

# ─── EMERGENCY RULES ─────────────────────────────────────────────────────────
EMERGENCY_RULES = [
    {
        "required"  : ["chest pain"],
        "any_of"    : ["arm pain", "left arm", "sweating",
                       "nausea", "jaw pain"],
        "disease"   : "Heart Attack",
        "msg"       : "🚨 Possible heart attack. Call 108 immediately.",
        "specialist": "Cardiologist",
    },
    {
        "required"  : ["stiff neck", "fever", "headache"],
        "any_of"    : [],
        "disease"   : "Meningitis",
        "msg"       : "🚨 Possible meningitis. Go to emergency immediately.",
        "specialist": "Neurologist",
    },
    {
        "required"  : ["neck stiffness", "fever", "headache"],
        "any_of"    : [],
        "disease"   : "Meningitis",
        "msg"       : "🚨 Possible meningitis. Go to emergency immediately.",
        "specialist": "Neurologist",
    },
    {
        "required"  : ["shortness of breath", "chest pain"],
        "any_of"    : ["sweating", "arm pain", "jaw pain",
                       "irregular heartbeat"],
        "disease"   : "Heart Attack",
        "msg"       : "🚨 Possible cardiac emergency. Call 108 immediately.",
        "specialist": "Cardiologist",
    },
    {
        "required"  : ["difficulty breathing"],
        "any_of"    : ["chest pain", "blue lips", "confusion"],
        "disease"   : "Respiratory Emergency",
        "msg"       : "🚨 Severe breathing emergency. Call 108 immediately.",
        "specialist": "Pulmonologist",
    },
]

# ─── GENDER EXCLUSIONS ────────────────────────────────────────────────────────
_MALE_EXCL = [
    "ovarian", "uterine", "cervical", "vaginal", "endometrial",
    "endometriosis", "menopause", "polycystic ovarian", "vaginitis",
    "menstrual", "fallopian", "vulvar", "placental",
    "preeclampsia", "gestational", "ectopic",
]
_FEMALE_EXCL = [
    "prostate", "testicular", "epididymitis",
    "hydrocele", "varicocele", "penile", "erectile",
]

# ═══════════════════════════════════════════════════════════════════════════════
#  BUILD TF-IDF INDEX  (runs once at import time)
# ═══════════════════════════════════════════════════════════════════════════════

def _normalise_disease(name: str) -> str:
    return name.strip().title()


_disease_texts      = {}   # {disease_name_title: full_text_string}
_disease_row_counts = {}   # {disease_name_title: int}

for _d in df["disease"].unique():
    _n    = _normalise_disease(_d)
    _rows = df[df["disease"] == _d]
    _txt  = " ".join(str(r) for r in _rows["symptoms"])
    _txt  = _txt.lower().replace("_", " ")
    _txt  = re.sub(r"[^a-z ]", " ", _txt)
    _txt  = re.sub(r"\s+",     " ", _txt).strip()
    _disease_texts[_n]      = _disease_texts.get(_n, "") + " " + _txt
    _disease_row_counts[_n] = _disease_row_counts.get(_n, 0) + len(_rows)

_N = len(_disease_texts)      # number of unique (normalised) diseases

# Document frequency  (how many diseases contain each word)
_word_df: Counter = Counter()
for _txt in _disease_texts.values():
    for _w in set(_txt.split()):
        if len(_w) > 2:
            _word_df[_w] += 1


def _idf(word: str) -> float:
    """Standard IDF.  Higher → rarer word → stronger discriminating power."""
    return math.log(_N / max(1, _word_df.get(word, 1)))


# TF-IDF vectors  {disease: {word: tfidf_score}}
_disease_vectors = {}
for _d, _txt in _disease_texts.items():
    _words = [w for w in _txt.split() if len(w) > 2]
    _total = len(_words)
    if _total == 0:
        continue
    _tf = Counter(_words)
    _disease_vectors[_d] = {
        w: (cnt / _total) * _idf(w)
        for w, cnt in _tf.items()
        if _idf(w) > 0
    }

print(f"[INFO] TF-IDF index: {len(_disease_vectors)} diseases, "
      f"{len(_word_df)} vocabulary terms")


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _normalise_input(phrase: str) -> str:
    phrase = str(phrase).lower().replace("_", " ").strip()
    phrase = SYNONYMS.get(phrase, phrase)
    phrase = re.sub(r"[^a-z ]", " ", phrase)
    return  re.sub(r"\s+",      " ", phrase).strip()


def check_emergency(user_symptoms: list) -> dict | None:
    text = " ".join(_normalise_input(s) for s in user_symptoms)
    for rule in EMERGENCY_RULES:
        if all(r in text for r in rule["required"]):
            if not rule["any_of"] or any(a in text for a in rule["any_of"]):
                return rule
    return None


def _gender_filter(scores: dict, gender) -> dict:
    if not gender:
        return scores
    g    = str(gender).lower().strip()
    excl = _MALE_EXCL if g == "male" else _FEMALE_EXCL if g == "female" else []
    return {d: s for d, s in scores.items()
            if not any(k in d.lower() for k in excl)}


def _duration_adjust(scores: dict, duration_days) -> dict:
    if not duration_days:
        return scores
    try:
        days = int(duration_days)
        adj  = dict(scores)
        for d in adj:
            dl = d.lower()
            if days <= 7:
                if any(k in dl for k in ["flu", "cold", "gastro",
                                          "food poison", "appendic",
                                          "allerg", "pharyngitis"]):
                    adj[d] *= 1.30
                if any(k in dl for k in ["chronic", "diabetes", "arthritis",
                                          "copd", "tuberculosis", "cancer"]):
                    adj[d] *= 0.70
            elif days > 21:
                if any(k in dl for k in ["chronic", "diabetes", "arthritis",
                                          "copd", "tuberculosis", "asthma",
                                          "hypertension"]):
                    adj[d] *= 1.30
                if any(k in dl for k in ["flu", "cold", "appendic", "gastro"]):
                    adj[d] *= 0.70
        return adj
    except Exception:
        return scores


# ═══════════════════════════════════════════════════════════════════════════════
#  CORE MATCHING ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def _cosine_match(user_symptoms: list) -> dict:
    """
    Build a TF-IDF query vector from user symptoms and return
    {disease: dot_product_score} for every disease with ≥2 word matches.
    """
    qwords = []
    for phrase in user_symptoms:
        qwords.extend(
            w for w in _normalise_input(phrase).split() if len(w) > 2
        )
    if not qwords:
        return {}

    total = len(qwords)
    qtf   = Counter(qwords)
    qvec  = {w: (cnt / total) * _idf(w)
             for w, cnt in qtf.items() if _idf(w) > 0}

    scores = {}
    for disease, dvec in _disease_vectors.items():
        matched = [w for w in qvec if w in dvec]
        if len(matched) < 2:           # need ≥2 distinct word matches
            continue
        dot       = sum(qvec[w] * dvec[w] for w in matched)
        row_bonus = math.log(1 + _disease_row_counts.get(disease, 1))
        scores[disease] = dot * row_bonus

    return scores


def _apply_boosts(scores: dict, user_symptoms: list) -> dict:
    """Boost clinically important diseases when key symptoms are present."""
    user_text = " ".join(_normalise_input(s) for s in user_symptoms)
    boosted   = dict(scores)
    for disease_key, keywords in DISEASE_BOOSTS.items():
        n_match = sum(1 for kw in keywords if kw in user_text)
        if n_match == 0:
            continue
        factor = 1 + n_match * 0.40
        for d in boosted:
            if disease_key.lower() in d.lower():
                boosted[d] *= factor
    return boosted


def _apply_conservative_penalties(scores: dict, user_symptoms: list) -> dict:
    """
    Reduce over-specific predictions when supporting symptoms are absent.
    """
    user_text = " ".join(_normalise_input(s) for s in user_symptoms).lower()
    adjusted = dict(scores)

    for disease in list(adjusted.keys()):
        dl = disease.lower()

        # Avoid bleeding diagnosis without bleeding evidence
        if "gastrointestinal hemorrhage" in dl:
            if not any(k in user_text for k in ["blood in stool", "black stool", "vomiting blood"]):
                adjusted[disease] *= 0.45

        # Avoid hair-specific fungal label for generic skin complaints
        if "fungal infection of the hair" in dl:
            if not any(k in user_text for k in ["scalp", "hair loss", "hair fall", "patchy"]):
                adjusted[disease] *= 0.55

        # Avoid traumatic knee injuries without trauma cues
        if any(k in dl for k in ["ligament", "meniscus tear", "dislocation"]):
            if not any(k in user_text for k in ["injury", "twist", "trauma", "fall", "sudden"]):
                adjusted[disease] *= 0.65

        # Foreign-body diagnoses should require object/injury cues.
        if "foreign body" in dl:
            if not any(k in user_text for k in ["object", "injury", "ear pain", "nose bleed", "swallowed"]):
                adjusted[disease] *= 0.40

        # Cold sore should require typical oral/lip cues.
        if "cold sore" in dl:
            if not any(k in user_text for k in ["lip", "mouth", "blister", "oral"]):
                adjusted[disease] *= 0.55

        # Genital herpes should require genital/lesion cues.
        if "genital herpes" in dl:
            if not any(k in user_text for k in ["genital", "groin", "blister", "ulcer", "burning urination"]):
                adjusted[disease] *= 0.30

        # Prefer broad, non-sensitive skin labels for generic skin complaints.
        if any(k in user_text for k in ["itching", "rash", "skin irritation"]):
            if any(k in dl for k in ["atrophic skin", "dermatitis", "eczema", "fungal infection"]):
                adjusted[disease] *= 1.18

    return adjusted


# ═══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════════

def rule_based_match(user_symptoms, age=None, gender=None, duration_days=None):
    """
    Main prediction entry-point.

    Parameters
    ----------
    user_symptoms : list[str]   e.g. ["fever", "cough", "sore throat"]
    age           : int | None
    gender        : str | None  "male" | "female"
    duration_days : int | None  how many days symptoms have lasted

    Returns
    -------
    results       : list[(disease_name, confidence_pct)]   top-3
    urgency       : "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW"
    emergency_msg : str  (non-empty only when urgency == "EMERGENCY")
    """
    if not user_symptoms:
        return [], "LOW", ""

    # 1. Emergency gate ────────────────────────────────────────────────────────
    emergency = check_emergency(user_symptoms)
    if emergency:
        return [(emergency["disease"], 95.0)], "EMERGENCY", emergency["msg"]

    # 2. TF-IDF cosine matching ────────────────────────────────────────────────
    scores = _cosine_match(user_symptoms)
    if not scores:
        return [], "LOW", ""

    # 3. Disease keyword boosts ────────────────────────────────────────────────
    scores = _apply_boosts(scores, user_symptoms)
    scores = _apply_conservative_penalties(scores, user_symptoms)

    # 4. Demographics ──────────────────────────────────────────────────────────
    scores = _gender_filter(scores, gender)
    scores = _duration_adjust(scores, duration_days)
    if not scores:
        return [], "LOW", ""

    # 5. Normalise to percentage confidence ────────────────────────────────────
    top3  = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]
    total = sum(s for _, s in top3)
    if total == 0:
        return [], "LOW", ""

    results  = [(d, round(s / total * 100, 2)) for d, s in top3]
    top_conf = results[0][1]
    top_name = results[0][0].lower()

    # 6. Urgency level ─────────────────────────────────────────────────────────
    HIGH_RISK = ["heart", "stroke", "meningitis", "sepsis", "anaphylaxis",
                 "cardiac", "pulmonary embolism", "appendicitis", "aortic"]
    if any(k in top_name for k in HIGH_RISK):
        urgency = "HIGH"
    elif top_conf >= 50:
        urgency = "HIGH"
    elif top_conf >= 35:
        urgency = "MEDIUM"
    else:
        urgency = "LOW"

    return results, urgency, ""


def ml_predict(user_symptoms):
    """Returns top-5 ML predictions as [(disease, confidence%), ...]."""
    if not ML_OK:
        return []
    try:
        text  = " ".join(_normalise_input(s) for s in user_symptoms)
        X     = vectorizer.transform([text])
        probs = model.predict_proba(X)[0]
        top5  = probs.argsort()[-5:][::-1]
        return [
            (label_encoder.inverse_transform([i])[0], round(probs[i] * 100, 2))
            for i in top5
        ]
    except Exception as exc:
        print(f"ML predict error: {exc}")
        return []


def combined_prediction(user_symptoms, age=None, gender=None, duration_days=None):
    """
    Blends rule-based (55 %) + ML (45 %).
    Falls back to rule-based-only when ML model is not loaded.
    """
    rule_results, urgency, msg = rule_based_match(
        user_symptoms, age=age, gender=gender, duration_days=duration_days
    )
    if urgency == "EMERGENCY":
        return rule_results, urgency, msg

    ml_results = ml_predict(user_symptoms)
    if not ml_results:
        return rule_results, urgency, msg

    combined = {}
    for d, p in ml_results:
        combined[_normalise_disease(d)] = p * 0.45
    for d, p in rule_results:
        combined[d] = combined.get(d, 0.0) + p * 0.55

    final = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:3]
    total = sum(s for _, s in final)
    if total == 0:
        return rule_results, urgency, msg

    return [(d, round(s / total * 100, 2)) for d, s in final], urgency, msg


def generate_followup_questions(top3):
    """Return ≤6 high-signal symptom words from top candidate diseases."""
    questions = set()
    for disease, _ in top3:
        for w, _ in sorted(
            _disease_vectors.get(disease, {}).items(),
            key=lambda x: x[1], reverse=True
        ):
            if len(w) > 4:
                questions.add(w.replace(" ", "_"))
            if len(questions) >= 6:
                break
    return list(questions)[:6]


def final_prediction(top3, user_answers):
    """Refine top-3 using yes/no answers.  user_answers = {word: 'yes'|'no'}"""
    out = {}
    for disease, prob in top3:
        score   = prob
        profile = _disease_texts.get(disease, "")
        for sym, ans in user_answers.items():
            sym_clean = sym.lower().replace("_", " ")
            if sym_clean in profile:
                w = _idf(sym_clean.split()[0]) if sym_clean.split() else 1.0
                score += w * 0.5 if ans.lower() == "yes" else -w * 0.25
        out[disease] = max(0.0, score)
    return sorted(out.items(), key=lambda x: x[1], reverse=True)



   
