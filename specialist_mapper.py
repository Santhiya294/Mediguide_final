

import pandas as pd
import os
import re
from difflib import get_close_matches, SequenceMatcher

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PATH     = os.path.join(BASE_DIR, "dataset", "FinalSymptomSpecialist.csv")

df = pd.read_csv(PATH, usecols=[0, 1])
df.columns = df.columns.str.lower().str.strip()
df["disease"]        = df["disease"].astype(str).str.lower().str.strip()
df["specialization"] = df["specialization"].astype(str).str.strip()

print("Specialist dataset loaded, total rows:", len(df))

# All disease names in dataset (lowercase)
all_diseases = df["disease"].tolist()


def clean_disease_name(disease):
    """
    Remove suffixes and tags that appear in our prediction output
    but are not in the dataset.
    Examples:
      'Heart Attack (Emergency)'  → 'Heart Attack'
      'Deep Vein Thrombosis (DVT)'→ 'Deep Vein Thrombosis'
      'Flu'                       → 'Flu'
    """
    # Remove anything in parentheses at the end
    cleaned = re.sub(r'\s*\(.*?\)\s*$', '', disease).strip()
    return cleaned


def similarity(a, b):
    """Return similarity ratio between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def get_specialist(disease):
    if not disease:
        return "General Physician"

    # Step 1: Clean the name (remove suffixes like (Emergency), (DVT))
    cleaned = clean_disease_name(disease).lower().strip()

    # Step 1.5: Deterministic keyword mapping for important diseases that
    # may be missing from the CSV mapping table.
    keyword_map = [
        (["tuberculosis", "tb", "pneumonia", "bronchitis", "asthma", "copd"], "Pulmonologist"),
        (["dengue", "malaria", "typhoid", "sepsis", "meningitis"], "Infectious Disease Specialist"),
        (["diabetes", "ketoacidosis", "thyroid", "pcos", "cushing"], "Endocrinologist"),
        (["migraine", "epilepsy", "stroke", "dementia", "alzheimer"], "Neurologist"),
        (["heart attack", "angina", "arrhythmia", "cardiac", "coronary"], "Cardiologist"),
        (["urinary tract infection", "cystitis", "bladder", "urolog"], "Urologist"),
        (["rash", "eczema", "psoriasis", "fungal infection", "skin"], "Dermatologist"),
    ]
    for keywords, specialist in keyword_map:
        if any(k in cleaned for k in keywords):
            return specialist

    # Step 2: Exact match on cleaned name
    match = df[df["disease"] == cleaned]
    if not match.empty:
        return match.iloc[0]["specialization"]

    # Step 3: Also try original name (lowercased)
    original_lower = disease.lower().strip()
    match = df[df["disease"] == original_lower]
    if not match.empty:
        return match.iloc[0]["specialization"]

    # Step 4: Fuzzy match on cleaned name (handles small differences)
    close = get_close_matches(cleaned, all_diseases, n=1, cutoff=0.6)
    if close:
        match = df[df["disease"] == close[0]]
        if not match.empty:
            return match.iloc[0]["specialization"]

    # Step 5: Fuzzy match on original name
    close = get_close_matches(original_lower, all_diseases, n=1, cutoff=0.6)
    if close:
        match = df[df["disease"] == close[0]]
        if not match.empty:
            return match.iloc[0]["specialization"]

    # Step 6: Partial contains match
    # Check if cleaned name is contained in any dataset disease name or vice versa
    partial = df[
        df["disease"].str.contains(re.escape(cleaned), case=False, na=False) |
        pd.Series([cleaned in d for d in df["disease"]])
    ]
    if not partial.empty:
        return partial.iloc[0]["specialization"]

    # Step 7: Word-level match
    # Split disease name into meaningful words (length > 3) and find best overlap
    words = [w for w in cleaned.split() if len(w) > 3]
    if words:
        best_score = 0
        best_specialist = None
        for _, row in df.iterrows():
            dataset_disease = row["disease"]
            # Count how many words from the query appear in the dataset disease name
            matches = sum(1 for w in words if w in dataset_disease)
            score   = matches / len(words)
            if score > best_score:
                best_score      = score
                best_specialist = row["specialization"]
        # Only use word match if at least 50% of words matched
        if best_score >= 0.5 and best_specialist:
            return best_specialist

    # Step 8: Similarity score fallback
    # Find the most similar disease name in dataset
    best_sim   = 0
    best_match = None
    for d in all_diseases:
        sim = similarity(cleaned, d)
        if sim > best_sim:
            best_sim   = sim
            best_match = d
    # Only use if similarity is reasonably high
    if best_sim >= 0.45 and best_match:
        match = df[df["disease"] == best_match]
        if not match.empty:
            return match.iloc[0]["specialization"]

    # Final fallback
    return "General Physician"
