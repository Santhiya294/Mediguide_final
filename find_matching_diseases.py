import pandas as pd

df = pd.read_csv('dataset/final_dataset.csv')

# Find diseases that have 'chest pain' AND ('shortness of breath' OR 'breathing')
chest_pain_diseases = df[df['symptoms'].str.lower().str.contains('chest', case=False) &
                        df['symptoms'].str.lower().str.contains('pain', case=False) &
                        (df['symptoms'].str.lower().str.contains('breathing', case=False) |
                         df['symptoms'].str.lower().str.contains('breath', case=False))]

print(f'Diseases with chest pain + breathing issues: {len(chest_pain_diseases)}')
for _, row in chest_pain_diseases.head(5).iterrows():
    print(f'  {row["disease"]}')
print()

# Find diseases with urination + thirst
urination_diseases = df[df['symptoms'].str.lower().str.contains('urination', case=False) &
                       df['symptoms'].str.lower().str.contains('thirst', case=False)]

print(f'Diseases with urination + thirst: {len(urination_diseases)}')
for _, row in urination_diseases.head(5).iterrows():
    print(f'  {row["disease"]}')

# Check what the actual symptoms are for these diseases
if not urination_diseases.empty:
    print(f'\nActual symptoms for {urination_diseases.iloc[0]["disease"]}:')
    print(urination_diseases.iloc[0]['symptoms'])