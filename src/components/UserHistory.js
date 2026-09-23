import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiClock, FiUser, FiCalendar, FiTrendingUp, FiHeart } from "react-icons/fi";

const API = process.env.REACT_APP_API_URL || "";

function UserHistory({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    commonSymptoms: [],
    avgConfidence: 0,
    lastPrediction: null
  });

  useEffect(() => {
    if (userId) {
      loadUserHistory();
    }
  }, [userId]);

  const loadUserHistory = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/user/history/${userId}`);
      const historyData = response.data.history;
      setHistory(historyData);
      calculateStats(historyData);
    } catch (error) {
      console.error("Failed to load user history:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (historyData) => {
    if (!historyData || historyData.length === 0) return;

    const totalPredictions = historyData.length;

    // Count symptom frequencies
    const symptomCount = {};
    let totalConfidence = 0;
    let confidenceCount = 0;

    historyData.forEach(entry => {
      // Count symptoms
      entry.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });

      // Calculate average confidence
      if (entry.predictions && entry.predictions.length > 0) {
        totalConfidence += entry.predictions[0].confidence;
        confidenceCount++;
      }
    });

    // Get top symptoms
    const commonSymptoms = Object.entries(symptomCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const lastPrediction = historyData[0]; // Most recent first

    setStats({
      totalPredictions,
      commonSymptoms,
      avgConfidence: Math.round(avgConfidence),
      lastPrediction
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa726';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  if (!userId) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <FiUser size={48} color="#4f46e5" />
          <h3>Create Your Health Profile</h3>
          <p>Create your health profile to enable personalized predictions and track your medical history.</p>
          <div style={styles.benefitsList}>
            <div style={styles.benefit}>✓ Personalized disease predictions</div>
            <div style={styles.benefit}>✓ Health history tracking</div>
            <div style={styles.benefit}>✓ Demographic-based insights</div>
          </div>
          <button 
            onClick={() => window.location.hash = '#create-profile'}
            style={styles.primaryBtn}
          >
            Create Profile Now
          </button>
          <p style={styles.helpText}>
            Go to the assistant tab and click "Create Profile" to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <FiClock size={20} color="#4f46e5" />
          <h2 style={styles.title}>Your Health History</h2>
        </div>
        <button onClick={loadUserHistory} style={styles.refreshBtn} disabled={loading}>
          <FiTrendingUp size={16} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Stats Overview */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <history size={20} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalPredictions}</div>
            <div style={styles.statLabel}>Total Predictions</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FiTrendingUp size={20} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.avgConfidence}%</div>
            <div style={styles.statLabel}>Avg Confidence</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FiHeart size={20} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.commonSymptoms.length}</div>
            <div style={styles.statLabel}>Tracked Symptoms</div>
          </div>
        </div>
      </div>

      {/* Common Symptoms */}
      {stats.commonSymptoms.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Common Symptoms</h3>
          <div style={styles.symptomsList}>
            {stats.commonSymptoms.map((item, index) => (
              <div key={index} style={styles.symptomTag}>
                {item.symptom}
                <span style={styles.symptomCount}>({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History List */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Predictions</h3>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Loading your health history...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={styles.empty}>
            <FiClock size={48} color="#ccc" />
            <p>No prediction history yet.</p>
            <p>Start by entering your symptoms for personalized analysis.</p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {history.map((entry, index) => (
              <div key={index} style={styles.historyItem}>
                <div style={styles.historyHeader}>
                  <div style={styles.historyDate}>
                    <FiCalendar size={14} />
                    {formatDate(entry.timestamp)}
                  </div>
                  <div
                    style={{
                      ...styles.urgencyBadge,
                      backgroundColor: getUrgencyColor(entry.urgency)
                    }}
                  >
                    {entry.urgency || 'Unknown'} Priority
                  </div>
                </div>

                <div style={styles.historyContent}>
                  <div style={styles.symptoms}>
                    <strong>Symptoms:</strong> {entry.symptoms.join(', ')}
                  </div>

                  {entry.predictions && entry.predictions.length > 0 && (
                    <div style={styles.prediction}>
                      <strong>Top Prediction:</strong> {entry.predictions[0].disease}
                      <span style={styles.confidence}>
                        ({entry.predictions[0].confidence}% confidence)
                      </span>
                    </div>
                  )}

                  {entry.specialist && (
                    <div style={styles.specialist}>
                      <strong>Recommended:</strong> {entry.specialist}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: 0
  },
  refreshBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '8px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statIcon: {
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff'
  },
  statLabel: {
    fontSize: '12px',
    color: '#ccc',
    marginTop: '2px'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 12px 0'
  },
  symptomsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  symptomTag: {
    background: 'rgba(79, 70, 229, 0.2)',
    color: '#c7d2fe',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  symptomCount: {
    background: 'rgba(255,255,255,0.2)',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '12px'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    color: '#666'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    color: '#666',
    textAlign: 'center'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    color: '#666',
    textAlign: 'center'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historyItem: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  historyDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#ccc'
  },
  urgencyBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  historyContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  symptoms: {
    fontSize: '14px',
    color: '#ccc'
  },
  prediction: {
    fontSize: '14px',
    color: '#fff'
  },
  confidence: {
    color: '#4f46e5',
    marginLeft: '4px'
  },
  specialist: {
    fontSize: '14px',
    color: '#4caf50'
  },
  benefitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    margin: '20px 0',
    padding: '16px',
    background: 'rgba(79, 70, 229, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(79, 70, 229, 0.2)'
  },
  benefit: {
    fontSize: '14px',
    color: '#c7d2fe',
    textAlign: 'left'
  },
  primaryBtn: {
    padding: '12px 24px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '12px',
    transition: 'all 0.2s ease'
  },
  helpText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '12px'
  }
};

export default UserHistory;