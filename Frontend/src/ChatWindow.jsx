// src/ChatWindow.jsx
import { useState, useRef, useEffect } from "react";

function ChatWindow({
  user,
  token,
  messages,
  setMessages,
  inputText,
  setInputText,
  isTyping,
  setIsTyping,
}) {
  const messagesEndRef = useRef(null);

  // --- NEW: RESPONSIVE STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const suggestions = [
    "Convert Dirham to INR",
    "Live Price of Nvidia",
    "Explain Nifty 50",
    "Stock price of Microsoft?",
    "Yen exchange rate",
    "Live price of Bitcoin",
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    // 1. Add user message to UI
    const newMessages = [...messages, { sender: "user", text: textToSend }];
    setMessages(newMessages);
    setInputText("");
    setIsTyping(true);

    try {
      // 1. Safely grab the environment variable, or fallback to localhost
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // DEBUG: This will print the URL to your browser console so we can verify it
      console.log("FinAdvisor is attempting to connect to:", API_URL);

      // 2. Send the message to our Node.js Backend SECURELY
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: textToSend }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 3. Add Bot's response to the UI
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply || "Sorry, I couldn't process that right now.",
        },
      ]);
    } catch (error) {
      console.error("Error communicating with backend:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "System error: Cannot reach the FinAdvisor backend server.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1 /* FIX: Changed height: 100% to flex: 1 so it fits perfectly under the header */,
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      
      {/* 1. CHAT MESSAGES AREA */}
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
          /* FIX: Removed the 60px top padding since the header is now neatly stacked above it */
          padding: isMobile ? "10px 10px 20px 10px" : "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          scrollBehavior: "smooth",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "750px",
            display: "flex",
            flexDirection: "column",
            // RESPONSIVE GAP: Tighter chat bubbles on mobile
            gap: isMobile ? "16px" : "24px",
          }}
        >
          {/* --- THE WELCOME HERO SECTION --- */}
          <div
            style={{
              textAlign: "center",
              // RESPONSIVE MARGIN: Push it down less on mobile
              marginTop: isMobile ? "10px" : "60px",
              marginBottom: isMobile ? "20px" : "40px",
              padding: isMobile ? "0 10px" : "0",
            }}
          >
            <h1
              style={{
                // RESPONSIVE FONT SIZE
                fontSize: isMobile ? "1.8rem" : "2.5rem",
                fontWeight: "600",
                color: "#ECECEC",
                margin: "0 0 10px 0",
                letterSpacing: "-0.5px",
              }}
            >
              Welcome,{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #007bff, #00d2ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {user ? user.name.split(" ")[0] : "User"}
              </span>
            </h1>
            <p
              style={{
                color: "#888",
                // RESPONSIVE FONT SIZE
                fontSize: isMobile ? "0.95rem" : "1.1rem",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Ask your financial and stock market related questions to
              FinAdvisor!
            </p>
          </div>

          {/* CHAT BUBBLES */}
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent:
                  msg.sender === "user" ? "flex-end" : "flex-start",
                width: "100%",
              }}
            >
              <div
                style={{
                  padding: "12px 18px",
                  // RESPONSIVE WIDTH: Let bubbles take up more screen on mobile
                  maxWidth: isMobile ? "92%" : "80%",
                  lineHeight: "1.6",
                  // RESPONSIVE FONT SIZE
                  fontSize: isMobile ? "14.5px" : "15px",
                  backgroundColor: "rgba(212, 209, 209, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ECECEC",
                  borderRadius: "12px",
                  wordWrap: "break-word", // Ensures long URLs or words don't break the layout
                }}
              >
                {msg.sender !== "user" && (
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#fff",
                    }}
                  >
                    FinAdvisor
                  </strong>
                )}
                {/* THE FIX: Splitting the text by newlines and adding HTML break tags */}
                {msg.text.split("\n").map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            </div>
          ))}

          {isTyping && (
            <div
              style={{
                padding: "12px 18px",
                color: "#888",
                fontStyle: "italic",
                fontSize: isMobile ? "14px" : "15px",
              }}
            >
              FinAdvisor is thinking...
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>
      </div>

      {/* 2. BOTTOM CONTROL AREA */}
      <div
        style={{
          // RESPONSIVE PADDING: safe-area-inset protects against iOS/Android bottom swipe bars
          padding: isMobile
            ? "0 10px max(12px, env(safe-area-inset-bottom)) 10px"
            : "0 20px 20px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#212121",
          width: "100%",
        }}
      >
        <div style={{ width: "100%", maxWidth: "700px" }}>
          {/* A. SUGGESTIONS BAR */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              marginBottom: "10px",
              paddingBottom: "5px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch", // Smooth scroll on mobile
            }}
          >
            <style>{`::-webkit-scrollbar { display: none; }`}</style>

            {suggestions.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleSend(tab)}
                style={{
                  whiteSpace: "nowrap",
                  padding: isMobile ? "8px 14px" : "8px 16px",
                  borderRadius: "16px",
                  backgroundColor: "#2F2F2F",
                  color: "#ECECEC",
                  border: "1px solid #444",
                  cursor: "pointer",
                  fontSize: isMobile ? "13px" : "13px",
                  transition: "0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* B. INPUT BOX & SEND BUTTON */}
          <div
            style={{
              display: "flex",
              gap: isMobile ? "6px" : "10px",
              backgroundColor: "#2F2F2F",
              padding: isMobile ? "6px" : "8px",
              borderRadius: "24px",
              border: "1px solid #444",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder={
                isMobile
                  ? "Ask FinAdvisor..."
                  : "Ask your doubts to FinAdvisor..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{
                flexGrow: 1,
                padding: isMobile ? "10px 12px" : "10px 15px",
                backgroundColor: "transparent",
                border: "none",
                color: "#ECECEC",
                outline: "none",
                // RESPONSIVE FIX: Font size MUST be at least 16px on mobile to prevent Chrome/Safari auto-zoom bug
                fontSize: isMobile ? "16px" : "15px",
                width: "100%",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !inputText.trim()}
              style={{
                padding: isMobile ? "10px 18px" : "10px 20px",
                borderRadius: "20px",
                backgroundColor:
                  isTyping || !inputText.trim() ? "#555" : "#ECECEC",
                color: isTyping || !inputText.trim() ? "#888" : "#000",
                fontWeight: "600",
                border: "none",
                cursor:
                  isTyping || !inputText.trim() ? "not-allowed" : "pointer",
                transition: "0.2s",
                fontSize: isMobile ? "14px" : "15px",
                flexShrink: 0, // Prevents the button from squishing on 6.1-inch screens
              }}
            >
              Send
            </button>
          </div>
          <p
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: "10px",
              margin: "8px 0 0 0",
              padding: "0 10px",
            }}
          >
            FinAdvisor AI can make mistakes. Verify important financial data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
