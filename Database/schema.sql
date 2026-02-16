-- Create the database for FinAdvisor AI
CREATE DATABASE IF NOT EXISTS finadvisor_db;
USE finadvisor_db;

-- Table 1: Secure User Profiles
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- We will hash passwords in Node.js before saving!
    profile_data JSON, -- Stores Name, DOB, Country, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Chat History Logs
CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_date DATE NOT NULL,
    topic VARCHAR(100),
    interaction_count INT DEFAULT 0,
    chat_log JSON, -- Stores the actual back-and-forth messages
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Example Insert: How our Node.js backend will push data to this database
INSERT INTO users (email, password_hash, profile_data) 
VALUES (
    'adityashri277@gmail.com', 
    '$2b$10$YourHashedPasswordHere...', 
    '{"name": "Aditya Srivastava", "dob": "2003-05-15", "country": "India"}'
);