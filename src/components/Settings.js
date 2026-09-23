import React, { useState, useEffect } from "react";
import { 
  FiUser, FiBell, FiShield, FiGlobe, 
  FiMoon, FiSmartphone, FiDatabase, 
  FiHelpCircle, FiMail, FiPhone, 
  FiLock, FiCheckCircle, FiTrash2,
  FiChevronRight
} from "react-icons/fi";
import strings from "../strings";

function Settings() {
  const SETTINGS_KEYS = {
    notifications: {
      push: "setting_push",
      email: "setting_email",
      sms: "setting_sms"
    },
    appearance: {
      darkMode: "setting_dark",
      highContrast: "setting_contrast"
    },
    data: {
      saveHistory: "setting_history",
      cloudSync: "setting_sync"
    }
  };

  const hexToRgba = (hex, alpha = 1) => {
    const clean = (hex || "").replace("#", "");
    if (clean.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({
    name: localStorage.getItem("user_name") || "John Doe",
    email: localStorage.getItem("user_email") || "john@example.com",
    phone: localStorage.getItem("user_phone") || "+1 234 567 890"
  });

  const [notifications, setNotifications] = useState({
    push: localStorage.getItem("setting_push") !== "false",
    email: localStorage.getItem("setting_email") === "true",
    sms: localStorage.getItem("setting_sms") !== "false"
  });

  const [appearance, setAppearance] = useState({
    darkMode: localStorage.getItem("setting_dark") !== "false",
    highContrast: localStorage.getItem("setting_contrast") === "true",
    accent: localStorage.getItem("setting_accent") || "#6366f1"
  });

  const [dataPrivacy, setDataPrivacy] = useState({
    saveHistory: localStorage.getItem("setting_history") !== "false",
    cloudSync: localStorage.getItem("setting_sync") !== "false"
  });

  const [savingStatus, setSavingStatus] = useState(null);

  // Apply saved theme on mount
  useEffect(() => {
    const savedAccent = localStorage.getItem("setting_accent") || "#6366f1";
    document.documentElement.style.setProperty('--primary', savedAccent);
    document.documentElement.style.setProperty('--accent', savedAccent);
    document.documentElement.style.setProperty('--primary-glow', hexToRgba(savedAccent, 0.4));
    
    const darkMode = localStorage.getItem("setting_dark") !== "false";
    const highContrast = localStorage.getItem("setting_contrast") === "true";
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
    document.body.classList.toggle("high-contrast", highContrast);
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const saveProfile = () => {
    setSavingStatus("profile");
    localStorage.setItem("user_name", profile.name);
    localStorage.setItem("user_email", profile.email);
    localStorage.setItem("user_phone", profile.phone);
    setTimeout(() => {
      setSavingStatus(null);
      alert("Profile updated successfully!");
    }, 800);
  };

  const handleToggle = (category, setting) => {
    const key = SETTINGS_KEYS[category]?.[setting];
    if (!key) return;

    if (category === "notifications") {
      const newVal = !notifications[setting];
      setNotifications({ ...notifications, [setting]: newVal });
      localStorage.setItem(key, newVal);
    } else if (category === "appearance") {
      const newVal = !appearance[setting];
      setAppearance({ ...appearance, [setting]: newVal });
      localStorage.setItem(key, newVal);
      if (setting === "darkMode") {
        document.body.classList.toggle("dark-mode", newVal);
        document.body.classList.toggle("light-mode", !newVal);
      } else if (setting === "highContrast") {
        document.body.classList.toggle("high-contrast", newVal);
      }
    } else if (category === "data") {
      const newVal = !dataPrivacy[setting];
      setDataPrivacy({ ...dataPrivacy, [setting]: newVal });
      localStorage.setItem(key, newVal);
    }
  };

  const handleAccentChange = (color) => {
    setAppearance({ ...appearance, accent: color });
    localStorage.setItem("setting_accent", color);
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--primary-glow', hexToRgba(color, 0.4));
  };

  const tabs = [
    { id: "profile", icon: <FiUser />, label: "Profile" },
    { id: "notifications", icon: <FiBell />, label: "Notifications" },
    { id: "security", icon: <FiShield />, label: "Security" },
    { id: "appearance", icon: <FiMoon />, label: "Appearance" },
    { id: "language", icon: <FiGlobe />, label: "Language" },
    { id: "data", icon: <FiDatabase />, label: "Data & Privacy" },
    { id: "help", icon: <FiHelpCircle />, label: "Help & Support" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="settings-content-card animate-fade-in">
            <div className="settings-header">
              <h3>Account Profile</h3>
              <p>Manage your personal information and contact details.</p>
            </div>
            
            <div className="settings-form">
              <div className="settings-item">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <FiUser size={16} />
                  <input 
                    type="text" 
                    name="name" 
                    value={profile.name} 
                    onChange={handleProfileChange} 
                    placeholder="Enter full name" 
                  />
                </div>
              </div>
              <div className="settings-item">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <FiMail size={16} />
                  <input 
                    type="email" 
                    name="email" 
                    value={profile.email} 
                    onChange={handleProfileChange} 
                    placeholder="Enter email" 
                  />
                </div>
              </div>
              <div className="settings-item">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <FiPhone size={16} />
                  <input 
                    type="text" 
                    name="phone" 
                    value={profile.phone} 
                    onChange={handleProfileChange} 
                    placeholder="Enter phone number" 
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="save-btn" onClick={saveProfile}>
                  {savingStatus === "profile" ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-content-card animate-fade-in">
            <div className="settings-header">
              <h3>Notification Settings</h3>
              <p>Configure how you want to receive alerts and updates.</p>
            </div>
            
            <div className="toggle-list">
              <div className="settings-toggle">
                <div className="toggle-info">
                  <span>Push Notifications</span>
                  <p>Receive alerts on your device for critical health updates.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.push} 
                    onChange={() => handleToggle("notifications", "push")} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-toggle">
                <div className="toggle-info">
                  <span>Email Notifications</span>
                  <p>Receive weekly health summaries and tips via email.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.email} 
                    onChange={() => handleToggle("notifications", "email")} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-toggle">
                <div className="toggle-info">
                  <span>SMS Alerts</span>
                  <p>Get instant appointment reminders on your phone.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.sms} 
                    onChange={() => handleToggle("notifications", "sms")} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="settings-content-card animate-fade-in">
            <div className="settings-header">
              <h3>Security & Privacy</h3>
              <p>Strengthen your account security with password updates and 2FA.</p>
            </div>
            
            <div className="settings-form">
              <div className="settings-item">
                <label>Current Password</label>
                <div className="input-with-icon">
                  <FiLock size={16} />
                  <input type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="settings-item">
                <label>New Password</label>
                <div className="input-with-icon">
                  <FiLock size={16} />
                  <input type="password" placeholder="••••••••" />
                </div>
              </div>
              
              <div className="settings-toggle" style={{ marginTop: '20px', borderBottom: 'none' }}>
                <div className="toggle-info">
                  <span>Two-Factor Authentication</span>
                  <p>Secure your account with a secondary verification method.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="form-actions">
                <button className="save-btn" onClick={() => alert("Security settings updated!")}>Update Password</button>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="settings-content-card animate-fade-in">
            <div className="settings-header">
              <h3>Appearance Settings</h3>
              <p>Customize the look and feel of your dashboard.</p>
            </div>
            
            <div className="toggle-list">
              <div className="settings-toggle">
                <div className="toggle-info">
                  <span>Dark Mode</span>
                  <p>Toggle between light and dark visual themes.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={appearance.darkMode} 
                    onChange={() => handleToggle("appearance", "darkMode")} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-toggle">
                <div className="toggle-info">
                  <span>High Contrast</span>
                  <p>Increase visibility for better accessibility.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={appearance.highContrast} 
                    onChange={() => handleToggle("appearance", "highContrast")} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-item" style={{ marginTop: '20px' }}>
              <label>Theme Accent Color</label>
              <div className="theme-grid">
                {['#6366f1', '#10b981', '#3b82f6', '#ef4444'].map(color => (
                  <div 
                    key={color}
                    className="theme-color" 
                    style={{ 
                      backgroundColor: color,
                      borderColor: appearance.accent === color ? 'white' : 'transparent',
                      boxShadow: appearance.accent === color ? `0 0 0 2px ${color}` : 'none'
                    }}
                    onClick={() => handleAccentChange(color)}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );

      case "language": {
        const currentLang = localStorage.getItem("app_lang") || "en";
        const updateLang = (lang) => {
          localStorage.setItem("app_lang", lang);
          window.location.reload();
        };

        return (
          <div className="settings-content-card animate-fade-in">
            <div className="settings-header">
              <h3>{strings.settingsTitle || "Language Settings"}</h3>
              <p>Choose your preferred language for the interface and AI assistant.</p>
            </div>
            
            <div className="language-grid">
               <div className={`lang-card ${currentLang === 'en' ? 'active' : ''}`} onClick={() => updateLang('en')}>
                  {currentLang === 'en' && <div className="lang-checked"><FiCheckCircle /></div>}
                  <div className="lang-flag">🇺🇸</div>
                  <h4>English</h4>
                  <span>United States</span>
               </div>
               <div className={`lang-card ${currentLang === 'ta' ? 'active' : ''}`} onClick={() => updateLang('ta')}>
                  {currentLang === 'ta' && <div className="lang-checked"><FiCheckCircle /></div>}
                  <div className="lang-flag">🇮🇳</div>
                  <h4>தமிழ்</h4>
                  <span>Tamil (India)</span>
               </div>
               <div className={`lang-card ${currentLang === 'hi' ? 'active' : ''}`} onClick={() => updateLang('hi')}>
                  {currentLang === 'hi' && <div className="lang-checked"><FiCheckCircle /></div>}
                  <div className="lang-flag">🇮🇳</div>
                  <h4>हिन्दी</h4>
                  <span>Hindi (India)</span>
               </div>
            </div>
          </div>
        );
      }

      case "data":
        return (
          <div className="settings-content-card animate-fade-in">
            <div className="settings-header">
              <h3>Data & Privacy</h3>
              <p>Control how your data is handled and stored.</p>
            </div>
            
            <div className="toggle-list">
              <div className="settings-toggle">
                <div className="toggle-info">
                  <span>Save Chat History</span>
                  <p>Keep a detailed record of your AI health interactions.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={dataPrivacy.saveHistory} 
                    onChange={() => handleToggle("data", "saveHistory")} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-toggle">
                <div className="toggle-info">
                  <span>Cloud Sync</span>
                  <p>Sync your medical reports across all your devices.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={dataPrivacy.cloudSync} 
                    onChange={() => handleToggle("data", "cloudSync")} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            
            <div className="danger-zone">
              <h4>Danger Zone</h4>
              <p>Irreversible actions related to your account and data.</p>
              <button className="danger-btn" onClick={() => {
                if (window.confirm("Are you sure you want to delete all data? This cannot be undone.")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}>
                <FiTrash2 size={16} style={{ marginRight: '8px' }} />
                Delete All Account Data
              </button>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="settings-content-card animate-fade-in">
            <div className="settings-header">
              <h3>Help & Support</h3>
              <p>Need assistance? We're here to help you 24/7.</p>
            </div>
            
            <div className="help-grid">
               <div className="help-card">
                  <div className="help-icon"><FiMail /></div>
                  <h4>Email Support</h4>
                  <p>support@mediguide.ai</p>
                  <FiChevronRight className="help-arrow" />
               </div>
               <div className="help-card">
                  <div className="help-icon"><FiHelpCircle /></div>
                  <h4>Knowledge Base</h4>
                  <p>Read documentation</p>
                  <FiChevronRight className="help-arrow" />
               </div>
               <div className="help-card">
                  <div className="help-icon"><FiSmartphone /></div>
                  <h4>App version</h4>
                  <p>v2.4.0 Stable Build</p>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-wrapper">
      <style>{`
        .settings-container {
          padding-bottom: 40px;
        }
        .page-title-group {
          margin-bottom: 30px;
        }
        .page-title-group h2 {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }
        .page-title-group p {
          color: var(--text-muted);
          font-size: 14px;
        }
        .settings-layout {
          display: flex;
          gap: 32px;
        }
        .settings-sidebar {
          width: 260px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .settings-tab {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          font-weight: 500;
        }
        .settings-tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          transform: translateX(4px);
        }
        .settings-tab.active {
          background: rgba(124, 58, 237, 0.12);
          color: var(--primary);
          border-color: rgba(124, 58, 237, 0.2);
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .settings-tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }
        .settings-main {
          flex: 1;
          max-width: 800px;
        }
        .settings-content-card {
          background: var(--bg-card);
          padding: 36px;
          border-radius: 24px;
          border: 1px solid var(--glass-border);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .settings-header {
          margin-bottom: 30px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 20px;
        }
        .settings-header h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 22px;
          font-weight: 700;
          color: white;
          font-family: 'Space Grotesk', sans-serif;
        }
        .settings-header p {
          color: var(--text-muted);
          font-size: 14px;
          margin: 0;
        }
        .settings-item {
          margin-bottom: 24px;
        }
        .settings-item label {
          display: block;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-with-icon {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 18px;
          border-radius: 14px;
          color: var(--text-dim);
          transition: all 0.3s ease;
        }
        .input-with-icon:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
          color: var(--primary);
        }
        .input-with-icon input {
          background: transparent;
          border: none;
          padding: 15px 0;
          width: 100%;
          color: white;
          outline: none;
          font-size: 14px;
        }
        .input-with-icon input::placeholder {
          color: var(--text-dim);
        }
        .settings-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .settings-toggle:last-child {
          border-bottom: none;
        }
        .toggle-info span {
          display: block;
          font-weight: 600;
          color: white;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .toggle-info p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: var(--primary);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        .language-grid {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
           gap: 20px;
        }
        .lang-card {
           background: rgba(255, 255, 255, 0.03);
           padding: 24px;
           border-radius: 20px;
           border: 1px solid var(--glass-border);
           cursor: pointer;
           position: relative;
           transition: all 0.3s ease;
           text-align: center;
        }
        .lang-card:hover {
           background: rgba(255, 255, 255, 0.06);
           border-color: var(--primary);
           transform: translateY(-5px);
        }
        .lang-card.active {
           background: rgba(124, 58, 237, 0.1);
           border-color: var(--primary);
           box-shadow: 0 8px 25px rgba(124, 58, 237, 0.1);
        }
        .lang-flag {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .lang-card h4 {
          margin: 0;
          color: white;
          font-size: 16px;
        }
        .lang-card span {
          font-size: 12px;
          color: var(--text-muted);
        }
        .lang-checked {
           position: absolute;
           top: 15px;
           right: 15px;
           color: var(--primary);
           font-size: 18px;
        }
        .help-grid {
           display: flex;
           flex-direction: column;
           gap: 16px;
        }
        .help-card {
           display: flex;
           align-items: center;
           gap: 18px;
           padding: 24px;
           background: rgba(255, 255, 255, 0.03);
           border-radius: 18px;
           cursor: pointer;
           transition: all 0.3s ease;
           border: 1px solid var(--glass-border);
           position: relative;
        }
        .help-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--primary);
        }
        .help-icon {
          width: 48px;
          height: 48px;
          background: rgba(124, 58, 237, 0.1);
          color: var(--primary);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .help-card h4 {
          margin: 0;
          font-size: 16px;
          color: white;
          margin-bottom: 4px;
        }
        .help-card p {
          margin: 0;
          font-size: 13px;
          color: var(--text-muted);
        }
        .help-arrow {
          margin-left: auto;
          color: var(--text-dim);
          transition: all 0.3s;
        }
        .help-card:hover .help-arrow {
          color: var(--primary);
          transform: translateX(5px);
        }
        .save-btn {
          margin-top: 10px;
          padding: 14px 28px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
        }
        .save-btn:hover {
          background: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
        }
        .danger-zone {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px dashed rgba(239, 68, 68, 0.2);
        }
        .danger-zone h4 {
          color: #ef4444;
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 18px;
        }
        .danger-zone p {
          color: var(--text-muted);
          font-size: 13px;
          margin-bottom: 20px;
        }
        .danger-btn {
           background: rgba(239, 68, 68, 0.1);
           color: #ef4444;
           border: 1px solid rgba(239, 68, 68, 0.3);
           padding: 14px 24px;
           border-radius: 14px;
           cursor: pointer;
           font-weight: 700;
           display: flex;
           align-items: center;
           transition: all 0.3s ease;
        }
        .danger-btn:hover {
          background: #ef4444;
          color: white;
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }
        .theme-grid {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }
        .theme-color {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.2s;
        }
        .theme-color:first-child {
          border-color: white;
          box-shadow: 0 0 0 2px var(--primary);
        }
        .animate-fade-in {
          animation: settingsFadeIn 0.4s ease-out forwards;
        }
        @keyframes settingsFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .settings-layout {
            flex-direction: column;
          }
          .settings-sidebar {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 10px;
          }
          .settings-tab {
            white-space: nowrap;
          }
        }
      `}</style>

      <div className="page-title-group">
        <h2>{strings.settingsTitle}</h2>
        <p>Personalize your experience and manage your data.</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="settings-tab-icon">{tab.icon}</div>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>

        <div className="settings-main">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default Settings;
