import pandas as pd
import re
import os

# ---------- COMMON CLEAN FUNCTION ----------
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'[^a-zA-Z ]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# -------------------------
# Path Setup
# -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    
    "dataset",
    "FinalDiseaseSymptom.csv"
)

SAVE_PATH = os.path.join(
    BASE_DIR,
    
    "dataset",
    "final_dataset.csv"
)

# -------------------------
# Load Dataset
# -------------------------
df = pd.read_csv(DATA_PATH)

print("Original dataset size:", len(df))

# -------------------------
# Normalize column names
# -------------------------
df.columns = df.columns.str.lower().str.strip()

# -------------------------
# Combine Symptoms
# -------------------------
def combine_symptoms(row):
    symptoms = []

    for col in df.columns:
        if "symptom" in col:   # 🔥 important (lowercase match)
            val = str(row[col]).strip()

            if val != "nan" and val != "":
                val = val.replace("_", " ")
                symptoms.append(val)

    return " ".join(symptoms)

df["symptoms"] = df.apply(combine_symptoms, axis=1)

# -------------------------
# Clean Text
# -------------------------
df["symptoms"] = df["symptoms"].apply(clean_text)

# -------------------------
# Keep Required Columns
# -------------------------
if "disease" not in df.columns:
    raise Exception("❌ 'disease' column not found in dataset")

df = df[["symptoms", "disease"]]

# -------------------------
# Remove Empty + Duplicates
# -------------------------
df = df[df["symptoms"] != ""]   # 🔥 remove empty
df = df.dropna()
df = df.drop_duplicates()

print("Cleaned dataset size:", len(df))

# -------------------------
# Save Dataset
# -------------------------
df.to_csv(SAVE_PATH, index=False)

print("✅ Preprocessing completed!")
print("Saved at:", SAVE_PATH)