import React, { useState, useEffect } from "react";
import strings from "../strings";
import { 
  FiActivity, FiTarget, FiUsers, 
  FiCalendar, FiFileText, FiGlobe,
  FiTrendingUp, FiCheckCircle, FiShield,
  FiSearch, FiMessageSquare, FiTrendingDown,
  FiBriefcase, FiPocket, FiShieldOff
} from "react-icons/fi";
import { TbStethoscope, TbReportMedical } from "react-icons/tb";
import { MdMonitorHeart, MdOutlineHealing } from "react-icons/md";
import { HiOutlineSparkles, HiOutlineCubeTransparent } from "react-icons/hi2";
import { RiHealthBookLine, RiMentalHealthLine } from "react-icons/ri";

function Dashboard() {
  const [historyCount, setHistoryCount] = useState(0);
  
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("history") || "[]");
    setHistoryCount(history.length);
  }, []);

  const features = [
    {
      icon: <FiTarget size={26} />,
      title: strings.featureDiseasePredictionTitle,
      desc: strings.featureDiseasePredictionDesc,
      color: "var(--primary)"
    },
    {
      icon: <HiOutlineSparkles size={26} />,
      title: strings.featureAiChatAssistantTitle,
      desc: strings.featureAiChatAssistantDesc,
      color: "var(--sky)"
    },
    {
      icon: <TbStethoscope size={26} />,
      title: strings.featureDoctorRecommendationTitle,
      desc: strings.featureDoctorRecommendationDesc,
      color: "var(--amber)"
    },
    {
      icon: <FiCalendar size={26} />,
      title: strings.featureAppointmentBookingTitle,
      desc: strings.featureAppointmentBookingDesc,
      color: "var(--rose)"
    },
    {
      icon: <RiHealthBookLine size={26} />,
      title: strings.featureMedicalReportsTitle,
      desc: strings.featureMedicalReportsDesc,
      color: "var(--secondary)"
    },
    {
      icon: <FiGlobe size={26} />,
      title: strings.featureMultilingualSupportTitle,
      desc: strings.featureMultilingualSupportDesc,
      color: "var(--indigo)"
    }
  ];

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container {
          padding-bottom: 40px;
        }
        
        /* ── Welcome Section ── */
        .welcome-card {
          margin-bottom: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(0, 212, 255, 0.05));
          border-radius: 28px;
          padding: 48px;
          border: 1px solid var(--glass-border);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .welcome-card::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%);
          top: -150px;
          right: -100px;
        }

        .welcome-text h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 34px;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
          letter-spacing: -1px;
        }
        
        .welcome-text p {
          max-width: 500px;
          line-height: 1.7;
          color: var(--text-muted);
          font-size: 16px;
        }
        
        .welcome-image-container {
          position: relative;
        }
        
        .welcome-image {
          width: 380px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          transform: perspective(1000px) rotateY(-5deg);
          transition: transform 0.5s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .welcome-card:hover .welcome-image {
          transform: perspective(1000px) rotateY(0deg) scale(1.02);
        }

        /* ── Stats Bar ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        
        .stat-card {
          background: var(--bg-card);
          padding: 24px;
          border-radius: 20px;
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          background: var(--bg-card-hover);
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
        }
        
        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        
        .stat-info .stat-value {
          display: block;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }
        
        .stat-info .stat-label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* ── Features Header ── */
        .section-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        
        .section-heading h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        
        .section-heading-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, var(--glass-border), transparent);
        }

        /* ── Features Grid ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        
        .feature-card {
          background: var(--bg-card);
          padding: 30px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--feature-color);
          opacity: 0.6;
          transition: transform 0.4s ease;
          transform: scaleX(0);
          transform-origin: left;
        }
        
        .feature-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--feature-color);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .feature-card:hover::before {
          transform: scaleX(1);
        }
        
        .feature-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-size: 24px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        
        .feature-card h3 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: white;
          margin-top: 0;
          margin-bottom: 12px;
          letter-spacing: -0.3px;
        }
        
        .feature-card p {
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
          font-size: 14.5px;
        }

        @media (max-width: 1000px) {
          .welcome-card {
            flex-direction: column;
            text-align: center;
            gap: 32px;
            padding: 40px 24px;
          }
          .welcome-text p {
            margin: 0 auto;
          }
          .welcome-image {
            width: 100%;
            max-width: 400px;
            transform: none;
          }
        }
      `}</style>

      {/* Hero / Welcome Card */}
      <div className="welcome-card">
        <div className="welcome-text">
          <h1>{strings.dashboardTitle} 👋</h1>
          <p>
            {strings.heroSubtitle}
          </p>
        </div>

        <div className="welcome-image-container">
          <img
            src="https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg"
            alt="Healthcare Professional"
            className="welcome-image"
          />
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed' }}>
            <FiActivity />
          </div>
          <div className="stat-info">
            <span className="stat-value">{historyCount}</span>
            <span className="stat-label">{strings.navPredictions}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <FiShield />
          </div>
          <div className="stat-info">
            <span className="stat-value">100%</span>
            <span className="stat-label">Data Protected</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-value">v2.4</span>
            <span className="stat-label">{strings.featureMultilingualSupportTitle}</span>
          </div>
        </div>
      </div>

      {/* Features Heading */}
      <div className="section-heading">
        <h2>{strings.featuresTitle}</h2>
        <div className="section-heading-line"></div>
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index} style={{ '--feature-color': feature.color }}>
            <div className="feature-icon-wrapper" style={{ 
              backgroundColor: `rgba(255, 255, 255, 0.05)`, 
              color: feature.color,
              border: `1px solid rgba(255, 255, 255, 0.05)`
            }}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;