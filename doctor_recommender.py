

import pandas as pd
import os
import re
from difflib import get_close_matches, SequenceMatcher

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PATH     = os.path.join(BASE_DIR, "dataset", "doctordataset.csv")

df = pd.read_csv(PATH)

# Normalize column names
df.columns = df.columns.str.lower().str.strip()

# Normalize values
df["specialization"] = df["specialization"].astype(str).str.lower().str.strip()
df["doctor name"]    = df["doctor name"].astype(str)
df["location"]       = df["location"].astype(str)
df["availability"]   = df["availability"].astype(str).str.lower().str.strip()
df["rating"]         = pd.to_numeric(df["rating"], errors="coerce").fillna(0)

# All unique specializations in the dataset
all_specializations = df["specialization"].unique().tolist()

print("Doctor dataset loaded, total rows:", len(df))
print("Available specializations:", all_specializations[:10])


def clean_specialist_name(specialist):
    """
    Clean specialist name before matching.
    Removes suffixes, extra words added by prediction engine.
    Examples:
      'Cardiologist'         → 'cardiologist'
      'General Physician'    → 'general physician'
    """
    cleaned = re.sub(r'\s*\(.*?\)\s*', '', specialist).strip()
    return cleaned.lower().strip()


def similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def recommend_doctors(specialist):
    if not specialist:
        return []

    # Clean and normalize
    specialist_cleaned = clean_specialist_name(specialist)

    print(f"Requested Specialist: '{specialist_cleaned}'")

    doctors = pd.DataFrame()

    # ── Step 1: Exact match ──────────────────────────────────
    doctors = df[df["specialization"] == specialist_cleaned]
    if not doctors.empty:
        print(f"Found via exact match: {len(doctors)} doctors")

    # ── Step 2: Fuzzy match ──────────────────────────────────
    if doctors.empty:
        close = get_close_matches(
            specialist_cleaned, all_specializations, n=1, cutoff=0.6
        )
        if close:
            doctors = df[df["specialization"] == close[0]]
            print(f"Found via fuzzy match '{close[0]}': {len(doctors)} doctors")

    # ── Step 3: Contains match ───────────────────────────────
    # e.g. "cardiologist" contains "cardio"
    if doctors.empty:
        doctors = df[
            df["specialization"].str.contains(
                re.escape(specialist_cleaned), case=False, na=False
            )
        ]
        if not doctors.empty:
            print(f"Found via contains match: {len(doctors)} doctors")

    # ── Step 4: Reverse contains match ──────────────────────
    # e.g. dataset has "cardiologist", query is "cardiac surgeon"
    if doctors.empty:
        # Use first meaningful word of specialist name
        words = [w for w in specialist_cleaned.split() if len(w) > 4]
        for word in words:
            doctors = df[
                df["specialization"].str.contains(word, case=False, na=False)
            ]
            if not doctors.empty:
                print(f"Found via word match '{word}': {len(doctors)} doctors")
                break

    # ── Step 5: Similarity score match ───────────────────────
    if doctors.empty:
        best_sim  = 0
        best_spec = None
        for spec in all_specializations:
            sim = similarity(specialist_cleaned, spec)
            if sim > best_sim:
                best_sim  = sim
                best_spec = spec
        if best_sim >= 0.4 and best_spec:
            doctors = df[df["specialization"] == best_spec]
            print(f"Found via similarity '{best_spec}' ({best_sim:.2f}): {len(doctors)} doctors")

    # ── Step 6: Fallback to General Physician ────────────────
    if doctors.empty:
        print(f"No match for '{specialist_cleaned}', falling back to General Physician")
        doctors = df[
            df["specialization"].str.contains(
                "general physician", case=False, na=False
            )
        ]

    if doctors.empty:
        print("No doctors found at all.")
        return []

    # Sort by rating (highest first) and return top 3
    doctors = doctors.sort_values(by="rating", ascending=False)
    top3    = doctors.head(3)

    print(f"Returning {len(top3)} doctors")

    return top3[[
        "doctor name",
        "specialization",
        "location",
        "rating",
        "availability"
    ]].to_dict(orient="records")