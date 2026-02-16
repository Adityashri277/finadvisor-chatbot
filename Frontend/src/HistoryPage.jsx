import React, { useState, useEffect } from "react";

const HistoryPage = ({ token }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // --- NEW: RESPONSIVE STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      // 1. Safely grab the environment variable
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      // 2. Fetch using the dynamic URL
      const response = await fetch(`${API_URL}/api/history`, {
        headers: {
          "Authorization": `Bearer ${token}` 
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch history");
      
      const data = await response.json();
      setChatHistory(data.reverse()); 
    } catch (error) {
      console.error("History Fetch Error:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    /* MASTER CONTAINER: Full height, scrolling, and centering children */
    <div
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        // RESPONSIVE PADDING: Tighter on mobile
        padding: isMobile ? "20px 10px" : "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* INNER WRAPPER: Constrains the width so it doesn't stretch across the screen */}
      <div style={{ width: "100%", maxWidth: "750px" }}>
        <h2
          style={{
            paddingBottom: "20px",
            marginTop: 0,
            fontWeight: "600",
            color: "#ECECEC",
            // RESPONSIVE MARGIN/FONT
            fontSize: isMobile ? "1.5rem" : "1.8rem",
            marginLeft: isMobile ? "10px" : "0",
          }}
        >
          Past Conversations
        </h2>

        {isHistoryLoading ? (
          <p style={{ color: "#888", textAlign: "center", marginTop: "40px" }}>
            Loading past conversations...
          </p>
        ) : chatHistory.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", marginTop: "40px" }}>
            No past conversations found. Go ask FinAdvisor a question!
          </p>
        ) : (
          chatHistory.map((log) => (
            /* --- PREMIUM HISTORY CARD --- */
            <div
              key={log.id}
              style={{
                marginBottom: "24px",
                // RESPONSIVE PADDING
                padding: isMobile ? "16px" : "24px",
                backgroundColor:
                  "rgba(255, 255, 255, 0.03)" /* Extremely subtle glass background */,
                border:
                  "1px solid rgba(255, 255, 255, 0.08)" /* Premium faint border */,
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* --- USER'S QUERY SECTION --- */}
              <div>
                <div
                  style={{
                    display: "flex",
                    // RESPONSIVE FLEX: Stack on mobile to prevent overlapping
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? "8px" : "0",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      color: "#ECECEC",
                      fontWeight: "600",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      padding: "4px 10px",
                      borderRadius: "12px",
                    }}
                  >
                    User Query
                  </span>
                  <span style={{ fontSize: "11px", color: "#666" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                {/* The blue accent line on the left mimics a "quoted" message */}
                <div
                  style={{
                    color: "#ECECEC",
                    // RESPONSIVE FONT SIZE
                    fontSize: isMobile ? "14px" : "16px",
                    paddingLeft: "12px",
                    borderLeft: "3px solid #007bff",
                  }}
                >
                  {log.user_message}
                </div>
              </div>

              {/* --- BOT'S RESPONSE SECTION --- */}
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingTop: "16px",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    color: "#007bff",
                    fontWeight: "600",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  Bot's Response
                </span>
                <div
                  style={{
                    color: "#ccc",
                    // RESPONSIVE FONT SIZE
                    fontSize: isMobile ? "14px" : "15px",
                    lineHeight: "1.6",
                  }}
                >
                  {log.bot_response}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
