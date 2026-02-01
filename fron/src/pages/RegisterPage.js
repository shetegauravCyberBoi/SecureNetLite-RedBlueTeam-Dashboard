// src/pages/RegisterPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // reuse the login style

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [role] = useState("analyst"); // fixed role, not user-controlled

  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // UX-only guard to avoid bcrypt 72-byte issues
    // (Backend must still enforce securely)
    if (password.length > 64) {
      setError("Password must be at most 64 characters");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password, // DO NOT trim or modify passwords
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      alert("Registration successful. Please log in.");
      navigate("/login");
    } catch (err) {
      // Never expose backend/internal crypto errors
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      {/* Tab Header */}
      <div className="tab-header">
        <span onClick={() => navigate("/login")}>Login</span>
        <span className="active">Sign Up</span>
      </div>

      {/* Error Display */}
      {error && <div className="error-text">{error}</div>}

      {/* Inputs */}
      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Create Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Retype Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {confirmPassword && password !== confirmPassword && (
        <small className="error-text">Passwords do not match</small>
      )}

      <button className="login-btn" onClick={handleRegister}>
        Sign Up
      </button>
    </div>
  );
}
