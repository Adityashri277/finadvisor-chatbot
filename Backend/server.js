require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const dialogflow = require("@google-cloud/dialogflow");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// This is the master key that signs your login tokens. 
// In production, this goes in your .env file!
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-finadvisor-key";

// Middleware
app.use(cors({
  origin: "*", // In the future, you can change "*" to your exact Vercel URL for ultimate security
  methods: ["GET", "POST"]
}));
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize Clients
const sessionClient = new dialogflow.SessionsClient(); 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// --- SIGNUP ROUTE ---
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [existingUsers] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const token = jwt.sign({ id: result.insertId, name, email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ message: "User created successfully", token, user: { name, email } });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error during signup." });
  }
});

// --- LOGIN ROUTE ---
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ message: "Login successful", token, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
});


// ==========================================
// 2. CHAT & AI ROUTE
// ==========================================
app.post("/api/chat", async (req, res) => {
  const { text, sessionId = "finadvisor-session-123" } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Message text is required" });
  }

  try {
    // 1. Send text to Dialogflow
    const projectId = require("./" + process.env.GOOGLE_APPLICATION_CREDENTIALS).project_id;
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
      session: sessionPath,
      queryInput: { text: { text: text, languageCode: "en-US" } },
    };

    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult;
    const intentName = result.intent ? result.intent.displayName : "Unknown";

    let finalReply = result.fulfillmentText;

    // 2. Route based on Intent
    if (intentName === "GetStockPrice") {
      const rawSymbol = result.parameters.fields.StockTicker ? result.parameters.fields.StockTicker.stringValue : null;
      const searchQuery = rawSymbol ? rawSymbol.trim() : null;

      if (searchQuery) {
        try {
          const searchResults = await yahooFinance.search(searchQuery);
          const validQuote = searchResults.quotes ? searchResults.quotes.find((q) => q.isYahooFinance === true && q.symbol) : null;

          if (validQuote) {
            const bestSymbol = validQuote.symbol;
            const companyName = validQuote.shortname || validQuote.longname || searchQuery;
            const quote = await yahooFinance.quote(bestSymbol);

            if (quote && quote.regularMarketPrice) {
              let price = quote.regularMarketPrice;
              let currency = quote.currency || "USD";

              if (currency === "USD") {
                try {
                  const inrQuote = await yahooFinance.quote("INR=X");
                  price = price * inrQuote.regularMarketPrice;
                  currency = "INR";
                } catch (conversionError) {
                  console.error("Conversion Error:", conversionError.message);
                }
              }

              const currencySymbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency + " ";
              finalReply = `The current price of ${companyName} is ${currencySymbol}${price.toFixed(2)}`;
            } else {
              finalReply = `I couldn't fetch the live data for ${companyName} right now.`;
            }
          } else {
            finalReply = `I couldn't find a tradable public stock matching "${searchQuery}". They might be a private company or unlisted!`;
          }
        } catch (apiError) {
          console.error("Yahoo Finance Error:", apiError.message);
          finalReply = `I ran into an issue finding the data for "${searchQuery}".`;
        }
      } else {
        finalReply = "I know you are asking for a stock price, but Dialogflow didn't catch the company name! Check the entity name in your Dialogflow console.";
      }
    } else if (intentName === "Default Fallback Intent" || intentName === "ExplainTerm") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are an expert financial advisor named FinAdvisor AI. 
      A user has asked you this question: "${text}"
      Strict Rules for your response:
      1. Keep the answer little bit concise (maximum 2 to 4 sentences).
      2. Explain things simply, as if speaking to a beginner investor.
      3. Do not use bolding, asterisks, or bullet points in your response. Just plain text.
      4. Keep the tone professional, crisp, and helpful.`;
      
      const aiResult = await model.generateContent(prompt);
      finalReply = aiResult.response.text();
    }

    // 3. SECURELY Save the conversation to MySQL
    try {
      let userId = null;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id; // Extract the specific user ID from the secure token
      }

      const insertQuery = "INSERT INTO chat_history (session_id, user_message, bot_response, user_id) VALUES (?, ?, ?, ?)";
      await pool.execute(insertQuery, [sessionId, text, finalReply, userId]);
    } catch (dbError) {
      console.error("Database Save Error:", dbError.message);
    }

    res.json({ reply: finalReply, intent: intentName });

  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: "Internal server error processing your request." });
  }
});


// ==========================================
// 3. SECURE HISTORY ROUTE
// ==========================================
app.get("/api/history", async (req, res) => {
  try {
    // 1. Verify the user's security token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // 2. Fetch ONLY the chats belonging to this specific user ID
    const [rows] = await pool.execute("SELECT * FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC", [userId]);
    res.json(rows);

  } catch (error) {
    console.error("Database Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve chat history." });
  }
});


// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running securely on http://localhost:${PORT}`);
});