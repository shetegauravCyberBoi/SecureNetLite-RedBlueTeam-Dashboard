import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState(""); // ✅ use username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      setError("Both username and password are required.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), // ✅ send username
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      login(data); // ✅ Save token + user to AuthContext
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      {/* Tabs */}
      <div className="tab-header">
        <span className="active">Login</span>
        <span onClick={() => navigate("/register")}>Sign Up</span>
      </div>

      {/* Error Message */}
      {error && <div className="error-text">{error}</div>}

      {/* Username Input */}
      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {/* Password Input */}
      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Login Button */}
      <button className="login-btn" onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}
