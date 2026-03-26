# 📈 FinAdvisor AI Chatbot

A full-stack, AI-powered financial advisor and stock market assistant. FinAdvisor leverages Natural Language Processing and generative AI to explain complex financial concepts to beginners, alongside real-time API integrations to fetch live global stock prices with dynamic currency conversion.

## 📑 Table of Contents
- [The "Vibe Coding" Methodology](#the-vibe-coding-methodology)
- [Key Features](#key-features)
- [The Tech Stack](#the-tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started (Running Locally)](#getting-started-running-locally)
- [Challenges Overcome](#challenges-overcome)

---

## 🪄 The "Vibe Coding" Methodology

> [!IMPORTANT]  
> **Zero manual coding.** > This entire full-stack application was architected, debugged, and deployed using **Vibe Coding**—an AI-first development methodology. Every single line of React, Node.js, database routing, responsive CSS, and API integration was orchestrated purely through natural language prompting. This project serves as a testament to the raw power of human-AI collaborative engineering.

---

## ✨ Key Features

* **🤖 Intelligent Intent Recognition**
  * Powered by **Google Dialogflow** for high-precision NLP, accurately detecting specific financial intents (Stocks, Crypto, or Forex) even within ambiguous conversational queries.

* **📈 Integrated Stock & Crypto Tracking**
  * Real-time integration with **Finnhub** and **Binance** data streams.
  * Dynamically converts company names (e.g., "Tesla") into tickers ("TSLA") and fetches live valuations for top cryptocurrencies like Bitcoin, Ethereum, and Solana.

* **💱 Enhanced Forex-to-INR Engine**
  * Custom-built conversion layer supporting **15+ major global currencies** (USD, EUR, GBP, AED, JPY, etc.).
  * Uses the **ExchangeRate-API** to provide direct, real-time conversion into Indian Rupees (INR) by default.

* **🇮🇳 Localized Financial Formatting**
  * Engineered with the **Indian Numbering System** to ensure high readability for large figures (e.g., displaying **₹60,92,636.28** instead of standard western formatting).

* **🔒 Secure Authentication**
  * Features a robust **JWT (JSON Web Token)** login and signup system with industrial-grade password hashing using `bcrypt`.

* **💾 Persistent Chat Memory**
  * Every interaction is automatically saved to a **MySQL database** with user-specific indexing, allowing for a seamless "Chat History" experience via the slide-out sidebar.

* **📱 Mobile-First UI Architecture**
  * Advanced CSS implementation using `100dvh` and dynamic viewport calculations to prevent mobile browser UI elements (like address bars) from breaking the layout.

---

## 🛠️ The Tech Stack

### Frontend
* **React.js** (Vite)
* Custom CSS & Inline styling for dynamic responsiveness
* Hosted on **Vercel**

### Backend & Database
* **Node.js & Express.js** (RESTful API architecture)
* Hosted securely on **Railway**
* **MySQL** (Hosted via Aiven)
* **JWT** & **bcrypt** (Session management and password encryption)

### AI & Third-Party APIs
* **Google Dialogflow API:** Intent routing & entity extraction
* **Google Gemini API:** Generative AI for financial literacy
* **Finnhub API:** Real-time stock market data
* **ExchangeRate-API:** Live USD-to-INR conversions

---

## 🧠 System Architecture

1. **User Input:** The React frontend captures the user's query and sends it to the Node.js backend with a secure JWT Bearer token.
2. **Intent Recognition:** The backend forwards the text to **Google Dialogflow**.
   * *If the intent is a stock query:* The backend intercepts it, calls the **Finnhub API** to search the symbol, fetches the live quote, and applies the live **ExchangeRate API** conversion.
   * *If the intent is general finance:* The backend routes the query to **Gemini 2.5 Flash** with a strict system prompt to act as an expert, beginner-friendly financial advisor.
3. **Data Storage:** The backend securely logs the User ID, Session ID, and AI response to the **MySQL** database.
4. **Client Response:** The formatted data is returned to the React frontend and displayed in the real-time chat UI.

   <img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/3d942568-1b57-411f-ad02-2c60f163782b" />


---

## 🚀 Getting Started (Running Locally)

If you want to run this project on your local machine, you will need a few API keys.

### 1. Clone the repository
```bash
git clone [https://github.com/Adityashri277/finadvisor-chatbot.git](https://github.com/Adityashri277/finadvisor-chatbot.git)
cd finadvisor-chatbot
```
### 2. Install backend dependencies
```bash
cd backend && npm install
```
### 3. Install frontend dependencies
```bash
cd ../frontend && npm install
```
### 4. Run the application
```bash
# Start Backend
node server.js
# Start Frontend
npm start
```
