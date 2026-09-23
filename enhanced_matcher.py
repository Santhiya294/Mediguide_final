

import os
from symptom_matcher import (
    rule_based_match,
    ml_predict,
    _normalise_disease,   # internal helper – title-cases disease names
)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "disease_model_logreg.pkl")  # FIXED path


# ─── SPECIALIST MAP ──────────────────────────────────────────────────────────
# Imported lazily so enhanced_matcher can work even if specialist_mapper.py
# hasn't been created yet (graceful degradation).
def _get_specialist(disease: str) -> str:
    try:
        from specialist_mapper import get_specialist
        return get_specialist(disease)
    except ImportError:
        return _fallback_specialist(disease)


def _fallback_specialist(disease: str) -> str:
    """Minimal built-in specialist lookup used when specialist_mapper.py is absent."""
    d = disease.lower()
    if any(k in d for k in ["heart", "cardiac", "angina", "coronary", "arrhythmia"]):
        return "Cardiologist"
    if any(k in d for k in ["lung", "asthma", "bronch", "pneumonia", "copd",
                              "pulmonary", "respiratory", "tuberculosis"]):
        return "Pulmonologist"
    if any(k in d for k in ["brain", "neuro", "meningit", "epilepsy",
                              "seizure", "migraine", "stroke"]):
        return "Neurologist"
    if any(k in d for k in ["diabetes", "thyroid", "insulin", "hormone",
                              "adrenal", "pituitary", "metabolic"]):
        return "Endocrinologist"
    if any(k in d for k in ["kidney", "renal", "urinary", "bladder",
                              "nephr", "cystitis"]):
        return "Nephrologist / Urologist"
    if any(k in d for k in ["liver", "hepat", "gallbladder", "pancr",
                              "gastro", "intestin", "colon", "stomach",
                              "ulcer", "bowel", "appendic"]):
        return "Gastroenterologist"
    if any(k in d for k in ["skin", "dermat", "rash", "eczema",
                              "psoriasis", "acne", "allerg"]):
        return "Dermatologist"
    if any(k in d for k in ["joint", "arthrit", "bone", "orthop",
                              "fracture", "spine", "muscul"]):
        return "Orthopedician"
    if any(k in d for k in ["eye", "vision", "retina", "ophthalm",
                              "cataract", "glaucoma"]):
        return "Ophthalmologist"
    if any(k in d for k in ["ear", "nose", "throat", "sinus",
                              "tonsil", "pharyngit", "laryngit"]):
        return "ENT Specialist"
    if any(k in d for k in ["cancer", "tumor", "oncol", "lymphoma",
                              "leukemia", "malignant"]):
        return "Oncologist"
    if any(k in d for k in ["mental", "depression", "anxiety",
                              "schizophrenia", "bipolar", "psychi"]):
        return "Psychiatrist"
    if any(k in d for k in ["blood", "anemia", "haematol",
                              "platelet", "clot", "haemophilia"]):
        return "Haematologist"
    if any(k in d for k in ["gum", "tooth", "dental", "jaw",
                              "oral", "mouth ulcer"]):
        return "Dentist"
    if any(k in d for k in ["ovarian", "uterine", "menstrual", "cervical",
                              "vaginal", "endometriosis", "pregnancy"]):
        return "Gynaecologist"
    if any(k in d for k in ["prostate", "testicular", "erectile"]):
        return "Urologist"
    return "General Physician"


# ─── HYBRID MATCHER CLASS ─────────────────────────────────────────────────────

class HybridSymptomMatcher:
    """
    Combines rule-based TF-IDF matching with ML classification.

    Rule weight : 55 %
    ML weight   : 45 %
    """

    def __init__(self):
        self.ml_available = os.path.exists(MODEL_PATH)

    def hybrid_match(
        self,
        user_symptoms,
        use_ml        = True,
        age           = None,
        gender        = None,
        duration_days = None,
    ):
        """
        Returns (results, urgency, emergency_msg)
          results : [(disease_name, confidence_pct), ...]   top-3
        """
        # ── 1. Rule-based (always runs) ────────────────────────────────────
        rule_results, urgency, emergency_msg = rule_based_match(
            user_symptoms,
            age           = age,
            gender        = gender,
            duration_days = duration_days,
        )

        # ── 2. Emergency short-circuit ────────────────────────────────────
        if urgency == "EMERGENCY":
            return rule_results, "EMERGENCY", emergency_msg

        if not rule_results:
            return [], "LOW", ""

        # ── 3. Try ML blend ───────────────────────────────────────────────
        if self.ml_available and use_ml:
            try:
                ml_results = ml_predict(user_symptoms)
                if ml_results:
                    combined = {}
                    for disease, conf in ml_results:
                        combined[_normalise_disease(disease)] = (conf / 100) * 0.45
                    for disease, conf in rule_results:
                        combined[disease] = combined.get(disease, 0.0) + (conf / 100) * 0.55

                    top3  = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:3]
                    total = sum(s for _, s in top3)
                    if total > 0:
                        normalised = [(d, round((s / total) * 100, 2)) for d, s in top3]
                        return normalised, urgency, emergency_msg
            except Exception as exc:
                print(f"⚠️  ML blend failed, using rule-based only : {exc}")

        return rule_results, urgency, emergency_msg


# ─── PUBLIC ENTRY POINT (called by app.py) ───────────────────────────────────

def enhanced_predict_disease(
    user_symptoms,
    age           = None,
    gender        = None,
    duration_days = None,
):
    """
    Main entry point for app.py  →  /predict endpoint.

    Returns a dict:
    {
        "predictions": [
            {"disease": str, "confidence": float, "specialist": str},
            ...
        ],
        "urgency":     "HIGH" | "MEDIUM" | "LOW" | "EMERGENCY",
        "disclaimer":  str,
        # only present on EMERGENCY:
        "alert":             str,
        "emergency_message": str,
    }
    """
    matcher = HybridSymptomMatcher()

    results, urgency, emergency_msg = matcher.hybrid_match(
        user_symptoms,
        age           = age,
        gender        = gender,
        duration_days = duration_days,
    )

    if not results:
        return {"error": "No matching diseases found for the given symptoms."}

    predictions = [
        {
            "disease"   : disease,
            "confidence": confidence,
            "specialist": _get_specialist(disease),
        }
        for disease, confidence in results
    ]

    response = {
        "predictions": predictions,
        "urgency"    : urgency,
        "disclaimer" : (
            "⚠️  This is not medical advice. "
            "Results are indicative only — always consult a qualified healthcare professional."
        ),
    }

    if emergency_msg:
        response["alert"]             = emergency_msg
        response["emergency_message"] = emergency_msg

    return response



           