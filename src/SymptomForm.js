import axios from "axios";
import React, { useState, useEffect ,useCallback} from "react";
import { FiMic, FiArrowRight, FiMapPin, FiStar, FiCalendar, FiClock, FiPhone, FiUser, FiCheckCircle, FiXCircle, FiRefreshCw, FiZap, FiAlertCircle, FiUserPlus, FiBook } from "react-icons/fi";
import strings from "./strings";

const API = process.env.REACT_APP_API_URL || "";
const ALLOWED_LANGUAGES = {
  ta: "Tamil",
  en: "English",
  hi: "Hindi"
};
const ALLOWED_LANGUAGE_CODES = ["ta", "en", "hi"];

function SymptomForm() {
  const [symptoms, setSymptoms]           = useState("");
  const [durationDays, setDurationDays]   = useState("");
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState("");
  const [language, setLanguage]           = useState("en");
  const [loading, setLoading]             = useState(false);
  const [listening, setListening]         = useState(false);

  // Advanced Features State
  const [userProfile, setUserProfile]     = useState(null);
  const [userId, setUserId]               = useState(localStorage.getItem('user_id') || null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [medicalNews, setMedicalNews]     = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState(ALLOWED_LANGUAGES);
  const [uiTranslations, setUiTranslations] = useState({});
  const [personalizedMode, setPersonalizedMode] = useState(false);

  // Profile Form State
  const [profileData, setProfileData]     = useState({
    name: '', age: '', gender: '', location: '',
    medical_history: [], allergies: [], current_medications: [],
    family_history: [], lifestyle_factors: {}
  });

  const [patientName, setPatientName]     = useState("");
  const [phone, setPhone]                 = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot]   = useState("");
  const [selectedDate, setSelectedDate]   = useState("");
  const [bookedSlots, setBookedSlots]     = useState([]);
  const [userLocation, setUserLocation]   = useState("");

  const slots = ["10:00 AM", "12:00 PM", "3:00 PM", "5:00 PM"];

  // Initialize advanced features
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation(`${pos.coords.latitude},${pos.coords.longitude}`),
        ()  => setUserLocation("Tiruchirappalli")
      );
    } else {
      setUserLocation("Tiruchirappalli");
    }
  }, []);

  // Load supported languages
  const loadSupportedLanguages = async () => {
    try {
      const res = await axios.get(`${API}/api/languages`);
      const apiLanguages = res.data?.languages || {};
      const filteredLanguages = ALLOWED_LANGUAGE_CODES.reduce((acc, code) => {
        acc[code] = apiLanguages[code] || ALLOWED_LANGUAGES[code];
        return acc;
      }, {});
      setSupportedLanguages(filteredLanguages);
    } catch (err) {
      console.log("Could not load languages");
      setSupportedLanguages(ALLOWED_LANGUAGES);
    }
  };

  // Load medical news
  const loadMedicalNews = async () => {
    try {
      const res = await axios.get(`${API}/api/news?limit=5`);
      setMedicalNews(res.data.news);
    } catch (err) {
      console.log("Could not load medical news");
    }
  };

  // ✅ MOVED HERE: Define loadUserProfile BEFORE useEffect
  const loadUserProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API}/api/user/profile/${userId}`);
      setUserProfile(res.data);
      setProfileData(res.data);
    } catch (err) {
      console.log("Could not load user profile");
    }
  }, [userId]);

  // ✅ NOW useEffect can safely use loadUserProfile
  useEffect(() => {
    loadSupportedLanguages();
    loadMedicalNews();
    if (userId) {
      loadUserProfile();
    }
  }, [userId, loadUserProfile]);

  // Create user profile
  const createUserProfile = async () => {
    // Validate required fields
    if (!profileData.name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!profileData.age || profileData.age < 1 || profileData.age > 120) {
      alert("Please enter a valid age (1-120)");
      return;
    }
    if (!profileData.gender) {
      alert("Please select your gender");
      return;
    }

    try {
      const res = await axios.post(`${API}/api/user/profile`, profileData);
      const newUserId = res.data.user_id;
      setUserId(newUserId);
      localStorage.setItem('user_id', newUserId);
      setUserProfile(profileData);
      setShowProfileForm(false);
      setPersonalizedMode(true);
      alert("Profile created successfully! You can now get personalized health predictions.");
    } catch (err) {
      console.error("Profile creation error:", err);
      alert(`Failed to create profile: ${err.response?.data?.error || err.message}`);
    }
  };

  // Update language and load translations
  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    try {
      const res = await axios.get(`${API}/api/ui/translations/${newLang}`);
      setUiTranslations(res.data.translations);
    } catch (err) {
      console.log("Could not load translations");
    }
  };  
  // Language detection function
  const detectLanguage = async (text) => {
    try {
      // Fix #2: Added proper parentheses for constructor
      const langDetector = new (window.LanguageDetector || (function() {}))();
      const result = await langDetector.detect(text);
      return result.language || 'en';
    } catch {
      // Fix #3: Changed \x00 control character to \u0000 Unicode escape
      // eslint-disable-next-line no-control-regex
      const hasNonEnglish = /[^\u0000-\u007F]/.test(text);
      return hasNonEnglish ? 'ta' : 'en';
    }
  };
  
  // Better voice input support detection
  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { 
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return; 
    }
    const recognition = new SR();
    recognition.lang = language === 'ta' ? 'ta-IN' : (language === 'hi' ? 'hi-IN' : 'en-IN');
    setListening(true);
    recognition.start();
    recognition.onresult = e => setSymptoms(e.results[0][0].transcript);
    recognition.onend = () => setListening(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setResult(null);
    if (!symptoms.trim()) { setError(strings.pleaseEnterSymptoms); return; }

    try {
      setLoading(true);

      // Detect input language
      const detectedLang = await detectLanguage(symptoms);
      console.log('Detected language:', detectedLang);
      
      let englishSymptoms = symptoms;
      let originalLang = 'en';
      
      // Translate to English if not already English
      if (detectedLang !== 'en') {
        englishSymptoms = await translateText(symptoms, detectedLang, 'en');
        originalLang = detectedLang;
        console.log('Translated to English:', englishSymptoms);
      }

      let endpoint = `${API}/predict`;
      let payload = {
        symptoms:      englishSymptoms,
        age:           profileData.age           || null,
        gender:        profileData.gender         || null,
        duration_days: durationDays ? parseInt(durationDays) : null
      };

      // Use personalized prediction if user profile exists
      if (personalizedMode && userId) {
        endpoint = `${API}/api/predict/personalized`;
        payload = {
          symptoms:      englishSymptoms,
          user_id:       userId,
          language:      originalLang,
          age:           profileData.age           || null,
          gender:        profileData.gender         || null,
          duration_days: durationDays ? parseInt(durationDays) : null
        };
      }

      const res = await axios.post(endpoint, payload);
      let resultData = res.data;

      // Translate results back to original language if needed
      if (originalLang !== 'en' && resultData.predictions) {
        const translatedPredictions = await Promise.all(
          resultData.predictions.map(async (pred) => ({
            ...pred,
            disease: await translateText(pred.disease, 'en', originalLang),
            description: pred.description ? 
              await translateText(pred.description, 'en', originalLang) : pred.description
          }))
        );
        resultData.predictions = translatedPredictions;
      }

      setResult(resultData);

      // Save to history with original language
      const history = JSON.parse(localStorage.getItem("history") || "[]");
      let disease = "Unknown";
      let confidence = 0;

      if (resultData.predictions && resultData.predictions.length > 0) {
        disease = resultData.predictions[0].disease;
        confidence = resultData.predictions[0].confidence;
      } else if (resultData.diseases && resultData.diseases.length > 0) {
        disease = resultData.diseases[0][0];
        confidence = resultData.diseases[0][1];
      }

      history.push({
        symptoms: symptoms, // Save original symptoms
        disease,
        confidence,
        specialist: resultData.specialist || "Unknown",
        urgency: resultData.urgency || "MEDIUM",
        method: resultData.method || "standard",
        personalized: resultData.personalized || false,
        language: originalLang,
        predictions: Array.isArray(resultData.predictions) ? resultData.predictions : [],
        diseases: Array.isArray(resultData.diseases) ? resultData.diseases : [],
        doctors: Array.isArray(resultData.doctors) ? resultData.doctors : [],
        date: new Date().toLocaleString()
      });
      localStorage.setItem("history", JSON.stringify(history.slice(-100)));
    } catch (err) {
      console.error('Analysis error:', err);
      setError(strings.predictionFailed);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async (doctor, date) => {
    if (!doctor || !date) return;
    try {
      const res = await axios.post(`${API}/booked-slots`, { doctor, date });
      setBookedSlots(res.data);
    } catch { console.log(strings.errorFetchingSlots); }
  };

  const bookAppointment = async () => {
    if (!patientName || !phone || !selectedDoctor || !selectedSlot || !selectedDate) {
      alert(strings.fillAllDetailsAlert); return;
    }
    try {
      await axios.post(`${API}/book`, {
        name: patientName, phone,
        doctor: selectedDoctor["doctor name"],
        date: selectedDate, time: selectedSlot,
      });
      const existing = JSON.parse(localStorage.getItem("appointments") || "[]");
      existing.push({
        patient_name: patientName,
        phone,
        doctor: selectedDoctor["doctor name"],
        specialization: selectedDoctor.specialization,
        date: selectedDate,
        time: selectedSlot,
        status: "Confirmed",
        booked_on: new Date().toLocaleDateString(),
        booked_at: new Date().toLocaleTimeString()
      });
      localStorage.setItem("appointments", JSON.stringify(existing.slice(-200)));
      alert(strings.bookingSuccessfulAlert);
      const pdfRes = await axios.post(`${API}/generate-pdf`, {
        name: patientName, phone,
        doctor: selectedDoctor["doctor name"],
        date: selectedDate, time: selectedSlot,
      }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const link = document.createElement("a");
      link.href = url; link.download = "appointment.pdf"; link.click();
      fetchBookedSlots(selectedDoctor["doctor name"], selectedDate);
    } catch { alert(strings.slotAlreadyBookedAlert); }
  };

  const cancelAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    await axios.post(`${API}/cancel`, {
      doctor: selectedDoctor["doctor name"],
      date: selectedDate, time: selectedSlot,
    });
    alert(strings.appointmentCancelledAlert);
    fetchBookedSlots(selectedDoctor["doctor name"], selectedDate);
  };

  const rescheduleAppointment = async () => {
    const newDate = prompt(strings.reschedulePromptDate);
    const newTime = prompt(strings.reschedulePromptTime);
    if (!newDate || !newTime) return;
    await axios.post(`${API}/reschedule`, {
      doctor: selectedDoctor["doctor name"],
      old_date: selectedDate, old_time: selectedSlot,
      new_date: newDate, new_time: newTime,
    });
    alert(strings.appointmentRescheduledAlert);
    const pdfRes = await axios.post(`${API}/generate-pdf`, {
      name: patientName, phone,
      doctor: selectedDoctor["doctor name"],
      date: newDate, time: newTime,
    }, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
    const link = document.createElement("a");
    link.href = url; link.download = "updated_appointment.pdf"; link.click();
  };

  // Translation function
  const translateText = async (text, fromLang, toLang) => {
    try {
      const response = await fetch('http://localhost:5000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from: fromLang, to: toLang })
      });
      
      const data = await response.json();
      return data.translated || text; // Fallback to original text
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  return (
    <div style={sx.root}>
      <style>{inlineCss}</style>

      {/* Advanced Features Header */}
      <div style={sx.advancedHeader}>
        <div style={sx.header}>
          <div style={sx.headerIcon}><FiZap size={18} color="#fff" /></div>
          <div>
            <h2 style={sx.headerTitle}>MediGuide AI Assistant</h2>
            <p style={sx.headerSub}>Advanced Health Prediction with Personalization</p>
          </div>
        </div>

        {/* Language & Profile Controls */}
        <div style={sx.controlsRow}>
          <select
            className="sf-select"
            value={language}
            onChange={e => changeLanguage(e.target.value)}
            style={sx.languageSelect}
          >
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>

          <button
            className="sf-btn-secondary"
            onClick={() => setShowProfileForm(true)}
            style={sx.profileBtn}
          >
            <FiUserPlus size={16} /> {userId ? 'Update Profile' : 'Create Profile'}
          </button>

          {userId && (
            <div style={sx.profileStatus}>
              <FiUser size={16} />
              <span>{userProfile?.name || 'User'}</span>
              <button
                onClick={() => setPersonalizedMode(!personalizedMode)}
                style={{
                  ...sx.toggleBtn,
                  backgroundColor: personalizedMode ? '#4caf50' : '#666'
                }}
              >
                {personalizedMode ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Form Modal */}
      {showProfileForm && (
        <div style={sx.modalOverlay}>
          <div style={sx.modal}>
            <div style={sx.modalHeader}>
              <h3>Create Your Health Profile</h3>
              <p style={sx.modalSubtitle}>This helps us provide personalized health predictions</p>
            </div>

            <div style={sx.formGrid}>
              <div style={sx.formSection}>
                <label style={sx.formLabel}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  style={sx.input}
                />
              </div>

              <div style={sx.formSection}>
                <label style={sx.formLabel}>Age *</label>
                <input
                  type="number"
                  placeholder="e.g., 35"
                  value={profileData.age}
                  onChange={e => setProfileData({...profileData, age: e.target.value})}
                  style={sx.input}
                />
              </div>

              <div style={sx.formSection}>
                <label style={sx.formLabel}>Gender *</label>
                <select
                  value={profileData.gender}
                  onChange={e => setProfileData({...profileData, gender: e.target.value})}
                  style={sx.input}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={sx.formSection}>
                <label style={sx.formLabel}>Location</label>
                <input
                  type="text"
                  placeholder="e.g., New York"
                  value={profileData.location}
                  onChange={e => setProfileData({...profileData, location: e.target.value})}
                  style={sx.input}
                />
              </div>
            </div>

            <div style={sx.infoBox}>
              <p style={sx.infoText}>
                ℹ️ Your profile information is stored securely and helps us:
              </p>
              <ul style={sx.infoBullets}>
                <li>Adjust disease predictions based on your demographics</li>
                <li>Track your health history over time</li>
                <li>Provide age and gender-specific recommendations</li>
              </ul>
            </div>
            <div style={sx.modalButtons}>
              <button onClick={() => setShowProfileForm(false)} style={sx.cancelBtn}>Cancel</button>
              <button onClick={createUserProfile} style={sx.saveBtn}>Create Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Medical News Section */}
      {false && (
        <div className="sf-card" style={sx.newsCard}>
          <div style={sx.newsHeader}>
            <FiBook size={18} />
            <h3>Latest Medical News</h3>
            <button onClick={loadMedicalNews} style={sx.refreshBtn}>
              <FiRefreshCw size={14} />
            </button>
          </div>
          <div style={sx.newsList}>
            {medicalNews.length > 0 ? (
              medicalNews.slice(0, 3).map((news, i) => (
                <div key={i} style={sx.newsItem}>
                  <div style={sx.newsCategory}>{news.category}</div>
                  <h4 style={sx.newsTitle}>{news.title}</h4>
                  <p style={sx.newsDesc}>{news.description}</p>
                  <a href={news.url} target="_blank" rel="noopener noreferrer" style={sx.newsLink}>
                    Read More →
                  </a>
                </div>
              ))
            ) : (
              <p style={sx.noNews}>No news available at the moment.</p>
            )}
          </div>
        </div>
      )}

      {/* Input card */}
      <div className="sf-card" style={{ position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div className="sf-scanning-overlay">
            <div className="sf-scanline" />
            <div className="sf-scan-text">
              {personalizedMode ? 'Personalized AI Analysis...' : 'AI Diagnostic Engine Scanning...'}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="sf-form-row">
            <input
              className="sf-input"
              type="text"
              placeholder={uiTranslations.symptoms_placeholder || strings.speakOrTypePlaceholder}
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0" }}>
            <label style={{ fontSize: "13px", color: "#aaa", whiteSpace: "nowrap" }}>
              Duration (days):
            </label>
            <input
              type="number"
              min="1"
              max="365"
              placeholder="e.g., 3"
              value={durationDays}
              onChange={e => setDurationDays(e.target.value)}
              style={{
                width: "90px",
                padding: "7px 10px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#1e1e2e",
                color: "#fff",
                fontSize: "13px"
              }}
            />
          </div>

          <div style={sx.btnRow}>
            <button type="button" className={`sf-btn-voice${listening ? " sf-btn-voice--active" : ""}`} onClick={handleVoice}>
              <FiMic size={17} />
              {listening ? strings.listening : strings.voiceBtn}
            </button>
            <button type="submit" className="sf-btn-predict" disabled={loading || !symptoms.trim()}>
              {loading ? (
                <>
                  <span className="sf-spinner" /> {strings.analyzingSymptomsStatus}
                </>
              ) : (
                <>{uiTranslations.predict_button || strings.predictBtn} <FiArrowRight size={15} /></>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div style={sx.errBox}>
            <FiAlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="sf-result-card sf-fade">
          <div style={sx.resultHeader}>
            <h3 style={sx.resultTitle}>{uiTranslations.results_title || strings.predictionResultTitle}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={sx.resultBadge}>
                {result.personalized ? 'Personalized AI' : 'AI Enhanced'}
              </span>
              {result.urgency && (
                <span style={{
                  ...sx.urgencyBadge,
                  backgroundColor: result.urgency === 'HIGH' ? '#ff4757' : result.urgency === 'MEDIUM' ? '#ffa726' : '#4caf50'
                }}>
                  <FiAlertCircle size={12} />
                  {result.urgency} Priority
                </span>
              )}
            </div>
          </div>

          {/* Enhanced predictions display */}
          {result.predictions ? (
            result.predictions.slice(0, 3).map((pred, i) => (
              <div key={i} className="sf-disease-row" style={{ '--rank': i }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                  <div style={{
                    ...sx.rankBadge,
                    background: i === 0 ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)",
                    color: i === 0 ? "var(--primary-light)" : "var(--text-muted)",
                    border: `1px solid ${i === 0 ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`
                  }}>
                    #{i + 1}
                  </div>
                  <div>
                    <strong style={{ fontSize: "15px", color: "#fff" }}>{pred.disease}</strong>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {pred.specialist}
                    </div>
                  </div>
                </div>
                <div style={sx.confBar}>
                  <div style={{ ...sx.confFill, width: `${pred.confidence}%`, opacity: 1 - i * 0.2 }} />
                  <span style={sx.confLabel}>{pred.confidence}%</span>
                </div>
              </div>
            ))
          ) : (
            /* Fallback for old format */
            result.diseases?.slice(0, 3).map((d, i) => (
              <div key={i} className="sf-disease-row" style={{ '--rank': i }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                  <div style={{
                    ...sx.rankBadge,
                    background: i === 0 ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)",
                    color: i === 0 ? "var(--primary-light)" : "var(--text-muted)",
                    border: `1px solid ${i === 0 ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`
                  }}>
                    #{i + 1}
                  </div>
                  <strong style={{ fontSize: "15px", color: "#fff" }}>{d[0]}</strong>
                </div>
                <div style={sx.confBar}>
                  <div style={{ ...sx.confFill, width: `${d[1]}%`, opacity: 1 - i * 0.2 }} />
                  <span style={sx.confLabel}>{d[1]}%</span>
                </div>
              </div>
            ))
          )}

          {result.disclaimer && (
            <div style={sx.disclaimerBox}>
              <FiAlertCircle size={14} color="#ffa726" />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {result.disclaimer}
              </span>
            </div>
          )}

          {result.specialist && (
            <div style={sx.specialistTag}>
              <FiCheckCircle size={14} color="var(--secondary)" />
              Recommended Specialist: <strong style={{ color: "var(--secondary)" }}>{result.specialist}</strong>
            </div>
          )}
        </div>
      )}

      {/* Doctor Cards */}
      {result?.doctors && (
        <div className="sf-doctors sf-fade">
          <h3 style={sx.docHeading}>{strings.recommendedDoctorsTitle}</h3>

          {result.doctors.map((doc, idx) => (
            <div className="sf-doc-card" key={idx}>
              <div style={sx.docHeader}>
                <div style={sx.docAvatar}>
                  {doc["doctor name"]?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={sx.docName}>{doc["doctor name"]}</h4>
                  <p style={sx.docSpec}>{doc.specialization}</p>
                  <div style={sx.docMeta}>
                    <span style={sx.docMetaItem}><FiMapPin size={12} /> {doc.location}</span>
                    <span style={sx.docMetaItem}><FiStar size={12} color="#f59e0b" /> {doc.rating}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation}&destination=${encodeURIComponent(doc.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sf-map-btn"
                >
                  <FiMapPin size={13} /> Directions
                </a>
              </div>

              <div className="sf-book-form">
                <div className="sf-book-row">
                  <div className="sf-field">
                    <label className="sf-label"><FiUser size={12} /> Patient Name</label>
                    <input className="sf-input sf-input--sm" placeholder={strings.patientNamePlaceholder} value={patientName} onChange={e => setPatientName(e.target.value)} />
                  </div>
                  <div className="sf-field">
                    <label className="sf-label"><FiPhone size={12} /> Phone</label>
                    <input className="sf-input sf-input--sm" placeholder={strings.phonePlaceholder} value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="sf-book-row">
                  <div className="sf-field">
                    <label className="sf-label"><FiCalendar size={12} /> Date</label>
                    <input
                      className="sf-input sf-input--sm"
                      type="date"
                      onChange={e => {
                        setSelectedDoctor(doc);
                        setSelectedDate(e.target.value);
                        fetchBookedSlots(doc["doctor name"], e.target.value);
                      }}
                    />
                  </div>
                  <div className="sf-field">
                    <label className="sf-label"><FiClock size={12} /> Time Slot</label>
                    <select className="sf-select sf-input--sm" onChange={e => setSelectedSlot(e.target.value)}>
                      <option>{strings.selectSlotDefault}</option>
                      {slots.map((slot, i) => (
                        <option key={i} value={slot} disabled={bookedSlots.includes(slot)}>
                          {bookedSlots.includes(slot) ? `${slot} ${strings.slotFull}` : slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={sx.docBtnRow}>
                  <button onClick={bookAppointment} className="sf-btn-book">
                    <FiCheckCircle size={14} /> {strings.bookBtn}
                  </button>
                  <button onClick={cancelAppointment} className="sf-btn-cancel">
                    <FiXCircle size={14} /> {strings.cancelBtn}
                  </button>
                  <button onClick={rescheduleAppointment} className="sf-btn-reschedule">
                    <FiRefreshCw size={14} /> {strings.rescheduleBtn}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────
   Inline JS styles (layout/logic-driven)
────────────────────────────────────── */
const sx = {
  root: { color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "20px" },
  header: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" },
  headerIcon: {
    width: 42, height: 42, borderRadius: 12,
    background: "linear-gradient(135deg, var(--primary), #4f46e5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px var(--primary-glow)", flexShrink: 0
  },
  headerTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: 20,
    fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.3px"
  },
  headerSub: { fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" },
  btnRow: { display: "flex", gap: 12, marginTop: 18 },
  errBox: {
    display: "flex", alignItems: "center", gap: 8,
    color: "#f87171", background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12,
    padding: "10px 14px", fontSize: 14, marginTop: 14
  },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  resultTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: 18,
    fontWeight: 700, color: "#fff", margin: 0
  },
  resultBadge: {
    fontSize: 11, fontWeight: 700, padding: "4px 10px",
    borderRadius: 999, background: "rgba(124,58,237,0.15)",
    color: "var(--primary-light)", border: "1px solid rgba(124,58,237,0.25)",
    letterSpacing: 0.5, textTransform: "uppercase"
  },
  rankBadge: {
    width: 32, height: 24, borderRadius: 8, display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0
  },
  confBar: {
    display: "flex", alignItems: "center", gap: 8,
    width: 140, flexShrink: 0
  },
  confFill: {
    height: 5, borderRadius: 9999,
    background: "linear-gradient(to right, var(--primary), var(--secondary))",
    flex: 1, maxWidth: "calc(100% - 36px)"
  },
  confLabel: { fontSize: 12, color: "var(--text-muted)", width: 32, textAlign: "right", flexShrink: 0 },
  specialistTag: {
    display: "flex", alignItems: "center", gap: 8,
    marginTop: 16, paddingTop: 16,
    borderTop: "1px solid var(--glass-border)",
    fontSize: 14, color: "var(--text-muted)"
  },
  docHeading: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: 20,
    fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.3px"
  },
  docHeader: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 },
  docAvatar: {
    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 800, color: "#fff"
  },
  docName: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 },
  docSpec: { fontSize: 13, color: "var(--secondary)", margin: "4px 0 6px", fontWeight: 500 },
  docMeta: { display: "flex", gap: 14 },
  urgencyBadge: {
    fontSize: 11, fontWeight: 700, padding: "4px 8px",
    borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4,
    textTransform: "uppercase", letterSpacing: 0.5
  },
  disclaimerBox: {
    display: "flex", alignItems: "flex-start", gap: 8,
    padding: "12px 16px", margin: "16px 0",
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: 12
  },
  docMetaItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" },
  docBtnRow: { display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" },

  // Advanced Features Styles
  advancedHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  controlsRow: { display: "flex", gap: "12px", alignItems: "center" },
  languageSelect: {
    padding: "8px 12px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "14px"
  },
  profileBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px"
  },
  profileStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.1)",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#fff"
  },
  toggleBtn: {
    padding: "4px 8px",
    borderRadius: "12px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold"
  },

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    background: "var(--bg-card)",
    backdropFilter: "blur(16px)",
    border: "1px solid var(--glass-border)",
    borderRadius: "20px",
    padding: "24px",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    margin: "20px 0"
  },
  "@media (min-width: 600px)": {
    formGrid: {
      gridTemplateColumns: "1fr 1fr"  // Two columns on larger screens
    }
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "14px"
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "20px"
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    cursor: "pointer"
  },
  saveBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    background: "var(--primary)",
    border: "none",
    color: "#fff",
    cursor: "pointer"
  },
  modalHeader: {
    marginBottom: "20px"
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "var(--text-muted)",
    margin: "4px 0 0"
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  formLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff"
  },
  infoBox: {
    background: "rgba(79, 70, 229, 0.1)",
    border: "1px solid rgba(79, 70, 229, 0.2)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px"
  },
  infoText: {
    fontSize: "13px",
    color: "#c7d2fe",
    margin: "0 0 10px 0"
  },
  infoBullets: {
    fontSize: "13px",
    color: "#c7d2fe",
    margin: "0",
    paddingLeft: "20px"
  },

  // News Styles
  newsCard: { marginBottom: "20px" },
  newsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px"
  },
  newsList: { display: "flex", flexDirection: "column", gap: "16px" },
  newsItem: {
    padding: "16px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  newsCategory: {
    fontSize: "12px",
    color: "var(--primary)",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: "8px"
  },
  newsTitle: {
    fontSize: "16px",
    color: "#fff",
    margin: "0",
    fontWeight: "600",
    lineHeight: "1.3"
  },
  newsDesc: {
    fontSize: "14px",
    color: "var(--text-muted)",
    margin: "0 0 12px 0",
    lineHeight: "1.4"
  },
  newsLink: {
    color: "var(--secondary)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500"
  },
  refreshBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "4px"
  }
};

/* ──────────────────────────────────────
   CSS string for class-based styles
────────────────────────────────────── */
const inlineCss = `
.sf-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 26px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.sf-form-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
@media(min-width:600px) {
  .sf-form-row { flex-direction: row; }
  .sf-form-row .sf-select { width: 170px; flex-shrink: 0; }
}

.sf-input {
  width: 100%;
  padding: 13px 16px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  color: #fff;
  font-family: inherit;
  font-size: 14.5px;
  outline: none;
  transition: all 0.25s ease;
}
.sf-input::placeholder { color: var(--text-dim); }
.sf-input:focus {
  border-color: var(--primary);
  background: rgba(124,58,237,0.06);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
}
.sf-input--sm { padding: 10px 14px; font-size: 13.5px; }

.sf-select {
  padding: 13px 16px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  color: #fff;
  font-family: inherit;
  font-size: 14.5px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.25s;
  width: 100%;
}
.sf-select:focus { border-color: var(--primary); }
.sf-select option { background: var(--bg-darker); }

.sf-btn-voice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 14px;
  border: 1px solid var(--glass-border-hover);
  background: rgba(255,255,255,0.05);
  color: var(--text-soft);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.22s ease;
  flex-shrink: 0;
  font-family: inherit;
}
.sf-btn-voice:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
.sf-btn-voice--active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(247,37,133,0.1);
  animation: pulseGlow 1s ease-in-out infinite;
}
@keyframes pulseGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(247,37,133,0.3); }
  50%      { box-shadow: 0 0 0 8px rgba(247,37,133,0); }
}

.sf-btn-predict {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 22px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), #4f46e5);
  color: #fff;
  font-weight: 700;
  font-size: 14.5px;
  cursor: pointer;
  box-shadow: 0 4px 18px var(--primary-glow);
  transition: all 0.25s ease;
  font-family: inherit;
}
.sf-btn-predict:hover { transform: translateY(-2px); box-shadow: 0 8px 28px var(--primary-glow); }
.sf-btn-predict:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.sf-spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

.sf-result-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-left: 3px solid var(--secondary);
  border-radius: 20px;
  padding: 26px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.sf-disease-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--glass-border);
}
.sf-disease-row:last-of-type { border-bottom: none; }

.sf-doctors {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sf-doc-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.28s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.sf-doc-card:hover {
  border-color: rgba(124,58,237,0.3);
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(124,58,237,0.1);
}

.sf-map-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(6,214,160,0.1);
  border: 1px solid rgba(6,214,160,0.25);
  color: var(--secondary) !important;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}
.sf-map-btn:hover {
  background: rgba(6,214,160,0.2);
  box-shadow: 0 0 12px var(--secondary-glow);
}

.sf-book-form { border-top: none; padding-top: 18px; }

.sf-book-row {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}
@media(max-width:600px) { .sf-book-row { flex-direction: column; } }

.sf-field { flex: 1; min-width: 0; }
.sf-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 7px;
  letter-spacing: 0.3px;
}

.sf-btn-book {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, var(--secondary), #059669);
  color: #fff; font-weight: 700; font-size: 13.5px;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 4px 14px var(--secondary-glow);
  transition: all 0.2s;
}
.sf-btn-book:hover { transform: translateY(-2px); box-shadow: 0 8px 20px var(--secondary-glow); }

.sf-btn-cancel {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 10px; font-weight: 600; font-size: 13.5px;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.sf-btn-cancel:hover { background: rgba(239,68,68,0.8); color: #fff; border-color: transparent; }

.sf-btn-reschedule {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: rgba(245,158,11,0.1);
  color: #fbbf24;
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 10px; font-weight: 600; font-size: 13.5px;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.sf-btn-reschedule:hover { background: rgba(245,158,11,0.8); color: #fff; border-color: transparent; }

.sf-scanning-overlay {
  position: absolute;
  inset: 0;
  background: rgba(3, 7, 18, 0.85);
  backdrop-filter: blur(12px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}
.sf-scanline {
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  box-shadow: 0 0 20px var(--primary-glow);
  position: absolute;
  top: 0;
  animation: scanningEffect 2s linear infinite;
}
@keyframes scanningEffect {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
.sf-scan-text {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--primary-light);
  letter-spacing: 1px;
  animation: pulse-ring 2s infinite;
}

.sf-fade { animation: fadeUp 0.35s ease-out; }

.urgency-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.disclaimer-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  margin: 16px 0;
}
`;

export default SymptomForm;
