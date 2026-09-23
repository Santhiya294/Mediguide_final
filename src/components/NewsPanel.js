import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiBook, FiRefreshCw, FiExternalLink, FiCalendar } from "react-icons/fi";
import strings from "../strings";

const API = process.env.REACT_APP_API_URL || "";

function NewsPanel() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const appLang = localStorage.getItem("app_lang") || "en";

  const categories = [
    { value: "all", label: "All News" },
    { value: "Cardiology", label: "Heart Health" },
    { value: "Oncology", label: "Cancer" },
    { value: "Neurology", label: "Brain Health" },
    { value: "Research", label: "Medical Research" },
    { value: "General Health", label: "General Health" }
  ];

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = category === "all"
        ? `${API}/api/news`
        : `${API}/api/news/${category}`;

      const response = await axios.get(endpoint, {
        params: { lang: appLang }
      });
      setNews(response.data.news);
    } catch (error) {
      console.error("Failed to load news:", error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [category, appLang]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const locale = appLang === "ta" ? "ta-IN" : (appLang === "hi" ? "hi-IN" : "en-US");
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <FiBook size={20} color="#4f46e5" />
          <h2 style={styles.title}>{strings.navNews || "Medical News"}</h2>
        </div>
        <button onClick={loadNews} style={styles.refreshBtn} disabled={loading}>
          <FiRefreshCw size={16} className={loading ? 'rotating' : ''} />
        </button>
      </div>

      <div style={styles.filters}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            style={{
              ...styles.filterBtn,
              backgroundColor: category === cat.value ? '#4f46e5' : 'transparent',
              color: category === cat.value ? '#fff' : '#666'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={styles.newsList}>
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>{strings.loadingMedicalNews || "Loading latest medical news..."}</p>
          </div>
        ) : news.length === 0 ? (
          <div style={styles.empty}>
            <FiBook size={48} color="#ccc" />
            <p>{strings.noNewsAvailable || "No news available at the moment."}</p>
            <button onClick={loadNews} style={styles.retryBtn}>
              {strings.tryAgain || "Try Again"}
            </button>
          </div>
        ) : (
          news.map((item, index) => (
            <div key={index} style={styles.newsItem}>
              <div style={styles.newsHeader}>
                <span style={styles.category}>{item.category}</span>
                <span style={styles.date}>
                  <FiCalendar size={12} />
                  {formatDate(item.publishedAt)}
                </span>
              </div>

              <h3 style={styles.newsTitle}>{item.title}</h3>

              <p style={styles.newsDescription}>
                {item.description}
              </p>

              <div style={styles.newsFooter}>
                <span style={styles.source}>Source: {item.source}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.readMore}
                >
                  {strings.readFullArticle || "Read Full Article"}
                  <FiExternalLink size={12} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .rotating {
          animation: rotate 1s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  newsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
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
    color: '#666'
  },
  retryBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  newsItem: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px'
  },
  newsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  category: {
    background: '#4f46e5',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  date: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#666'
  },
  newsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 12px 0',
    lineHeight: '1.4'
  },
  newsDescription: {
    fontSize: '14px',
    color: '#ccc',
    margin: '0 0 16px 0',
    lineHeight: '1.5'
  },
  newsFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  source: {
    fontSize: '12px',
    color: '#666'
  },
  readMore: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#4f46e5',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default NewsPanel;
