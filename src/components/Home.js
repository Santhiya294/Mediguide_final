import React from "react";
import "./Home.css";
import heroImg from "../assets/health-ai.jpg";
import strings from "../strings";
import { useNavigate } from "react-router-dom";
import {
  FiActivity, FiMic, FiFileText, FiArrowRight,
  FiCheckCircle, FiZap, FiUsers, FiTrendingUp
} from "react-icons/fi";
import { MdOutlineMedicalServices } from "react-icons/md";

function Home() {
  const navigate = useNavigate();

  const steps = [
    { n: "01", title: strings.step1Title, desc: strings.step1Desc },
    { n: "02", title: strings.step2Title, desc: strings.step2Desc },
    { n: "03", title: strings.step3Title, desc: strings.step3Desc },
    { n: "04", title: strings.step4Title, desc: strings.step4Desc },
  ];

  const features = [
    {
      icon: <FiActivity size={22} color="var(--secondary)" />,
      title: strings.featureDiseasePredictionTitle,
      desc: strings.featureDiseasePredictionDesc
    },
    {
      icon: <FiMic size={22} color="var(--secondary)" />,
      title: strings.botInitialGreeting.split('.')[0], // Use part of bot greeting
      desc: strings.step1Desc
    },
    {
      icon: <MdOutlineMedicalServices size={22} color="var(--secondary)" />,
      title: strings.featureDoctorRecommendationTitle,
      desc: strings.featureDoctorRecommendationDesc
    },
    {
      icon: <FiFileText size={22} color="var(--secondary)" />,
      title: strings.featureMedicalReportsTitle,
      desc: strings.featureMedicalReportsDesc
    },
  ];

  return (
    <div className="home-container">

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-text">
          <div className="hero-pill">
            <div className="hero-pill-dot" />
            {strings.appHeader}
          </div>

          <h1>{strings.heroTitle}</h1>

          <p>{strings.heroSubtitle}</p>

          <div className="hero-cta-group">
            <button className="btn-primary" onClick={() => navigate("/assistant")}>
              {strings.startDiagnosis} <FiArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => navigate("/predictions")}>
              {strings.viewHistory}
            </button>
          </div>

          <div className="hero-stats">
            {[
              { value: "42+", label: strings.diseasesDetected },
              { value: "3",   label: strings.languages },
              { value: "98%", label: strings.uptime },
            ].map((s, i) => (
              <div className="hero-stat" key={i}>
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-image">
          <div className="hero-image-wrapper">
            <img src={heroImg} alt="Healthcare AI" />
            <div className="hero-image-badge">
              <div className="hero-image-badge-icon">
                <FiCheckCircle size={16} color="#fff" />
              </div>
              <div className="hero-image-badge-text">
                <strong>AI Verified</strong>
                <span>Clinically informed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── About ── */}
      <div className="about-section">
        <div className="section-header" style={{ margin: 0 }}>
          <div className="section-tag">
            <div className="section-tag-line" />
            {strings.aboutTitle}
          </div>
          <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>{strings.aboutTitle}</h2>
        </div>
        <p style={{ marginTop: "12px" }}>
          {strings.aboutDesc}
        </p>
      </div>

      {/* ── How It Works ── */}
      <div className="steps-section">
        <div className="section-header">
          <div className="section-tag">
            <div className="section-tag-line" />
            {strings.navAssistant}
          </div>
          <h2>{strings.howItWorks}</h2>
          <p>{strings.findSpecialistDesc}</p>
        </div>

        <div className="steps">
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-number">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key Features ── */}
      <div className="features-section">
        <div className="section-header">
          <div className="section-tag">
            <div className="section-tag-line" />
            {strings.keyFeatures}
          </div>
          <h2>{strings.keyFeatures}</h2>
          <p>{strings.dashboardDescription}</p>
        </div>

        <div className="features">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="home-footer">
        <span>© 2026 MediGuide Healthcare System</span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--secondary)" }}>
          <FiCheckCircle size={13} /> Developed for Smart Healthcare Innovation
        </span>
      </div>

    </div>
  );
}

export default Home;
