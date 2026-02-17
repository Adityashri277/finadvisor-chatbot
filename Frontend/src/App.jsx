import React, { useState, useEffect } from "react";
import ChatWindow from "./ChatWindow";
import HistoryPage from "./HistoryPage";
import AuthPage from "./AuthPage";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi, I'm FinAdvisor How can I help you?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // --- NEW: RESPONSIVE MOBILE STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setActiveTab('chat');
    setMessages([{ sender: "bot", text: "Hi, I am FinAdvisor How can I assist you today?" }]);
    setInputText("");
  };

  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={(userData, authToken) => {
          setUser(userData);
          setToken(authToken);
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100%", overflow: "hidden" }}>
      
      {/* MOBILE OVERLAY BACKGROUND */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 998 }}
        />
      )}

      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: "260px",
          backgroundColor: "#171717",
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #333",
          position: isMobile ? "fixed" : "relative",
          left: isMobile ? (isSidebarOpen ? "0" : "-260px") : "0",
          top: 0,
          bottom: 0,
          zIndex: 999,
          transition: "left 0.3s ease-in-out",
        }}
      >
        <div>
          <div style={{ padding: '10px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #007bff, #00d2ff)', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0, 123, 255, 0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.09 9.91L22 12L14.09 14.09L12 22L9.91 14.09L2 12L9.91 9.91L12 2Z"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '1.1rem', margin: '0', color: '#ECECEC', fontWeight: '600' }}>FinAdvisor</h1>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <button
              onClick={() => { setActiveTab("chat"); if (isMobile) setIsSidebarOpen(false); }}
              style={{ textAlign: "left", padding: "12px 14px", cursor: "pointer", backgroundColor: activeTab === "chat" ? "#2F2F2F" : "transparent", color: activeTab === "chat" ? "#FFF" : "#A0A0A0", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: activeTab === "chat" ? "600" : "400", display: "flex", alignItems: "center", gap: "12px", transition: "0.2s" }}
            >
              <span style={{ fontSize: "16px" }}>💬</span> Home
            </button>
            <button
              onClick={() => { setActiveTab("history"); if (isMobile) setIsSidebarOpen(false); }}
              style={{ textAlign: "left", padding: "12px 14px", cursor: "pointer", backgroundColor: activeTab === "history" ? "#2F2F2F" : "transparent", color: activeTab === "history" ? "#FFF" : "#A0A0A0", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: activeTab === "history" ? "600" : "400", display: "flex", alignItems: "center", gap: "12px", transition: "0.2s" }}
            >
              <span style={{ fontSize: "16px" }}>🕰️</span> History
            </button>
          </div>
        </div>

        <div 
          onClick={() => { if (window.confirm("Are you sure you want to log out of FinAdvisor?")) handleLogout(); }} 
          title="Click to Logout"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2a2a2a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          style={{ padding: "12px", display: "flex", alignItems: "center", gap: "12px", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" }}
        >
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#007bff", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff", fontSize: "14px", fontWeight: "bold" }}>
            {getInitials(user.name)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={{ color: "#ECECEC", fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.name}</span>
            <span style={{ color: "#888", fontSize: "12px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.email}</span>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* MOBILE HAMBURGER HEADER */}
        {isMobile && (
          <div style={{ flexShrink: 0, height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', backgroundColor: '#171717', borderBottom: '1px solid #333', zIndex: 10 }}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: '#ECECEC', fontSize: '24px', cursor: 'pointer', marginRight: '15px', padding: 0, display: 'flex' }}
            >
              ☰
            </button>
            <h1 style={{ fontSize: '1.1rem', margin: '0', color: '#ECECEC', fontWeight: '600' }}>FinAdvisor</h1>
          </div>
        )}

        {/* Existing Content */}
        {activeTab === 'chat' ? (
          <ChatWindow user={user} token={token} messages={messages} setMessages={setMessages} inputText={inputText} setInputText={setInputText} isTyping={isTyping} setIsTyping={setIsTyping} />
        ) : (
          <HistoryPage token={token} />
        )}
      </main>
      
    </div>
  );
}

export default App;