import React, { useState } from "react";
import "./Login.css";
import { FiMail, FiLock, FiUser, FiGlobe, FiCheckCircle } from "react-icons/fi";
import { MdOutlineHealing } from "react-icons/md";
import strings from "../strings";

function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleRegister = () => {
    if (!name || !email || !password) { alert("Please fill all fields"); return; }
    localStorage.setItem("user", JSON.stringify({ name, email, password }));
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Registration Successful ✅");
      setIsRegister(false);
    }, 800);
  };

  const handleLogin = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) { alert("User not registered"); return; }
    if (email === storedUser.email && password === storedUser.password) {
      setLoading(true);
      setTimeout(() => { setLoading(false); setUser(storedUser); }, 600);
    } else {
      alert("Invalid email or password");
    }
  };

  return (
    <div className="login-page">
      {/* Language Switcher at Top */}
      <div className="login-lang-selector">
        <FiGlobe size={14} />
        {['en', 'ta', 'hi'].map(lang => (
          <button 
            key={lang} 
            className={`lang-btn ${localStorage.getItem('app_lang') === lang ? 'active' : ''}`}
            onClick={() => { localStorage.setItem('app_lang', lang); window.location.reload(); }}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Decorative rings */}
      <div className="login-shapes">
        <span /><span /><span />
      </div>

      <div className="login-wrapper">

        {/* ── Left brand panel ── */}
        <div className="login-brand">
          <div className="login-brand-logo">
            <div className="login-brand-logo-icon">
              <MdOutlineHealing size={22} color="#fff" />
            </div>
            <span className="login-brand-logo-text">{strings.appLogo}</span>
          </div>

          <div className="login-brand-center">
            <h2>{strings.brandTitle}</h2>
            <p>{strings.brandDesc}</p>
            <div className="login-features">
              {[
                strings.step2Desc,
                strings.featureMultilingualSupportDesc,
                strings.featureDoctorRecommendationDesc,
                strings.featureMedicalReportsDesc,
              ].map((f, i) => (
                <div className="login-feature-item" key={i}>
                  <div className="login-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="login-brand-footer">© 2026 MediGuide Healthcare System</p>
        </div>

        {/* ── Right form panel ── */}
        <div className="login-card">
          <div className="login-card-header">
            <h2>{isRegister ? strings.createAccount : strings.loginTitle}</h2>
            <p>{isRegister ? strings.joinToday : strings.loginSubtitle}</p>
          </div>

          <div className="input-group">
            {isRegister && (
              <>
                <label className="input-label">{strings.fullName}</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><FiUser size={15} /></span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="login-input"
                  />
                </div>
              </>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">{strings.emailAddr}</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon"><FiMail size={15} /></span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="login-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{strings.password}</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon"><FiLock size={15} /></span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="login-input"
                onKeyDown={e => { if (e.key === "Enter") isRegister ? handleRegister() : handleLogin(); }}
              />
            </div>
          </div>

          <button
            className="login-btn"
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading ? "..." : isRegister ? strings.createAccount : strings.signInBtn}
          </button>

          <div className="login-switch">
            <p>{isRegister ? strings.alreadyHaveAcc : strings.noAcc}</p>
            <button className="switch-btn" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? strings.signInInstead : strings.registerBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;