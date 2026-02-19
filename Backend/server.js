require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const dialogflow = require("@google-cloud/dialogflow");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// This is the master key that signs your login tokens.
// In production, this goes in your .env file!
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-finadvisor-key";

// Middleware
app.use(
  cors({
    origin: "*", // In the future, you can change "*" to your exact Vercel URL for ultimate security
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize Clients
const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // The .replace() is crucial so the cloud server reads the hidden newline characters correctly
    private_key: process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
  },
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// --- SIGNUP ROUTE ---
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const token = jwt.sign({ id: result.insertId, name, email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      message: "User created successfully",
      token,
      user: { name, email },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error during signup." });
  }
});

// --- LOGIN ROUTE ---
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email },
    });
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

  // 1. Check if the message is empty
  if (!text) {
    return res.status(400).json({ error: "Message text is required" });
  }

  try {
    // 2. Define the Project ID directly
    const projectId = process.env.GOOGLE_PROJECT_ID;

    // 3. Create the session path
    const sessionPath = sessionClient.projectAgentSessionPath(
      projectId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: { text: { text: text, languageCode: "en-US" } },
    };

    // 4. Send text to Dialogflow
    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult;
    const intentName = result.intent ? result.intent.displayName : "Unknown";

    let finalReply = result.fulfillmentText;

    // --- FORMATTING HELPERS ---
    const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    const formatUSD = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

    // 5. Route based on Intent (Now perfectly chained)
    // --- 1. STOCK PRICE HANDLER ---
    if (intentName === "GetStockPrice") {
      let rawSymbol = result.parameters.StockTicker || (result.parameters.fields && result.parameters.fields.StockTicker ? result.parameters.fields.StockTicker.stringValue : null);
      if (Array.isArray(rawSymbol)) rawSymbol = rawSymbol[0];
      const searchQuery = rawSymbol ? rawSymbol.trim() : null;

      if (searchQuery) {
        try {
          const searchRes = await fetch(`https://finnhub.io/api/v1/search?q=${searchQuery}&token=${process.env.FINNHUB_API_KEY}`);
          const searchData = await searchRes.json();

          if (searchData.count > 0 && searchData.result.length > 0) {
            const bestSymbol = searchData.result[0].symbol;
            const companyName = searchData.result[0].description || capitalize(searchQuery);

            const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${bestSymbol}&token=${process.env.FINNHUB_API_KEY}`);
            const quoteData = await quoteRes.json();

            if (quoteData && quoteData.c && quoteData.c > 0) {
              let priceInUSD = quoteData.c;

              try {
                const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
                const fxData = await fxRes.json();

                if (fxData && fxData.rates && fxData.rates.INR) {
                  const inrRate = fxData.rates.INR;
                  let priceInINR = priceInUSD * inrRate;
                  finalReply = `The current price of ${companyName} is ${formatINR(priceInINR)}`;
                } else {
                  finalReply = `The current price of ${companyName} is ${formatUSD(priceInUSD)}.`;
                }
              } catch (fxError) {
                console.error("Exchange Rate Error:", fxError.message);
                finalReply = `The current price of ${companyName} is ${formatUSD(priceInUSD)}.`;
              }
            } else {
              finalReply = `I couldn't fetch the live data for ${companyName} right now.`;
            }
          } else {
            finalReply = `I couldn't find a tradable public stock matching "${searchQuery}". They might be a private company or unlisted!`;
          }
        } catch (apiError) {
          console.error("Finnhub API Error:", apiError.message);
          finalReply = `I ran into an issue finding the data for "${searchQuery}".`;
        }
      } else {
        finalReply = "I know you are asking for a stock price, but Dialogflow didn't catch the company name! Check the entity name in your Dialogflow console.";
      }
    } 
    // --- 2. CRYPTO HANDLER ---
    else if (intentName === "GetCryptoPrice") {
      let rawCoin = result.parameters.fields?.CryptoName?.stringValue || result.parameters.CryptoName;
      if (Array.isArray(rawCoin)) rawCoin = rawCoin[0];
      const coinName = rawCoin ? rawCoin.toLowerCase().trim() : null;

      const cryptoMap = {
        "bitcoin": "BINANCE:BTCUSDT", "btc": "BINANCE:BTCUSDT",
        "ethereum": "BINANCE:ETHUSDT", "eth": "BINANCE:ETHUSDT",
        "dogecoin": "BINANCE:DOGEUSDT", "doge": "BINANCE:DOGEUSDT",
        "solana": "BINANCE:SOLUSDT", "sol": "BINANCE:SOLUSDT",
        "ripple": "BINANCE:XRPUSDT", "xrp": "BINANCE:XRPUSDT",
        "cardano": "BINANCE:ADAUSDT", "ada": "BINANCE:ADAUSDT"
      };

      const symbol = cryptoMap[coinName];

      if (symbol) {
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
          const data = await res.json();
          
          if (data.c) {
            const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
            const fxData = await fxRes.json();
            const inrRate = fxData.rates.INR;
            const priceInINR = data.c * inrRate;

            finalReply = `The current price of ${capitalize(coinName)} is ${formatINR(priceInINR)}`;
          } else {
            finalReply = `I couldn't fetch the live crypto data for ${coinName} right now.`;
          }
        } catch (error) {
          console.error("Crypto API Error:", error);
          finalReply = "I ran into a digital glitch fetching that crypto price.";
        }
      } else {
        finalReply = "I currently only track major cryptos like Bitcoin, Ethereum, Doge, Solana, and Ripple. Try one of those!";
      }
    } 
    // --- 3. FOREX HANDLER ---
  
    else if (intentName === "GetForexRate") {
      let rawCurrency = result.parameters.fields?.ForexName?.stringValue || result.parameters.ForexName;
      if (Array.isArray(rawCurrency)) rawCurrency = rawCurrency[0]; // Safety catch
      const currency = rawCurrency ? rawCurrency.toLowerCase().trim() : null;

      
      // "Magic Map" - Map spoken words to their 3-letter ISO currency codes
      const currencyMap = {
        // 1. US Dollar
        "us dollar": "USD", "dollar": "USD", "usd": "USD", "american dollar": "USD",
        // 2. Euro
        "euro": "EUR", "eur": "EUR", "euros": "EUR",
        // 3. British Pound
        "british pound": "GBP", "pound": "GBP", "gbp": "GBP", "sterling": "GBP",
        // 4. Japanese Yen
        "japanese yen": "JPY", "yen": "JPY", "jpy": "JPY",
        // 5. UAE Dirham
        "uae dirham": "AED", "dirham": "AED", "aed": "AED",
        // 6. Australian Dollar
        "australian dollar": "AUD", "aud": "AUD", "aussie dollar": "AUD",
        // 7. Canadian Dollar
        "canadian dollar": "CAD", "cad": "CAD",
        // 8. Swiss Franc
        "swiss franc": "CHF", "franc": "CHF", "chf": "CHF",
        // 9. Singapore Dollar
        "singapore dollar": "SGD", "sgd": "SGD",
        // 10. Chinese Yuan
        "chinese yuan": "CNY", "yuan": "CNY", "cny": "CNY", "renminbi": "CNY", "rmb": "CNY",
        // 11. New Zealand Dollar
        "new zealand dollar": "NZD", "nzd": "NZD", "kiwi": "NZD",
        // 12. South African Rand
        "south african rand": "ZAR", "rand": "ZAR", "zar": "ZAR",
        // 13. Saudi Riyal
        "saudi riyal": "SAR", "riyal": "SAR", "sar": "SAR",
        // 14. Kuwaiti Dinar
        "kuwaiti dinar": "KWD", "dinar": "KWD", "kwd": "KWD",
        // 15. Omani Rial
        "omani rial": "OMR", "rial": "OMR", "omr": "OMR"
      };
      const targetCode = currencyMap[currency];

      if (currency === "rupee" || currency === "inr" || currency === "indian rupee") {
        finalReply = "The Indian Rupee (INR) is our base currency! 1 INR is always equal to 1 INR. Try asking for the price of the US Dollar or Euro.";
      } 
      else if (targetCode) {
        try {
          // Fetch rates using the requested currency as the BASE
          const res = await fetch(`https://open.er-api.com/v6/latest/${targetCode}`);
          const data = await res.json();
          
          if (data && data.rates && data.rates.INR) {
            const rateInRupees = data.rates.INR;
            
            // Format nicely with the Rupee symbol and commas
            const formattedRate = new Intl.NumberFormat('en-IN', { 
              style: 'currency', 
              currency: 'INR',
              maximumFractionDigits: 2 
            }).format(rateInRupees);
            
            finalReply = `1 ${targetCode} is currently trading at ${formattedRate}`;
          } else {
            finalReply = `I couldn't fetch the INR conversion rate for ${currency}`;
          }
        } catch (error) {
          console.error("Forex API Error:", error);
          finalReply = "I couldn't connect to the currency exchange right now.";
        }
      } else {
        finalReply = "I track major currencies against the Rupee (like USD, Euro, GBP, Yen, and Dirham). Which one do you want to convert to INR?";
      }
    }

    // 6. SECURELY Save the conversation to MySQL
    try {
      let userId = null;
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id; // Extract the specific user ID from the secure token
      }
    
      const insertQuery =
        "INSERT INTO chat_history (session_id, user_message, bot_response, user_id) VALUES (?, ?, ?, ?)";
      await pool.execute(insertQuery, [sessionId, text, finalReply, userId]);
    } catch (dbError) {
      console.error("Database Save Error:", dbError.message);
    }

    // 7. Send the successful reply back to your React frontend
    return res.json({ reply: finalReply, intent: intentName });
  } catch (error) {
    console.error("Chat API Error:", error);
    return res
      .status(500)
      .json({ error: "System error: Cannot reach the backend server." });
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
    const [rows] = await pool.execute(
      "SELECT * FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC",
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Database Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve chat history." });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running securely on port ${PORT}`);
});