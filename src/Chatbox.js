import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import strings from "./strings";
import { FiSend, FiMic, FiStopCircle } from "react-icons/fi";
import { MdOutlineSmartToy } from "react-icons/md";

const API = process.env.REACT_APP_API_URL || "";

function Chatbox() {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [typing, setTyping]             = useState(false);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [sessionId]                     = useState("session_" + Date.now());
  const [listening, setListening]       = useState(false);

  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const recognitionRef  = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    setMessages([{ sender: "bot", text: strings.botInitialGreeting, time: getTime() }]);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous     = false;
      const appLang = localStorage.getItem("app_lang") || "en";
      recognitionRef.current.lang           = appLang === 'ta' ? 'ta-IN' : (appLang === 'hi' ? 'hi-IN' : 'en-IN');
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => setListening(true);
      recognitionRef.current.onend   = () => setListening(false);
      recognitionRef.current.onresult = e => setInput(e.results[0][0].transcript);
    }
  }, []);

  useEffect(() => { scrollToBottom(); inputRef.current?.focus(); }, [messages]);

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const startListening = () => {
    if (recognitionRef.current) recognitionRef.current.start();
    else alert(strings.speechNotSupported);
  };

  const formatBotResponse = data => {
    const isEmergency = data.emergency || data.confidence >= 90;

    if (data.step === "question") {
      setShowQuickReply(true);
      return `${strings.analyzingSymptoms}\n\n${strings.possibleDisease}${data.disease}\n${strings.confidenceLabel}${data.confidence}%\n\n❓ ${data.next_question}`;
    }

    if (data.step === "final") {
      setShowQuickReply(false);
      if (isEmergency) {
        return `${strings.medicalAlert}\n\n${strings.possibleCondition}${data.disease}\n${strings.confidenceLabel}${data.confidence}%\n\n${strings.emergencyAttention}\n\n${strings.descriptionLabel}\n${data.description}\n\n${strings.precautionsLabel}\n${data.precautions?.join(", ")}\n\n${strings.healthTipLabel}\n${data.health_tip}\n\n"${data.quote}"\n\n${strings.consultDoctor}`;
      }
      return `${strings.finalPrediction}\n\n${strings.possibleCondition}${data.disease}\n${strings.confidenceLabel}${data.confidence}%\n\n${strings.patientSummary}\n${strings.patientName}${data.patient?.name}\n${strings.patientAge}${data.patient?.age}\n${strings.patientGender}${data.patient?.gender}\n${strings.patientDuration}${data.patient?.days}${strings.patientDays}\n\n${strings.descriptionLabel}\n${data.description}\n\n${strings.precautionsLabel}\n${data.precautions?.join(", ")}\n\n${strings.healthTipLabel}\n${data.health_tip}\n\n"${data.quote}"\n\n${strings.followUp}\n${data.extra_question}\n\n${strings.preliminaryPrediction}`;
    }

    return data.reply || strings.defaultReply;
  };

  const sendMessage = async (customInput = null) => {
    const messageText = customInput || input;
    if (!messageText.trim()) return;

    setMessages(prev => [...prev, { sender: "user", text: messageText, time: getTime() }]);
    setInput("");
    setTyping(true);

    try {
      const appLang = localStorage.getItem("app_lang") || "en";
      const res  = await axios.post(`${API}/chat`, { 
        message: messageText, 
        session_id: sessionId,
        language: appLang // Pass language to backend if needed
      });
      const data = res.data;
      setMessages(prev => [...prev, {
        sender: "bot", text: formatBotResponse(data),
        time: getTime(), emergency: data.emergency
      }]);
    } catch {
      setMessages(prev => [...prev, { sender: "bot", text: strings.serverError, time: getTime() }]);
    }

    setTyping(false);
  };

  return (
    <div style={sx.container}>
      <style>{css}</style>

      {/* Header */}
      <div style={sx.header}>
        <div style={sx.headerLeft}>
          <div style={sx.botAvatar}><MdOutlineSmartToy size={20} color="#fff" /></div>
          <div>
            <div style={sx.headerTitle}>{strings.assistantHeader}</div>
            <div style={sx.headerSub}>{strings.assistantSubHeader}</div>
          </div>
        </div>
        <div style={sx.statusDot} title="Online" />
      </div>

      {/* Messages */}
      <div style={sx.chatArea} className="cb-chat-area">
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{ ...sx.msgRow, justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}
          >
            {msg.sender === "bot" && (
              <div style={sx.avatar}><MdOutlineSmartToy size={15} color="var(--primary-light)" /></div>
            )}
            <div
              className={`cb-bubble ${msg.sender === "user" ? "cb-user" : "cb-bot"}${msg.emergency ? " cb-emergency" : ""}`}
            >
              <pre style={sx.preText}>{msg.text}</pre>
              <div style={sx.msgTime}>{msg.time}</div>
            </div>
          </div>
        ))}

        {typing && (
          <div style={sx.typingRow}>
            <div style={sx.avatar}><MdOutlineSmartToy size={15} color="var(--primary-light)" /></div>
            <div style={sx.typingBubble}>
              <div className="cb-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick reply buttons */}
      {showQuickReply && (
        <div style={sx.quickReply}>
          <span style={sx.quickLabel}>{strings.quickReplyLabel}</span>
          {["yes", "no"].map(v => (
            <button key={v} className="cb-quick-btn" onClick={() => sendMessage(v)}>
              {v === "yes" ? `✅ ${strings.yes}` : `❌ ${strings.no}`}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={sx.inputArea}>
        <input
          ref={inputRef}
          style={sx.input}
          className="cb-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={listening ? strings.listening : strings.inputPlaceholder}
          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
        />
        <button
          className={`cb-mic-btn${listening ? " cb-mic-active" : ""}`}
          onClick={listening ? () => recognitionRef.current?.stop() : startListening}
          title={listening ? strings.listening : strings.speak}
        >
          {listening ? <FiStopCircle size={17} /> : <FiMic size={17} />}
        </button>
        <button className="cb-send-btn" onClick={() => sendMessage()} title={strings.send}>
          <FiSend size={16} />
        </button>
      </div>
    </div>
  );
}

const sx = {
  container: {
    width: "100%", height: "100%", display: "flex",
    flexDirection: "column", borderRadius: 22,
    overflow: "hidden", background: "var(--bg-card)",
    border: "1px solid var(--glass-border)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: 560,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 22px",
    background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(13,22,45,0.6) 100%)",
    borderBottom: "1px solid var(--glass-border)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  botAvatar: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: "linear-gradient(135deg, var(--primary), #4f46e5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 14px var(--primary-glow)",
  },
  headerTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: 16,
    fontWeight: 700, color: "#fff",
  },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  statusDot: {
    width: 9, height: 9, borderRadius: "50%",
    background: "var(--secondary)",
    boxShadow: "0 0 8px var(--secondary-glow)",
  },
  chatArea: {
    flex: 1, overflowY: "auto",
    padding: "20px 18px", display: "flex",
    flexDirection: "column", gap: 10,
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
    background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  preText: { margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 },
  msgTime: { fontSize: 11, opacity: 0.45, textAlign: "right", marginTop: 6 },
  typingRow: { display: "flex", alignItems: "center", gap: 10 },
  typingBubble: {
    padding: "12px 18px", borderRadius: "18px 18px 18px 4px",
    background: "rgba(13,22,45,0.8)", border: "1px solid var(--glass-border)",
  },
  quickReply: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 18px",
    borderTop: "1px solid var(--glass-border)",
    background: "rgba(6,10,22,0.5)",
  },
  quickLabel: { fontSize: 12, color: "var(--text-muted)", flexShrink: 0 },
  inputArea: {
    display: "flex", gap: 10, padding: "14px 16px",
    borderTop: "1px solid var(--glass-border)",
    background: "rgba(6,10,22,0.6)", backdropFilter: "blur(10px)",
  },
  input: {
    flex: 1, padding: "12px 16px", borderRadius: 14,
    border: "1px solid var(--glass-border)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff", outline: "none", fontSize: 14.5,
    fontFamily: "inherit", transition: "border-color 0.25s, box-shadow 0.25s",
  },
};

const css = `
.cb-bubble {
  max-width: 82%;
  padding: 13px 17px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.65;
  animation: fadeUp 0.28s ease-out;
}
.cb-user {
  background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 16px var(--primary-glow);
}
.cb-bot {
  background: rgba(13,22,45,0.85);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  border-bottom-left-radius: 4px;
}
.cb-emergency {
  border: 1px solid rgba(239,68,68,0.5) !important;
  background: rgba(239,68,68,0.12) !important;
  color: #fff !important;
}

/* Typing dots */
.cb-dots { display: flex; gap: 5px; align-items: center; height: 18px; }
.cb-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--primary-light); opacity: 0.6;
  animation: cbDot 1.2s ease-in-out infinite;
}
.cb-dots span:nth-child(2) { animation-delay: 0.2s; }
.cb-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes cbDot {
  0%,80%,100% { transform: scale(0.6); opacity: 0.3; }
  40%         { transform: scale(1);   opacity: 1;   }
}

/* Quick reply */
.cb-quick-btn {
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid rgba(6,214,160,0.3);
  background: rgba(6,214,160,0.1);
  color: var(--secondary);
  font-weight: 600; font-size: 13px;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s;
}
.cb-quick-btn:hover {
  background: rgba(6,214,160,0.2);
  box-shadow: 0 0 12px var(--secondary-glow);
}

/* Input focus */
.cb-input:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important;
  background: rgba(124,58,237,0.05) !important;
}
.cb-input::placeholder { color: var(--text-dim); }

/* Mic button */
.cb-mic-btn {
  width: 44px; height: 44px;
  border-radius: 14px; border: 1px solid var(--glass-border);
  background: rgba(255,255,255,0.05); color: var(--text-soft);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: all 0.2s;
}
.cb-mic-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.cb-mic-active {
  border-color: var(--accent) !important;
  color: var(--accent) !important;
  background: rgba(247,37,133,0.12) !important;
  animation: pulseGlow 1s ease-in-out infinite;
}

/* Send button */
.cb-send-btn {
  width: 44px; height: 44px;
  border-radius: 14px; border: none;
  background: linear-gradient(135deg, var(--secondary), #059669);
  color: #fff; display: flex; align-items: center;
  justify-content: center; cursor: pointer; flex-shrink: 0;
  box-shadow: 0 4px 14px var(--secondary-glow);
  transition: all 0.22s;
}
.cb-send-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px var(--secondary-glow); }

@keyframes pulseGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(247,37,133,0.3); }
  50%      { box-shadow: 0 0 0 8px rgba(247,37,133,0); }
}
`;

export default Chatbox;