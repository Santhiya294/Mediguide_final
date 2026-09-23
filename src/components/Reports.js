import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiFileText, FiDownload, FiClock, FiActivity,
  FiUser, FiCalendar, FiTrendingUp, FiZap, FiX
} from "react-icons/fi";
import { Link } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "";

const URGENCY_COLOR = {
  EMERGENCY: { bg: "#450a0a", color: "#f87171", label: "Emergency" },
  HIGH: { bg: "#431407", color: "#fb923c", label: "High Priority" },
  MEDIUM: { bg: "#1c1917", color: "#fbbf24", label: "Medium Priority" },
  LOW: { bg: "#052e16", color: "#4ade80", label: "Low Priority" }
};

export default function Reports() {
  const [history, setHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("predictions");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("history") || "[]");
    setHistory((Array.isArray(stored) ? stored : []).slice(-20).reverse());
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API}/appointments`);
      const list = Array.isArray(res.data?.appointments) ? res.data.appointments : [];
      setAppointments(list);
      localStorage.setItem("appointments", JSON.stringify(list));
    } catch {
      const stored = JSON.parse(localStorage.getItem("appointments") || "[]");
      setAppointments(Array.isArray(stored) ? stored : []);
    }
  };

  const downloadPDF = async (appt) => {
    setPdfLoading(`${appt.doctor}${appt.date}${appt.time}`);
    try {
      const res = await axios.post(
        `${API}/generate-pdf`,
        {
          name: appt.patient_name || appt.name || "Patient",
          phone: appt.phone || "N/A",
          doctor: appt.doctor,
          date: appt.date,
          time: appt.time
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `appointment_${appt.doctor}_${appt.date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setPdfLoading(null);
  };

  const clearHistory = () => {
    localStorage.removeItem("history");
    setHistory([]);
  };

  const sx = {
    page: {
      padding: "24px 28px",
      color: "var(--text-main)",
      fontFamily: "'Inter', sans-serif",
      minHeight: "100vh"
    },
    header: { marginBottom: "24px" },
    title: {
      fontSize: "22px",
      fontWeight: 600,
      color: "var(--text-main)",
      marginBottom: "4px"
    },
    subtitle: {
      fontSize: "13px",
      color: "var(--text-muted)"
    },
    tabs: {
      display: "flex",
      gap: "4px",
      marginBottom: "24px",
      background: "var(--bg-darker)",
      borderRadius: "10px",
      padding: "4px",
      width: "fit-content"
    },
    tab: (active) => ({
      padding: "8px 20px",
      borderRadius: "8px",
      border: "none",
      background: active ? "var(--bg-card)" : "transparent",
      color: active ? "var(--text-main)" : "var(--text-muted)",
      fontSize: "13px",
      fontWeight: active ? 600 : 400,
      cursor: "pointer",
      transition: "all .15s"
    }),
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "12px",
      marginBottom: "24px"
    },
    statCard: {
      background: "var(--bg-card)",
      border: "1px solid var(--glass-border)",
      borderRadius: "12px",
      padding: "16px"
    },
    statNum: {
      fontSize: "24px",
      fontWeight: 700,
      color: "var(--text-main)",
      marginBottom: "2px"
    },
    statLabel: {
      fontSize: "12px",
      color: "var(--text-muted)"
    },
    card: {
      background: "var(--bg-card)",
      border: "1px solid var(--glass-border)",
      borderRadius: "14px",
      padding: "18px",
      marginBottom: "12px"
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px"
    },
    diseaseName: {
      fontSize: "15px",
      fontWeight: 600,
      color: "var(--text-main)"
    },
    urgencyBadge: (urgency) => ({
      fontSize: "11px",
      padding: "3px 10px",
      borderRadius: "20px",
      background: URGENCY_COLOR[urgency]?.bg || "#1e293b",
      color: URGENCY_COLOR[urgency]?.color || "#94a3b8",
      fontWeight: 600
    }),
    metaRow: {
      display: "flex",
      gap: "16px",
      flexWrap: "wrap",
      fontSize: "12px",
      color: "var(--text-muted)",
      marginBottom: "10px"
    },
    metaItem: {
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    confBar: {
      height: "6px",
      background: "var(--bg-darker)",
      borderRadius: "3px",
      overflow: "hidden",
      marginTop: "8px"
    },
    confFill: (conf) => ({
      height: "100%",
      width: `${conf}%`,
      background: conf >= 70 ? "#6366f1" : conf >= 50 ? "#f59e0b" : "#64748b",
      borderRadius: "3px",
      transition: "width .5s"
    }),
    symptomsBox: {
      background: "var(--bg-darker)",
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "12px",
      color: "var(--text-soft)",
      marginTop: "10px"
    },
    downloadBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 16px",
      background: "linear-gradient(135deg, var(--primary), var(--sky))",
      border: "none",
      borderRadius: "8px",
      color: "#fff",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "10px"
    },
    viewBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 14px",
      background: "transparent",
      border: "1px solid var(--glass-border)",
      borderRadius: "8px",
      color: "var(--text-soft)",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "10px"
    },
    statusBadge: (status) => ({
      fontSize: "11px",
      padding: "2px 8px",
      borderRadius: "20px",
      background: status === "Confirmed" ? "#052e16" : status === "Cancelled" ? "#450a0a" : "#1c1917",
      color: status === "Confirmed" ? "#4ade80" : status === "Cancelled" ? "#f87171" : "#fbbf24",
      fontWeight: 600
    }),
    empty: {
      textAlign: "center",
      padding: "60px 20px",
      color: "var(--text-muted)"
    },
    clearBtn: {
      fontSize: "12px",
      padding: "6px 14px",
      background: "transparent",
      border: "1px solid var(--glass-border)",
      borderRadius: "8px",
      color: "var(--text-muted)",
      cursor: "pointer"
    }
  };

  const emergencyCount = history.filter((h) => h.urgency === "EMERGENCY").length;
  const highCount = history.filter((h) => h.urgency === "HIGH").length;
  const avgConf = history.length > 0
    ? Math.round(history.reduce((a, h) => a + (h.confidence || 0), 0) / history.length)
    : 0;

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        <h2 style={sx.title}>Health Reports</h2>
        <p style={sx.subtitle}>Your complete diagnosis history and appointment reports</p>
      </div>

      <div style={sx.tabs}>
        <button style={sx.tab(activeTab === "predictions")} onClick={() => setActiveTab("predictions")}>
          <FiActivity size={13} style={{ marginRight: "5px" }} />
          Predictions ({history.length})
        </button>
        <button style={sx.tab(activeTab === "appointments")} onClick={() => setActiveTab("appointments")}>
          <FiCalendar size={13} style={{ marginRight: "5px" }} />
          Appointments ({appointments.length})
        </button>
      </div>

      {activeTab === "predictions" && (
        <>
          {history.length > 0 && (
            <div style={sx.statsRow}>
              <div style={sx.statCard}><div style={sx.statNum}>{history.length}</div><div style={sx.statLabel}>Total analyses</div></div>
              <div style={sx.statCard}><div style={{ ...sx.statNum, color: "#fb923c" }}>{emergencyCount}</div><div style={sx.statLabel}>Emergency alerts</div></div>
              <div style={sx.statCard}><div style={{ ...sx.statNum, color: "#fbbf24" }}>{highCount}</div><div style={sx.statLabel}>High priority</div></div>
              <div style={sx.statCard}><div style={{ ...sx.statNum, color: "#6366f1" }}>{avgConf}%</div><div style={sx.statLabel}>Avg confidence</div></div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{history.length} diagnosis report{history.length !== 1 ? "s" : ""}</span>
            {history.length > 0 && <button style={sx.clearBtn} onClick={clearHistory}>Clear history</button>}
          </div>

          {history.length === 0 ? (
            <div style={sx.empty}>
              <FiFileText size={44} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>No reports yet</p>
              <p style={{ fontSize: "13px", marginBottom: "16px" }}>Complete a diagnosis in the AI Assistant to generate reports</p>
              <Link to="/assistant" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "linear-gradient(135deg, var(--primary), var(--sky))", borderRadius: "10px", color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                <FiZap size={14} /> Start Diagnosis
              </Link>
            </div>
          ) : (
            history.map((item, i) => {
              const urgency = item.urgency || "LOW";
              return (
                <div key={i} style={sx.card}>
                  <div style={sx.cardHeader}>
                    <div>
                      <div style={sx.diseaseName}>{item.disease || "Unknown"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{item.specialist && `Specialist: ${item.specialist}`}</div>
                    </div>
                    <span style={sx.urgencyBadge(urgency)}>{URGENCY_COLOR[urgency]?.label || urgency}</span>
                  </div>

                  <div style={sx.metaRow}>
                    <div style={sx.metaItem}><FiClock size={11} /> {item.date || "Unknown date"}</div>
                    <div style={sx.metaItem}><FiTrendingUp size={11} /> {item.confidence || 0}% confidence</div>
                  </div>

                  <div style={sx.confBar}><div style={sx.confFill(item.confidence || 0)} /></div>
                  {item.symptoms && <div style={sx.symptomsBox}><strong>Symptoms:</strong> {item.symptoms}</div>}
                </div>
              );
            })
          )}
        </>
      )}

      {activeTab === "appointments" && (
        <>
          {appointments.length === 0 ? (
            <div style={sx.empty}>
              <FiCalendar size={44} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>No appointments yet</p>
              <p style={{ fontSize: "13px", marginBottom: "16px" }}>Book an appointment through the AI Assistant or Doctors page</p>
              <Link to="/doctors" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "linear-gradient(135deg, var(--primary), var(--sky))", borderRadius: "10px", color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                <FiUser size={14} /> Find Doctors
              </Link>
            </div>
          ) : (
            appointments.map((appt, i) => (
              <div key={i} style={sx.card}>
                <div style={sx.cardHeader}>
                  <div>
                    <div style={sx.diseaseName}>{appt.doctor}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Patient: {appt.patient_name || appt.name || "-"}</div>
                  </div>
                  <span style={sx.statusBadge(appt.status)}>{appt.status}</span>
                </div>

                <div style={sx.metaRow}>
                  <div style={sx.metaItem}><FiCalendar size={11} /> {appt.date}</div>
                  <div style={sx.metaItem}><FiClock size={11} /> {appt.time}</div>
                  {appt.phone && <div style={sx.metaItem}><FiUser size={11} /> {appt.phone}</div>}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button style={sx.viewBtn} onClick={() => setSelectedAppointment(appt)}>
                    <FiFileText size={13} /> View Details
                  </button>
                  {appt.status !== "Cancelled" && (
                    <button
                      style={sx.downloadBtn}
                      onClick={() => downloadPDF(appt)}
                      disabled={pdfLoading === `${appt.doctor}${appt.date}${appt.time}`}
                    >
                      <FiDownload size={13} />
                      {pdfLoading === `${appt.doctor}${appt.date}${appt.time}` ? "Generating..." : "Download PDF"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {selectedAppointment && (
        <div className="history-modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedAppointment(null)}>
          <div className="history-modal">
            <div className="history-modal-header">
              <h3>Appointment Details</h3>
              <button className="history-close" onClick={() => setSelectedAppointment(null)}>
                <FiX size={16} />
              </button>
            </div>

            <div className="history-section">
              <h4>Doctor</h4>
              <div className="history-kv"><span>Name</span><strong>{selectedAppointment.doctor || "-"}</strong></div>
              <div className="history-kv"><span>Specialization</span><strong>{selectedAppointment.specialization || "-"}</strong></div>
              <div className="history-kv"><span>Status</span><strong>{selectedAppointment.status || "-"}</strong></div>
            </div>

            <div className="history-section">
              <h4>Patient</h4>
              <div className="history-kv"><span>Name</span><strong>{selectedAppointment.patient_name || selectedAppointment.name || "-"}</strong></div>
              <div className="history-kv"><span>Phone</span><strong>{selectedAppointment.phone || "-"}</strong></div>
            </div>

            <div className="history-section">
              <h4>Schedule</h4>
              <div className="history-kv"><span>Date</span><strong>{selectedAppointment.date || "-"}</strong></div>
              <div className="history-kv"><span>Time</span><strong>{selectedAppointment.time || "-"}</strong></div>
              <div className="history-kv"><span>Booked On</span><strong>{selectedAppointment.booked_on || "-"}</strong></div>
              <div className="history-kv"><span>Booked At</span><strong>{selectedAppointment.booked_at || "-"}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
