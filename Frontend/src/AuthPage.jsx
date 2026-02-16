import React, { useState, useEffect } from "react";

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW: RESPONSIVE STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = isLogin ? "/api/login" : "/api/signup";
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Success! Pass the user data and token up to App.jsx
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // MOVED INSIDE: So it can access the isMobile state for responsive sizing
  const inputStyle = {
    padding: isMobile ? "10px 14px" : "12px 16px",
    backgroundColor: "#2F2F2F",
    border: "1px solid #444",
    color: "#ECECEC",
    borderRadius: "8px",
    outline: "none",
    fontSize: isMobile ? "14px" : "15px",
    width: "100%",
    boxSizing: "border-box", // Safeguard to prevent inputs from stretching outside the box
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#212121",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#ECECEC",
        fontFamily: "'Inter', sans-serif",
        // RESPONSIVE PADDING: Keeps the box from touching the phone screen edges
        padding: isMobile ? "20px" : "0",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#171717",
          // RESPONSIVE PADDING: Tighter on mobile
          padding: isMobile ? "30px 20px" : "40px",
          borderRadius: "16px",
          border: "1px solid #333",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          {/* THE NEW AI GRAPHIC LOGO (Scales down slightly on mobile) */}
          <div
            style={{
              width: isMobile ? "40px" : "48px",
              height: isMobile ? "40px" : "48px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "linear-gradient(135deg, #007bff, #00d2ff)",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0, 123, 255, 0.3)",
              margin: "0 auto 15px auto",
            }}
          >
            <svg
              width={isMobile ? "24" : "28"}
              height={isMobile ? "24" : "28"}
              viewBox="0 0 24 24"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L14.09 9.91L22 12L14.09 14.09L12 22L9.91 14.09L2 12L9.91 9.91L12 2Z" />
            </svg>
          </div>

          <h2 style={{ margin: 0, fontSize: isMobile ? "22px" : "24px" }}>
            Welcome to FinAdvisor
          </h2>
          <p
            style={{
              color: "#888",
              marginTop: "8px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            {isLogin
              ? "Log in to access your account."
              : "Create an account to get started."}
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(255,0,0,0.1)",
              color: "#ff4d4d",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              textAlign: "center",
              border: "1px solid rgba(255,0,0,0.2)",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "12px" : "15px",
          }}
        >
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: isMobile ? "10px" : "12px",
              backgroundColor: "#ECECEC",
              color: "#171717",
              border: "none",
              borderRadius: "8px",
              fontSize: isMobile ? "15px" : "16px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "10px",
              transition: "0.2s",
            }}
          >
            {isLoading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "14px",
            color: "#888",
          }}
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            style={{ color: "#007bff", cursor: "pointer", fontWeight: "600" }}
          >
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
