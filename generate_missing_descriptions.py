import os
import pandas as pd
from tqdm import tqdm
from openai import OpenAI

# -------------------------
# 🔐 SET YOUR API KEY HERE
# -------------------------
client = OpenAI(api_key="YOUR_API_KEY_HERE")   # 🔥 replace this

# -------------------------
# 📁 PATH SETUP
# -------------------------
BASE = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(BASE, "..", "dataset", "final_dataset.csv")

DESC_PATH = os.path.join(
    BASE,
    "..",
    "AI-Health-Chatbot-main",
    "MasterData",
    "symptom_Description.csv"
)

OUTPUT_PATH = os.path.join(
    BASE,
    "..",
    "dataset",
    "symptom_Description_filled.csv"
)

# -------------------------
# 📊 LOAD DISEASES
# -------------------------
def load_diseases():
    df = pd.read_csv(DATASET_PATH)
    return sorted(df["disease"].astype(str).str.strip().unique())

# -------------------------
# 📊 LOAD EXISTING DESCRIPTIONS
# -------------------------
def load_descriptions():
    if os.path.exists(DESC_PATH):
        df = pd.read_csv(DESC_PATH, header=None, names=["disease", "description"])
        df["disease"] = df["disease"].astype(str).str.strip()
    else:
        df = pd.DataFrame(columns=["disease", "description"])
    return df

# -------------------------
# 🤖 GENERATE DESCRIPTION
# -------------------------
def generate_description(disease_name: str) -> str:
    try:
        prompt = (
            f"Write a short (1-2 sentence) medically accurate description of "
            f"'{disease_name}'. Do not give advice."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=100,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"⚠️ Error for {disease_name}: {e}")
        return "Description not available."

# -------------------------
# 🚀 MAIN FUNCTION
# -------------------------
def main():
    print("📂 Loading datasets...")

    all_diseases = load_diseases()
    desc_df = load_descriptions()

    existing = set(desc_df["disease"].str.lower())

    missing = [d for d in all_diseases if d.lower() not in existing]

    print(f"✅ Total diseases: {len(all_diseases)}")
    print(f"✅ Existing descriptions: {len(existing)}")
    print(f"🔥 Missing descriptions: {len(missing)}")

    new_rows = []

    for disease in tqdm(missing, desc="Generating descriptions"):
        description = generate_description(disease)
        new_rows.append({
            "disease": disease,
            "description": description
        })

    # Combine old + new
    final_df = pd.concat([desc_df, pd.DataFrame(new_rows)], ignore_index=True)

    # Save file
    final_df.to_csv(OUTPUT_PATH, index=False, header=False)

    print("\n🎉 DONE!")
    print(f"📁 File saved at: {OUTPUT_PATH}")

# -------------------------
# ▶️ RUN
# -------------------------
if __name__ == "__main__":
    main()