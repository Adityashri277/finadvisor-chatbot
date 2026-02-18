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

* **🤖 Dual-Brain AI System** * Uses **Google Dialogflow** for precise intent recognition (detecting specific stock/price queries).
  * Uses **Google Gemini 2.5 Flash** for generating conversational, easy-to-understand financial advice and definitions.
* **📊 Live Stock Market Data** * Integrates with the official **Finnhub API** to convert standard company names (e.g., "Apple") into valid ticker symbols ("AAPL") and fetch real-time market prices.
* **💱 Dynamic Currency Conversion** * Automatically fetches live global exchange rates via **ExchangeRate-API** to display US stock prices in both locally localized INR (₹) and USD ($).
* **🔒 Secure Authentication** * Features a custom JWT (JSON Web Token) login and signup system with securely hashed passwords using `bcrypt`.
* **💾 Persistent Memory** * Automatically saves user chat sessions to a remote MySQL database, viewable in a custom "History" slide-out sidebar.
* **📱 Flawless Mobile Responsiveness** * Custom UI engineered with `100dvh` calculations to prevent mobile browser address bars from breaking the layout, complete with an off-canvas mobile navigation menu.

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

---

## 🚀 Getting Started (Running Locally)

If you want to run this project on your local machine, you will need a few free API keys.

### 1. Clone the repository
```bash
git clone [https://github.com/Adityashri277/finadvisor-chatbot.git](https://github.com/Adityashri277/finadvisor-chatbot.git)
cd finadvisor-chatbot
