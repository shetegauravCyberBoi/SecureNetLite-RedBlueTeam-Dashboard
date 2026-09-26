import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // UI-only preview authentication.
  // No backend, MongoDB, JWT secret, or API request is required.
  const handleLogin = () => {
    setError("");

    if (!username || !password) {
      setError("Both username and password are required.");
      return;
    }

    setLoading(true);

    // Create a local demo session so protected UI pages can be viewed.
    const demoUser = {
      username: username,
      email: `${username}@ui-preview.local`,
      role: "UI Preview User",
    };

    const demoToken = `ui-preview-${Date.now()}`;

    login({
      access_token: demoToken,
      user: demoUser,
    });

    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div style={{ minHeight:"90vh", display:"flex", justifyContent:"center", alignItems:"center", background:"#f8fafc", padding:"1rem" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .lp-card  { width:100%; max-width:420px; background:#fff; border:1.5px solid #e2e8f0; border-radius:20px; padding:2.4rem 2.2rem; box-shadow:0 4px 32px rgba(0,0,0,0.07); animation:fadeUp 0.35s ease both; }
        .lp-field { width:100%; border:1.5px solid #e2e8f0; border-radius:12px; padding:0.72rem 1rem; font-size:0.92rem; color:#0f172a; transition:border-color 0.15s, box-shadow 0.15s; background:#fff; }
        .lp-field:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .lp-btn   { width:100%; border:none; border-radius:999px; padding:0.75rem; font-weight:700; font-size:0.95rem; cursor:pointer; transition:all 0.15s; background:linear-gradient(135deg,#1e40af,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; gap:0.5rem; box-shadow:0 4px 16px rgba(37,99,235,0.2); }
        .lp-btn:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,0.3); }
        .lp-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .lp-tab   { font-size:0.88rem; font-weight:600; color:#94a3b8; cursor:pointer; padding:0.3rem 0.8rem; border-radius:999px; transition:all 0.15s; border:none; background:transparent; }
        .lp-tab.active { color:#0f172a; background:#f1f5f9; }
        .lp-tab:hover:not(.active) { color:#475569; }
        .lp-divider { display:flex; align-items:center; gap:0.7rem; margin:1.2rem 0; }
        .lp-divider::before,.lp-divider::after { content:''; flex:1; height:1px; background:#f1f5f9; }
        .lp-divider span { font-size:0.72rem; color:#94a3b8; white-space:nowrap; }
      `}</style>

      <div className="lp-card">

        {/* Brand */}
        <div style={{ textAlign:"center", marginBottom:"1.8rem" }}>
          <div style={{ fontSize:"1.6rem", marginBottom:"0.4rem" }}>🛡️</div>
          <div style={{ fontWeight:800, fontSize:"1.2rem", color:"#0f172a", letterSpacing:"-0.02em" }}>
            Secure<span style={{ color:"#2563eb" }}>Net</span>Lite
          </div>
          <div style={{ fontSize:"0.78rem", color:"#94a3b8", marginTop:2 }}>Security Operations Platform</div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", justifyContent:"center", gap:"0.3rem", marginBottom:"1.6rem", background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:999, padding:4 }}>
          <button className="lp-tab active">Sign In</button>
          <button className="lp-tab" onClick={() => navigate("/register")}>Create Account</button>
        </div>

        {/* Heading */}
        <div style={{ marginBottom:"1.4rem" }}>
          <h2 style={{ fontWeight:700, fontSize:"1.3rem", margin:0 }}>Welcome back</h2>
          <p style={{ color:"#94a3b8", fontSize:"0.83rem" }}>Sign in to continue</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", padding:"0.7rem", borderRadius:12, marginBottom:"1rem", textAlign:"center" }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <input className="lp-field" placeholder="Username"
          value={username} onChange={(e)=>setUsername(e.target.value)}
          onKeyDown={(e)=>e.key==="Enter" && handleLogin()} />

        <input type="password" className="lp-field" placeholder="Password"
          value={password} onChange={(e)=>setPassword(e.target.value)}
          onKeyDown={(e)=>e.key==="Enter" && handleLogin()} style={{marginTop:"0.7rem"}} />

        {/* Button */}
        <button className="lp-btn" onClick={handleLogin} disabled={loading} style={{marginTop:"1rem"}}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>

      </div>
    </div>
  );
}
