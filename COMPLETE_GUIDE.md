# MediGuide AI - Complete End-to-End System Guide 🩺

Welcome to the newly overhauled **MediGuide AI** Healthcare System. This project has been fully converted from its original base into a high-end, vibrant, and interactive diagnostic platform.

## 🌟 Key Upgrades

### 1. **Elite UI/UX Design**
- **Vibrant Aesthetic**: A dark-theme base with neon accents (Vivid Purple, Emerald Green, Electric Cyan).
- **Glassmorphism**: High-quality glass panels with blur effects, thin borders, and premium shadows.
- **Dynamic Backgrounds**: Mesh gradients, animated floating orbs, and a high-tech scanning laser effect.
- **Micro-Animations**: Features smooth transitions, pulsing buttons, and hover-triggered accent lines.

### 2. **Refined AI Engine**
- **Chatbot Intelligence**: Fixed follow-up question logic and confidence-based prediction stops.
- **Safety First**: Implemented safeguards for "Unknown" diseases to suggest further description rather than crashing.
- **Clean Data Flow**: Resolved Numpy/Pandas JSON serialization issues for reliable API responses.

### 3. **Branded Features**
- **AI Scanning HUD**: A dedicated scanning overlay in the Symptom Form provides real-time visual feedback while the AI "works".
- **Medical Reports**: A premium "Reports" section with branded cards for downloading PDF summaries.
- **Session Persistence**: Stay logged in across page refreshes using local storage synchronization.

---

## 🚀 Getting Started

### **Prerequisites**
Ensure you have the following installed:
- Python 3.8+
- Node.js & npm

### **1. Setup & Run Backend (Python/Flask)**
Navigate to the `backend/` directory:
```bash
pip install flask flask-cors pandas numpy scikit-learn googletrans==4.0.0-rc1 reportlab pytz langdetect
python app.py
```
*The server will run on `http://127.0.0.1:5000`*

### **2. Setup & Run Frontend (React)**
Navigate to the `frontend/` directory:
```bash
npm install
npm start
```
*The app will open on `http://localhost:3000`*

---

## 📁 Project Structure

```text
/backend
├── app.py                # Main Flask API (Unified & Fixed)
├── Health_Chat_bot.py    # Core Chatbot Logic (NLP & Prediction)
├── symptom_matcher.py    # Rule-based disease matching
├── doctor_recommender.py # Specialist & Doctor lookup
├── voice_input.py        # Speech-to-text integration (Refactored for API)
└── dataset/              # Medical Knowledge Base (CSV)

/frontend
├── src/
│   ├── index.css         # Global Design System (vibrant theme)
│   ├── App.css           # Layout & Sidebar styles
│   ├── app.js            # Main Component & Routing
│   ├── Chatbox.js        # AI Assistant Chat Interface
│   ├── SymptomForm.js    # Scanning Form & Results
│   └── components/       # Login, Home, Dashboard, Reports, Settings
```

## 🔐 Login Credentials (Demo)
By default, the system allows any email/password for the demo.
- **User**: `test@test.com`
- **Pass**: `password` (or anything)

Enjoy your new **Elite AI Healthcare Assistant**!
