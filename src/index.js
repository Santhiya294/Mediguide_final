import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import reportWebVitals from './reportWebVitals';

const isDarkMode = localStorage.getItem("setting_dark") !== "false";
document.body.classList.toggle("dark-mode", isDarkMode);
document.body.classList.toggle("light-mode", !isDarkMode);

const savedAccent = localStorage.getItem("setting_accent");
if (savedAccent) {
  document.documentElement.style.setProperty("--primary", savedAccent);
  document.documentElement.style.setProperty("--accent", savedAccent);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
