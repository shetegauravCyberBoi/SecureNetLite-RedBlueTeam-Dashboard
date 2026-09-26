import React, { useState, useRef } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MaliciousURLTool() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const abortRef  = useRef(null);
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [url,    setUrl]    = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState("");

  if (!token) return (
    <div className="container mt-5 text-center">
      <h4 style={{ color: "#0f172a" }}>Authentication Required</h4>
      <button className="btn btn-primary mt-3" onClick={() => navigate("/login")}>Login</button>
    </div>
  );

  const runScan = async () => {
    if (!url) return alert("Provide a URL");
    abortRef.current = new AbortController();
    setStatus("running"); setError(""); setResult(null);
    try {
      const res = await API.post("/scan/malicious-url", { url }, { ...authHeader, signal: abortRef.current.signal });
      setResult(res.data.result);
      setStatus("idle");
    } catch (err) {
      if (err.name === "CanceledError") setStatus("stopped");
      else { setError("Malicious URL scan failed."); setStatus("idle"); }
    }
  };

  const stopScan = () => { abortRef.current?.abort(); setStatus("stopped"); };

  const verdictStyle = (v) => {
    if (v === "Malicious")  return { color:"#dc2626", bg:"#fef2f2", border:"#fecaca" };
    if (v === "Suspicious") return { color:"#d97706", bg:"#fffbeb", border:"#fde68a" };
    return                         { color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" };
  };

  const isRunning = status === "running";
  const vs = result ? verdictStyle(result.verdict) : null;

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .mu-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; overflow:hidden; margin-bottom:1rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .mu-header { background:#f8fafc; border-bottom:1.5px solid #f1f5f9; padding:0.65rem 1.2rem; font-size:0.75rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#64748b; }
        .mu-body { padding:1.2rem 1.4rem; }
        .mu-field { border:1.5px solid #e2e8f0; border-radius:12px; padding:0.7rem 1rem; font-size:0.9rem; color:#0f172a; width:100%; transition:border-color 0.15s; }
        .mu-field:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .mu-field:disabled { background:#f8fafc; color:#94a3b8; }
        .mu-btn { border:none; border-radius:12px; padding:0.7rem 1.6rem; font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center; gap:0.5rem; background:linear-gradient(135deg,#f87171,#dc2626); color:#fff; }
        .mu-btn:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px); }
        .mu-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .mu-stop { background:transparent; border:1.5px solid #e2e8f0; color:#64748b; border-radius:999px; padding:0.35rem 1rem; font-size:0.82rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .mu-stop:hover { border-color:#fecaca; color:#dc2626; }
        .mu-status-pill { border-radius:999px; padding:0.22rem 0.75rem; font-size:0.72rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; border:1.5px solid; }
        .mu-result { animation:fadeUp 0.3s ease; }
        .mu-finding { display:flex; align-items:flex-start; gap:0.5rem; padding:0.45rem 0; border-bottom:1px solid #f8fafc; font-size:0.84rem; color:#374151; }
        .mu-finding:last-child { border-bottom:none; }
      `}</style>

      {/* Title */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color:"#0f172a", fontSize:"1.6rem" }}>🛡️ Malicious URL Detector</h2>
        <p style={{ color:"#94a3b8", fontSize:"0.88rem", margin:0 }}>Heuristic analysis to detect phishing, malware distribution, and suspicious URLs.</p>
      </div>

      {/* Input Card */}
      <div className="mu-card">
        <div className="mu-header">🌐 Target URL</div>
        <div className="mu-body">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <input className="mu-field" style={{ flex:1, minWidth:200 }}
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              disabled={isRunning}
            />
            <button className="mu-btn" onClick={runScan} disabled={isRunning}>
              {isRunning
                ? <><span style={{ width:13,height:13,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />Scanning…</>
                : "🔍 Scan URL"}
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="d-flex align-items-center gap-2 mb-3" style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"0.7rem 1.2rem", boxShadow:"0 2px 8px rgba(0,0,0,0.03)" }}>
        <span style={{ fontSize:"0.75rem", color:"#94a3b8", fontWeight:700 }}>STATUS</span>
        <span className="mu-status-pill" style={{
          background: isRunning ? "#fffbeb" : status==="stopped" ? "#fef2f2" : "#f0fdf4",
          color:       isRunning ? "#d97706" : status==="stopped" ? "#dc2626" : "#16a34a",
          borderColor: isRunning ? "#fde68a" : status==="stopped" ? "#fecaca" : "#bbf7d0",
        }}>
          {isRunning && <span style={{ width:8,height:8,border:"2px solid #d97706",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block",marginRight:5 }} />}
          {status.toUpperCase()}
        </span>
        {isRunning && <button className="mu-stop ms-auto" onClick={stopScan}>⛔ Stop</button>}
      </div>

      {error && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", color:"#dc2626", padding:"0.75rem 1rem", borderRadius:12, fontSize:"0.87rem", marginBottom:"1rem" }}>{error}</div>}

      {/* Result */}
      {result && (
        <div className="mu-card mu-result">
          <div className="mu-header">📊 Scan Result</div>
          <div className="mu-body">

            {/* Verdict Banner */}
            <div style={{ background:vs.bg, border:`1.5px solid ${vs.border}`, borderRadius:14, padding:"1rem 1.2rem", marginBottom:"1.1rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
              <div>
                <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:vs.color, marginBottom:2 }}>Verdict</div>
                <div style={{ fontSize:"1.5rem", fontWeight:800, color:vs.color, lineHeight:1 }}>{result.verdict || "Unknown"}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"0.7rem", color:"#94a3b8", marginBottom:2 }}>Risk Score</div>
                <div style={{ fontSize:"2rem", fontWeight:800, color:vs.color, lineHeight:1 }}>{result.score ?? "—"}</div>
              </div>
            </div>

            {/* URL tile */}
            <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"0.7rem 1rem", marginBottom:"1rem", fontFamily:"monospace", fontSize:"0.82rem", color:"#475569", wordBreak:"break-all" }}>
              {result.url}
            </div>

            {/* Findings */}
            <div style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#94a3b8", marginBottom:8 }}>Findings</div>
            {result.findings?.length > 0 ? (
              result.findings.map((f, i) => (
                <div key={i} className="mu-finding">
                  <span style={{ color:"#ef4444", marginTop:1 }}>⚠</span>
                  <span>{f}</span>
                </div>
              ))
            ) : (
              <div style={{ color:"#16a34a", fontSize:"0.88rem" }}>✅ No suspicious indicators found</div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
