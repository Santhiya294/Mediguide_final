import React, { useEffect, useState } from "react";
import "./App.css";
import Login from "./components/Login";
import strings from "./strings";

import Chatbox from "./Chatbox";
import SymptomForm from "./SymptomForm";
import Reports from "./components/Reports";
import Home from "./components/Home";
import Settings from "./components/Settings";
import NewsPanel from "./components/NewsPanel";
import Doctors from "./components/Doctors";
import PredictionHistory from "./components/PredictionHistory";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

// Icons
import {
  FiActivity, FiBriefcase,
  FiSettings, FiLogOut,
  FiLayers
} from "react-icons/fi";
import { MdOutlineHealing, MdMonitorHeart } from "react-icons/md";
import { RiHealthBookLine } from "react-icons/ri";
import { TbStethoscope } from "react-icons/tb";

const hexToRgba = (hex, alpha = 1) => {
  const clean = (hex || "").replace("#", "");
  if (clean.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function AppContent({ user, setUser }) {
  const location = useLocation();

  const navItems = [
    { path: "/",           icon: <FiLayers size={19} />,     label: strings.navHome, color: "var(--primary)" },
    { path: "/assistant",  icon: <TbStethoscope size={19} />, label: strings.navAssistant, color: "var(--sky)" },
    { path: "/predictions",icon: <FiBriefcase size={19} />,  label: strings.navPredictions, color: "var(--amber)" },
    { path: "/news",       icon: <FiActivity size={19} />,   label: strings.navNews || "Medical News", color: "var(--emerald)" },
    { path: "/doctors",    icon: <MdMonitorHeart size={19} />,    label: strings.navDoctors, color: "var(--rose)" },
    { path: "/reports",    icon: <RiHealthBookLine size={19} />, label: strings.navReports, color: "var(--secondary)" },
    { path: "/settings",   icon: <FiSettings size={19} />, label: strings.navSettings, color: "var(--indigo)" },
  ];

  const currentItem = navItems.find(n => n.path === location.pathname) || navItems[0];

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="app-container">

      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <MdOutlineHealing size={20} color="#fff" />
          </div>
          <span className="logo-text">{strings.appLogo}</span>
        </div>

        <p className="nav-section-label">{strings.navSectionNavigation || "Navigation"}</p>
        <ul>
          {navItems.map(item => (
            <li key={item.path} className={location.pathname === item.path ? "active-link" : ""}>
              <Link to={item.path}>
                <span className="nav-icon" style={{ color: item.color }}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
            <span className="sidebar-user-name">{user?.name || "User"}</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="main-content">

        {/* Topbar */}
        <div className="navbar">
          <div className="navbar-left">
            <h1>{currentItem.label}</h1>
            <span className="navbar-breadcrumb">MediGuide / {currentItem.label}</span>
          </div>

          <div className="user-profile">
            <div className="user-info-pill">
              <div className="user-avatar-sm">{getInitials(user?.name)}</div>
              <span>{user?.name || "User"}</span>
            </div>
            <button onClick={() => setUser(null)} className="logout-btn">
              <FiLogOut size={14} /> {strings.logout}
            </button>
          </div>
        </div>

        {/* Pages */}
        <div className="page-wrapper">
          <Routes>

            {/* Dashboard / Home */}
            <Route path="/" element={<Home />} />

            {/* AI Assistant */}
            <Route
              path="/assistant"
              element={
                <div className="assistant-layout">
                  <div className="left-panel">
                    <SymptomForm />
                  </div>
                  <div className="right-panel">
                    <Chatbox />
                  </div>
                </div>
              }
            />

            {/* Doctors */}
            <Route
              path="/doctors"
              element={<Doctors />}
            />

            <Route path="/predictions" element={<PredictionHistory />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Medical News */}
            <Route path="/news" element={<NewsPanel />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />} />

          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    const savedAccent = localStorage.getItem("setting_accent") || "#6366f1";
    const darkMode = localStorage.getItem("setting_dark") !== "false";
    const highContrast = localStorage.getItem("setting_contrast") === "true";

    document.documentElement.style.setProperty("--primary", savedAccent);
    document.documentElement.style.setProperty("--accent", savedAccent);
    document.documentElement.style.setProperty("--primary-glow", hexToRgba(savedAccent, 0.4));

    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
    document.body.classList.toggle("high-contrast", highContrast);
  }, []);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user_session");
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetUser = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem("user_session", JSON.stringify(u));
    } else {
      localStorage.removeItem("user_session");
    }
  };

  if (!user) {
    return <Login setUser={handleSetUser} />;
  }

  return (
    <Router>
      <AppContent user={user} setUser={handleSetUser} />
    </Router>
  );
}

export default App;
