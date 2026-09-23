import React, { useMemo, useState } from "react";
import { FiActivity, FiClock, FiTrash2, FiX } from "react-icons/fi";

function PredictionHistory() {
  const [history, setHistory] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("history") || "[]");
    return Array.isArray(stored) ? stored.slice().reverse() : [];
  });
  const [selected, setSelected] = useState(null);

  const hasData = history.length > 0;
  const total = useMemo(() => history.length, [history.length]);

  const clearHistory = () => {
    localStorage.removeItem("history");
    setHistory([]);
    setSelected(null);
  };

  const renderPredictionList = (item) => {
    const predictions = Array.isArray(item.predictions) ? item.predictions : [];
    if (predictions.length === 0) return null;

    return (
      <div className="history-section">
        <h4>Prediction Breakdown</h4>
        <div className="prediction-list">
          {predictions.slice(0, 5).map((pred, idx) => (
            <div className="prediction-row" key={`${pred.disease}-${idx}`}>
              <span>{pred.disease || "Unknown"}</span>
              <span>{typeof pred.confidence === "number" ? `${pred.confidence}%` : "-"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDoctors = (item) => {
    const doctors = Array.isArray(item.doctors) ? item.doctors : [];
    if (doctors.length === 0) return null;

    return (
      <div className="history-section">
        <h4>Recommended Doctors</h4>
        <div className="prediction-list">
          {doctors.slice(0, 4).map((doc, idx) => (
            <div className="prediction-row" key={`${doc["doctor name"] || doc.doctorName || "doctor"}-${idx}`}>
              <span>{doc["doctor name"] || doc.doctorName || "Doctor"}</span>
              <span>{doc.specialization || doc.specialty || "-"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="predictions-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 className="page-title">Prediction History</h2>
        {hasData && (
          <button className="view-btn" style={{ width: "auto" }} onClick={clearHistory}>
            <FiTrash2 size={13} /> Clear
          </button>
        )}
      </div>
      <p className="page-subtitle">Stored predictions from your assistant analysis sessions</p>

      {!hasData ? (
        <div className="no-data-card">
          <FiActivity size={52} className="no-data-icon" color="var(--text-muted)" />
          <p className="no-data-title">No predictions yet</p>
          <p className="no-data-desc">Start diagnosis from the Assistant page to store your prediction history.</p>
        </div>
      ) : (
        <>
          <div style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: "13px" }}>
            {total} record{total !== 1 ? "s" : ""} saved
          </div>
          <div className="history-grid">
            {history.map((item, index) => (
              <div key={index} className="history-card">
                <div className="history-header">
                  <span className="case-id">CASE {total - index}</span>
                  <span className="date">
                    <FiClock size={11} /> {item.date || "Unknown"}
                  </span>
                </div>

                <div className="symptoms">
                  <p className="symptoms-label">Symptoms</p>
                  <p className="symptoms-text">{item.symptoms || "-"}</p>
                </div>

                <div className="symptoms" style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--glass-border)" }}>
                  <p className="symptoms-label">Top Prediction</p>
                  <p className="disease-name">{item.disease || "Unknown"}</p>
                </div>

                <div className="actions">
                  <button className="view-btn" onClick={() => setSelected(item)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="history-modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="history-modal">
            <div className="history-modal-header">
              <h3>Prediction Details</h3>
              <button className="history-close" onClick={() => setSelected(null)}>
                <FiX size={16} />
              </button>
            </div>

            <div className="history-section">
              <h4>Summary</h4>
              <div className="history-kv"><span>Date</span><strong>{selected.date || "-"}</strong></div>
              <div className="history-kv"><span>Disease</span><strong>{selected.disease || "-"}</strong></div>
              <div className="history-kv"><span>Confidence</span><strong>{selected.confidence ? `${selected.confidence}%` : "-"}</strong></div>
              <div className="history-kv"><span>Specialist</span><strong>{selected.specialist || "-"}</strong></div>
              <div className="history-kv"><span>Urgency</span><strong>{selected.urgency || "-"}</strong></div>
              <div className="history-kv"><span>Method</span><strong>{selected.method || "-"}</strong></div>
              <div className="history-kv"><span>Personalized</span><strong>{selected.personalized ? "Yes" : "No"}</strong></div>
              <div className="history-kv"><span>Language</span><strong>{selected.language || "en"}</strong></div>
            </div>

            <div className="history-section">
              <h4>Symptoms Entered</h4>
              <p className="history-text">{selected.symptoms || "-"}</p>
            </div>

            {renderPredictionList(selected)}
            {renderDoctors(selected)}
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionHistory;
