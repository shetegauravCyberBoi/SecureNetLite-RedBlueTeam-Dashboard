import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [username,        setUsername]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [role] = useState("analyst");
  const navigate = useNavigate();
  const { login } = useAuth();

  // 🔥 Dynamic API base (works for localhost, LAN, and fake AP)
  const getApiBase = () => {
    const host = window.location.hostname;

    // If running on same machine (dev)
    if (host === "localhost" || host === "127.0.0.1") {
      return process.env.REACT_APP_API_URL || "http://localhost:8000";
    }

    // If connected via your fake AP (10.0.0.x)
    if (host.startsWith("10.0.0.")) {
      return process.env.REACT_APP_API_URL || "http://10.0.0.1:8000";
    }

    // If connected via normal WiFi (192.168.x.x)
    if (host.startsWith("192.168.")) {
      return process.env.REACT_APP_API_URL || `http://${host}:8000`;
    }

    // fallback (just in case)
    return process.env.REACT_APP_API_URL || `http://${host}:8000`;
  };

  const API_BASE = getApiBase();

  const handleRegister = async () => {
    setError("");
    if (!username || !email || !password || !confirmPassword) { setError("All fields are required."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length > 64) { setError("Password must be at most 64 characters."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { throw new Error(data.detail || "Registration failed. Please try again."); }
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div style={{ minHeight:"90vh", display:"flex", justifyContent:"center", alignItems:"center", background:"#f8fafc", padding:"1rem" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .rp-card  { width:100%; max-width:420px; background:#fff; border:1.5px solid #e2e8f0; border-radius:20px; padding:2.4rem 2.2rem; box-shadow:0 4px 32px rgba(0,0,0,0.07); animation:fadeUp 0.35s ease both; }
        .rp-field { width:100%; border:1.5px solid #e2e8f0; border-radius:12px; padding:0.72rem 1rem; font-size:0.92rem; color:#0f172a; transition:border-color 0.15s, box-shadow 0.15s; background:#fff; }
        .rp-field:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .rp-field.valid   { border-color:#22c55e; }
        .rp-field.invalid { border-color:#ef4444; }
        .rp-btn   { width:100%; border:none; border-radius:999px; padding:0.75rem; font-weight:700; font-size:0.95rem; cursor:pointer; transition:all 0.15s; background:linear-gradient(135deg,#1e40af,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; gap:0.5rem; box-shadow:0 4px 16px rgba(37,99,235,0.2); }
        .rp-btn:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,0.3); }
        .rp-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .rp-tab   { font-size:0.88rem; font-weight:600; color:#94a3b8; cursor:pointer; padding:0.3rem 0.8rem; border-radius:999px; transition:all 0.15s; border:none; background:transparent; }
        .rp-tab.active { color:#0f172a; background:#f1f5f9; }
        .rp-tab:hover:not(.active) { color:#475569; }
        .rp-label { font-size:0.72rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#94a3b8; display:block; margin-bottom:5px; }
        .rp-divider { display:flex; align-items:center; gap:0.7rem; margin:1.2rem 0; }
        .rp-divider::before,.rp-divider::after { content:''; flex:1; height:1px; background:#f1f5f9; }
        .rp-divider span { font-size:0.72rem; color:#94a3b8; white-space:nowrap; }
      `}</style>

      <div className="rp-card">

        {/* Brand */}
        <div style={{ textAlign:"center", marginBottom:"1.8rem" }}>
          <div style={{ fontSize:"1.6rem", marginBottom:"0.4rem" }}>🛡️</div>
          <div style={{ fontWeight:800, fontSize:"1.2rem", color:"#0f172a", letterSpacing:"-0.02em" }}>
            Secure<span style={{ color:"#2563eb" }}>Net</span>Lite
          </div>
          <div style={{ fontSize:"0.78rem", color:"#94a3b8", marginTop:2 }}>Security Operations Platform</div>
        </div>

        {/* Tab switch */}
        <div style={{ display:"flex", justifyContent:"center", gap:"0.3rem", marginBottom:"1.6rem", background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:999, padding:4 }}>
          <button className="rp-tab" onClick={() => navigate("/login")}>Sign In</button>
          <button className="rp-tab active">Create Account</button>
        </div>

        {/* Heading */}
        <div style={{ marginBottom:"1.4rem" }}>
          <h2 style={{ fontWeight:700, fontSize:"1.3rem", color:"#0f172a", margin:0 }}>Create your account</h2>
          <p style={{ color:"#94a3b8", fontSize:"0.83rem", margin:"0.2rem 0 0" }}>Join SecureNetLite and start scanning securely</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", color:"#dc2626", padding:"0.7rem 1rem", borderRadius:12, fontSize:"0.84rem", marginBottom:"1rem", textAlign:"center" }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"1.2rem" }}>

          <div>
            <label className="rp-label">Username</label>
            <input type="text" className="rp-field" placeholder="Choose a username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
          </div>

          <div>
            <label className="rp-label">Email Address</label>
            <input type="email" className="rp-field" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
          </div>

          <div>
            <label className="rp-label">Password</label>
            <input type="password" className="rp-field" placeholder="Create a password (max 64 chars)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
            {password && (
              <div style={{ marginTop:5, display:"flex", gap:4 }}>
                {[8, 12, 20].map((len, i) => (
                  <div key={i} style={{ flex:1, height:3, borderRadius:999,
                    background: password.length >= len
                      ? i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "#22c55e"
                      : "#e2e8f0",
                    transition:"background 0.2s"
                  }} />
                ))}
                <span style={{ fontSize:"0.68rem", color: password.length < 8 ? "#ef4444" : password.length < 12 ? "#f59e0b" : "#16a34a", fontWeight:700, whiteSpace:"nowrap" }}>
                  {password.length < 8 ? "Weak" : password.length < 12 ? "Fair" : "Strong"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="rp-label">Confirm Password</label>
            <input type="password"
              className={`rp-field ${passwordsMatch ? "valid" : passwordsMismatch ? "invalid" : ""}`}
              placeholder="Re-enter your password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
            {passwordsMismatch && (
              <div style={{ fontSize:"0.75rem", color:"#ef4444", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                ✗ Passwords do not match
              </div>
            )}
            {passwordsMatch && (
              <div style={{ fontSize:"0.75rem", color:"#16a34a", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                ✓ Passwords match
              </div>
            )}
          </div>

        </div>

        {/* Role badge */}
        <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"0.6rem 1rem", marginBottom:"1.2rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"0.75rem", color:"#94a3b8", fontWeight:600 }}>Account Role</span>
          <span style={{ background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", borderRadius:999, padding:"0.15rem 0.65rem", fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>
            {role}
          </span>
        </div>

        {/* Submit */}
        <button className="rp-btn" onClick={handleRegister} disabled={loading || passwordsMismatch}>
          {loading
            ? <><span style={{ width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />Creating account…</>
            : "Create Account →"}
        </button>

        {/* Sign in link */}
        <div className="rp-divider"><span>Already have an account?</span></div>
        <button onClick={() => navigate("/login")}
          style={{ width:"100%", background:"transparent", border:"1.5px solid #e2e8f0", borderRadius:999, padding:"0.65rem", fontWeight:600, fontSize:"0.87rem", color:"#475569", cursor:"pointer", transition:"all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#cbd5e1"; e.currentTarget.style.background="#f8fafc"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="transparent"; }}>
          Sign in instead
        </button>

      </div>
    </div>
  );
}
