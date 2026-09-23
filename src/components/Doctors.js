import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  FiMapPin, FiStar, FiClock,
  FiUser, FiArrowRight, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";

const API = process.env.REACT_APP_API_URL || "";

const TIME_SLOTS = ["10:00 AM", "12:00 PM", "3:00 PM", "5:00 PM"];
const DEFAULT_SPECIALTY_CARDS = [
  "All",
  "Cardiologist",
  "Rheumatologist",
  "Oral Surgeon",
  "Neurologist",
  "Ophthalmologist",
  "Dermatologist",
  "Orthopedist",
  "Nutritionist",
  "Gastroenterologist",
  "immunologist",
  "Hematologist",
  "ENT Specialist",
  "Electrophysiologist",
  "General Physician",
  "periodontist",
  "Endocrinologist",
  "Gynecologist",
  "Emergency Medicine Specialist",
  "Anesthesiologist",
  "pulmonologist",
  "Infectious Disease Specialist",
  "oncologist",
  "Dentist",
  "Pediatric Surgeon",
  "Urologist",
  "Vascular Surgeons",
  "Podiatrist",
  "Hepatologist",
  "Psychiatrist",
  "Plastic Surgeon",
  "General Surgeon",
  "Critical Care Specialist",
  "Addictionologists",
  "Dietitian"
];



const SPECIALTY_REQUEST_ALIAS = {
  "Vasular Surgon": "Vascular Surgeons",
  "Vascular Surgeon": "Vascular Surgeons",
  "Addictionlogists": "Addictionologists",
  "Dietician": "Dietitian"
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ name: "", phone: "", date: "", time: "" });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookMsg, setBookMsg] = useState({ text: "", type: "" });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState("");

  const normalizeSpecialization = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const normalizeDoctors = (payload) => {
    const toTitleCase = (value) =>
      String(value || "")
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const list = Array.isArray(payload?.doctors)
      ? payload.doctors
      : Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    return list.map((doc) => ({
      ...doc,
      doctorName:
        doc["doctor name"] ||
        doc["Doctor Name"] ||
        doc.doctor_name ||
        doc.name ||
        "Unknown Doctor",
      specialization:
        toTitleCase(
          doc.specialization ||
          doc.Specialization ||
          doc.specialty ||
          doc["specialist"] ||
          "General Physician"
        ),
      location: doc.location || doc.city || "Location unavailable",
      rating: Number(doc.rating) || 0,
      availability: doc.availability || "Available"
    }));
  };

  const fetchDoctors = async (specializationValue = "all") => {
    setLoading(true);
    setError("");
    setApiStatus(
      specializationValue && specializationValue !== "all"
        ? `Loading ${specializationValue} doctors...`
        : "Loading doctors from API..."
    );
    try {
      const candidates = Array.from(new Set([
        API,
        "",
        "http://127.0.0.1:5000",
        "http://localhost:5000"
      ]));

      let parsed = [];
      let lastError = null;

      for (const base of candidates) {
        try {
          console.log(`Trying to fetch from ${base}/api/doctors`);
          const res = await axios.get(`${base}/api/doctors`, {
            timeout: 8000,
            params: {
              _ts: Date.now(),
              force_reload: 1,
              specialization: specializationValue
            }
          });
          console.log('API response:', res.data);
          const current = normalizeDoctors(res.data);
          console.log('Normalized doctors:', current.length);
          if (current.length > 0) {
            parsed = current;
            setApiStatus(
              specializationValue && specializationValue !== "all"
                ? `Loaded ${current.length} ${specializationValue} doctors`
                : `Loaded ${current.length} doctors from ${base}/api/doctors`
            );
            break;
          }
          if (parsed.length === 0) {
            parsed = current;
            setApiStatus(
              specializationValue && specializationValue !== "all"
                ? `No doctors found under ${specializationValue}`
                : `Connected to ${base}/api/doctors but received 0 doctors`
            );
          }
        } catch (e) {
          console.error(`Error fetching from ${base}:`, e);
          lastError = e;
        }
      }

      if (parsed.length === 0 && lastError) {
        throw lastError;
      }

      console.log('Final doctors array:', parsed);
      setDoctors(parsed);
      setFiltered(parsed);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      setDoctors([]);
      setFiltered([]);
      setError("Could not load doctors. Please ensure backend is running on port 5000.");
      setApiStatus("API request failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors("all");
  }, []);

  useEffect(() => {
    let list = [...doctors];
    if (specialty !== "All") {
      const selectedSpec = normalizeSpecialization(specialty);
      list = list.filter((d) => normalizeSpecialization(d.specialization) === selectedSpec);
    }
    setFiltered(list);
  }, [specialty, doctors]);

  const totalDoctors = useMemo(() => filtered.length, [filtered]);
  const totalAllDoctors = useMemo(() => doctors.length, [doctors]);
  const specialties = useMemo(() => {
    const unique = Array.from(
      new Set(
        doctors
          .map((d) => d.specialization)
          .filter(Boolean)
          .map((s) => String(s).trim())
      )
    ).sort((a, b) => a.localeCompare(b));
    if (unique.length > 0) return ["All", ...unique];
    return DEFAULT_SPECIALTY_CARDS;
  }, [doctors]);
  const categoryCounts = useMemo(() => {
    const counts = {};
    doctors.forEach((d) => {
      const key = d.specialization || "General Physician";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [doctors]);

  const openBooking = (doctor) => {
    setBookingDoctor(doctor);
    setBookMsg({ text: "", type: "" });
    setBookingForm({ name: "", phone: "", date: "", time: "" });
    setBookedSlots([]);
  };

  const fetchSlots = async (doctor, date) => {
    if (!date) return;
    try {
      const res = await axios.post(`${API}/booked-slots`, {
        doctor: doctor.doctorName,
        date
      });
      setBookedSlots(res.data || []);
    } catch {
      setBookedSlots([]);
    }
  };

  const handleBook = async () => {
    const { name, phone, date, time } = bookingForm;
    if (!name || !phone || !date || !time) {
      setBookMsg({ text: "Please fill all fields", type: "error" });
      return;
    }

    setBookingLoading(true);
    try {
      const res = await axios.post(`${API}/book`, {
        name,
        phone,
        date,
        time,
        doctor: bookingDoctor.doctorName
      });
      const existing = JSON.parse(localStorage.getItem("appointments") || "[]");
      existing.push({
        patient_name: name,
        phone,
        doctor: bookingDoctor.doctorName,
        specialization: bookingDoctor.specialization,
        date,
        time,
        status: "Confirmed",
        booked_on: new Date().toLocaleDateString(),
        booked_at: new Date().toLocaleTimeString()
      });
      localStorage.setItem("appointments", JSON.stringify(existing.slice(-200)));
      setBookMsg({ text: res.data.message || "Appointment Confirmed!", type: "success" });
      setTimeout(() => setBookingDoctor(null), 2000);
    } catch (err) {
      setBookMsg({ text: err.response?.data?.error || "Booking failed", type: "error" });
    }
    setBookingLoading(false);
  };

  const sx = {
    page: {
      padding: "24px 28px",
      color: "#e2e8f0",
      fontFamily: "'Inter', sans-serif",
      minHeight: "100vh"
    },
    header: {
      marginBottom: "24px"
    },
    title: {
      fontSize: "22px",
      fontWeight: 600,
      color: "#f1f5f9",
      marginBottom: "4px"
    },
    statLine: {
      fontSize: "12px",
      color: "#94a3b8",
      marginTop: "6px"
    },
    retryBtn: {
      marginTop: "10px",
      padding: "7px 12px",
      fontSize: "12px",
      borderRadius: "8px",
      border: "1px solid var(--glass-border)",
      background: "var(--bg-card)",
      color: "var(--text-soft)",
      cursor: "pointer"
    },
    subtitle: {
      fontSize: "13px",
      color: "#94a3b8"
    },
    filterRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "10px"
    },
    filterBtn: (active) => ({
      padding: "12px 14px",
      borderRadius: "12px",
      border: active ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
      background: active ? "rgba(99,102,241,0.25)" : "var(--bg-card)",
      color: active ? "var(--primary-light)" : "var(--text-soft)",
      fontSize: "13px",
      cursor: "pointer",
      transition: "all .15s",
      fontWeight: active ? 700 : 500,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }),
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "16px"
    },
    card: {
      background: "var(--bg-card)",
      border: "1px solid var(--glass-border)",
      borderRadius: "14px",
      padding: "18px",
      transition: "border-color .2s"
    },
    cardTop: {
      display: "flex",
      gap: "14px",
      marginBottom: "14px",
      alignItems: "flex-start"
    },
    avatar: {
      width: "46px",
      height: "46px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, var(--primary), var(--sky))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      fontWeight: 700,
      color: "#fff",
      flexShrink: 0
    },
    doctorName: {
      fontSize: "15px",
      fontWeight: 600,
      color: "#f1f5f9",
      marginBottom: "2px"
    },
    specBadge: {
      fontSize: "11px",
      background: "rgba(99,102,241,0.18)",
      color: "var(--primary-light)",
      borderRadius: "6px",
      padding: "2px 8px",
      display: "inline-block"
    },
    specialistText: {
      fontSize: "12px",
      color: "var(--text-main)",
      marginTop: "6px"
    },
    cardInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "14px",
      fontSize: "12px",
      color: "#94a3b8"
    },
    infoRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "6px"
    },
    stars: (rating) => ({
      color: rating >= 4.5 ? "#fbbf24" : rating >= 4 ? "#f59e0b" : "#d97706",
      fontSize: "12px",
      fontWeight: 600
    }),
    bookBtn: {
      width: "100%",
      padding: "9px",
      background: "linear-gradient(135deg, var(--primary), var(--sky))",
      border: "none",
      borderRadius: "9px",
      color: "#fff",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    empty: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#64748b"
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    },
    modal: {
      background: "var(--bg-card)",
      border: "1px solid var(--glass-border)",
      borderRadius: "16px",
      padding: "24px",
      width: "100%",
      maxWidth: "420px"
    },
    modalTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#f1f5f9",
      marginBottom: "4px"
    },
    modalSub: {
      fontSize: "12px",
      color: "#94a3b8",
      marginBottom: "20px"
    },
    label: {
      fontSize: "12px",
      color: "#94a3b8",
      marginBottom: "5px",
      display: "block"
    },
    input: {
      width: "100%",
      background: "#0f172a",
      border: "1px solid var(--glass-border)",
      borderRadius: "8px",
      padding: "9px 12px",
      color: "#e2e8f0",
      fontSize: "13px",
      marginBottom: "12px",
      outline: "none",
      boxSizing: "border-box"
    },
    slotsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "8px",
      marginBottom: "16px"
    },
    slotBtn: (selected, booked) => ({
      padding: "9px",
      borderRadius: "8px",
      border: selected ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
      background: booked ? "#1e1e2e" : selected ? "rgba(99,102,241,0.25)" : "#0f172a",
      color: booked ? "#475569" : selected ? "#c7d2fe" : "#94a3b8",
      fontSize: "12px",
      cursor: booked ? "not-allowed" : "pointer",
      textDecoration: booked ? "line-through" : "none"
    }),
    confirmBtn: {
      width: "100%",
      padding: "11px",
      background: "linear-gradient(135deg, var(--primary), var(--sky))",
      border: "none",
      borderRadius: "10px",
      color: "#fff",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      marginBottom: "8px"
    },
    cancelBtn: {
      width: "100%",
      padding: "9px",
      background: "transparent",
      border: "1px solid var(--glass-border)",
      borderRadius: "10px",
      color: "#94a3b8",
      fontSize: "13px",
      cursor: "pointer"
    },
    msgBox: (type) => ({
      padding: "10px 12px",
      borderRadius: "8px",
      background: type === "success" ? "#052e16" : "#450a0a",
      color: type === "success" ? "#4ade80" : "#f87171",
      fontSize: "13px",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    })
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "DR";

  const handleSpecialtyClick = (value) => {
    setSpecialty(value);
    const normalizedValue = SPECIALTY_REQUEST_ALIAS[value] || value;
    const requestValue = normalizedValue === "All" ? "all" : normalizedValue;
    fetchDoctors(requestValue);
  };

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        <h2 style={sx.title}>Doctors List</h2>
        <p style={sx.subtitle}>Browse and book appointments with specialists near you</p>
        <p style={sx.statLine}>
          Categories: {Math.max(0, specialties.length - 1)} | Total Doctors in dataset: {totalAllDoctors}
        </p>
        <p style={{ ...sx.statLine, marginTop: "4px" }}>{apiStatus}</p>
      </div>

      {error && (
        <div style={sx.msgBox("error")}>
          <FiAlertCircle size={14} />
          {error}
        </div>
      )}

      <div style={sx.filterRow}>
        {specialties.map((s) => (
          <button
            key={s}
            style={sx.filterBtn(specialty === s)}
            onClick={() => handleSpecialtyClick(s)}
          >
            <span>{s}</span>
            <span style={{ opacity: 0.8 }}>
              {s === "All" ? totalAllDoctors : (categoryCounts[s] || 0)}
            </span>
          </button>
        ))}
      </div>

      <div style={{ margin: "16px 0", fontSize: "13px", color: "#64748b" }}>
        Showing {totalDoctors} of {totalAllDoctors} doctor{totalAllDoctors !== 1 ? "s" : ""}
      </div>

      {loading ? (
        <div style={sx.empty}>Loading doctors...</div>
      ) : filtered.length === 0 ? (
        <div style={sx.empty}>
          <FiUser size={40} style={{ marginBottom: "12px", opacity: 0.4 }} />
          <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>No doctors found</p>
          <p style={{ fontSize: "13px" }}>
            {specialty === "All"
              ? "No doctors available in dataset."
              : `No doctors available under ${specialty}.`}
          </p>
        </div>
      ) : (
        <div style={sx.grid}>
          {filtered.map((doc, i) => (
            <div key={i} style={sx.card}>
                <div style={sx.cardTop}>
                  <div style={sx.avatar}>{getInitials(doc.doctorName)}</div>
                  <div>
                    <div style={sx.doctorName}>{doc.doctorName}</div>
                    <span style={sx.specBadge}>{doc.specialization}</span>
                    <div style={sx.specialistText}>Specialist: {doc.specialization || "General Physician"}</div>
                  </div>
                </div>

              <div style={sx.cardInfo}>
                <div style={sx.infoRow}>
                  <FiMapPin size={12} style={{ marginTop: "1px", flexShrink: 0 }} />
                  <span>{doc.location}</span>
                </div>
                <div style={sx.infoRow}>
                  <FiStar size={12} style={{ marginTop: "1px", flexShrink: 0 }} />
                  <span style={sx.stars(doc.rating)}>{doc.rating} ★</span>
                  <span style={{ marginLeft: "4px" }}>rating</span>
                </div>
                <div style={sx.infoRow}>
                  <FiClock size={12} style={{ marginTop: "1px", flexShrink: 0 }} />
                  <span>{doc.availability || "Available"}</span>
                </div>
              </div>

              <button style={sx.bookBtn} onClick={() => openBooking(doc)}>
                Book Directly <FiArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {bookingDoctor && (
        <div style={sx.overlay} onClick={(e) => e.target === e.currentTarget && setBookingDoctor(null)}>
          <div style={sx.modal}>
            <div style={sx.modalTitle}>{bookingDoctor.doctorName}</div>
            <div style={sx.modalSub}>{bookingDoctor.specialization} · {bookingDoctor.location}</div>

            {bookMsg.text && (
              <div style={sx.msgBox(bookMsg.type)}>
                {bookMsg.type === "success" ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
                {bookMsg.text}
              </div>
            )}

            <label style={sx.label}>Patient Name *</label>
            <input
              style={sx.input}
              placeholder="Your full name"
              value={bookingForm.name}
              onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
            />

            <label style={sx.label}>Phone *</label>
            <input
              style={sx.input}
              placeholder="Your phone number"
              value={bookingForm.phone}
              onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
            />

            <label style={sx.label}>Date *</label>
            <input
              style={sx.input}
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={bookingForm.date}
              onChange={(e) => {
                setBookingForm({ ...bookingForm, date: e.target.value, time: "" });
                fetchSlots(bookingDoctor, e.target.value);
              }}
            />

            <label style={sx.label}>Time Slot *</label>
            <div style={sx.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const booked = bookedSlots.includes(slot);
                const selected = bookingForm.time === slot;
                return (
                  <button
                    key={slot}
                    style={sx.slotBtn(selected, booked)}
                    disabled={booked}
                    onClick={() => !booked && setBookingForm({ ...bookingForm, time: slot })}
                  >
                    {slot} {booked ? "(Booked)" : ""}
                  </button>
                );
              })}
            </div>

            <button
              style={sx.confirmBtn}
              onClick={handleBook}
              disabled={bookingLoading}
            >
              {bookingLoading ? "Confirming..." : "Confirm Booking"}
            </button>
            <button style={sx.cancelBtn} onClick={() => setBookingDoctor(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
