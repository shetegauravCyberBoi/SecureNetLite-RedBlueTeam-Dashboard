import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CSRFTool() {
  const { token }  = useAuth();
  const navigate   = useNavigate();
  const abortRef   = useRef(null);

  const [rawRequest, setRawRequest] = useState("");
  const [baseUrl,    setBaseUrl]    = useState("");
  const [status,     setStatus]     = useState("idle");
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");
  const [copied,     setCopied]     = useState(false);

  if (!token) return (
    <div className="container mt-5 text-center">
      <h4 style={{ color:"#0f172a" }}>Authentication Required</h4>
      <button className="btn btn-primary mt-3" onClick={() => navigate("/login")}>Login</button>
    </div>
  );

  const runCSRFScan = () => {
    if (!rawRequest || !baseUrl) return alert("Provide Raw Request and Base URL");

    setStatus("running");
    setError("");
    setResult(null);

    const requestLine = rawRequest.split("\n")[0] || "";
    const parts = requestLine.trim().split(/\s+/);

    const method = parts[0] || "POST";
    const endpoint = parts[1] || "/demo-endpoint";

    setTimeout(() => {
      setResult({
        endpoint,
        method,
        content_type: "application/x-www-form-urlencoded",
        poc_html: `<!-- UI Preview only. No request is sent. -->
<html>
  <body>
    <form action="#" method="${method === "GET" ? "GET" : "POST"}">
      <input type="hidden" name="demo" value="preview">
      <button type="button">Submit Demo Request</button>
    </form>
    <!-- Target: ${baseUrl}${endpoint} -->
  </body>
</html>`,
      });

      setStatus("idle");
    }, 1000);
  };

  const stopScan = () => { abortRef.current?.abort(); setStatus("stopped"); };

  const copyPoC = () => {
    navigator.clipboard.writeText(result.poc_html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isRunning = status === "running";

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes fadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .csrf-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; overflow:hidden; margin-bottom:1rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .csrf-hdr  { background:#f8fafc; border-bottom:1.5px solid #f1f5f9; padding:0.65rem 1.2rem; font-size:0.75rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#64748b; }
        .csrf-body { padding:1.2rem 1.4rem; }
        .csrf-field { border:1.5px solid #e2e8f0; border-radius:12px; padding:0.7rem 1rem; font-size:0.88rem; color:#0f172a; width:100%; transition:border-color 0.15s; font-family:monospace; background:#fff; resize:vertical; }
        .csrf-field:focus { outline:none; border-color:#f87171; box-shadow:0 0 0 3px rgba(248,113,113,0.1); }
        .csrf-field:disabled { background:#f8fafc; color:#94a3b8; }
        .csrf-btn  { border:none; border-radius:12px; padding:0.7rem 1.6rem; font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.15s; color:#fff; display:inline-flex; align-items:center; gap:0.5rem; background:linear-gradient(135deg,#f87171,#dc2626); }
        .csrf-btn:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px); }
        .csrf-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .csrf-stop { background:transparent; border:1.5px solid #e2e8f0; color:#64748b; border-radius:999px; padding:0.35rem 1rem; font-size:0.82rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .csrf-stop:hover { border-color:#fecaca; color:#dc2626; }
        .csrf-status-pill { border-radius:999px; padding:0.22rem 0.75rem; font-size:0.72rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; border:1.5px solid; }
        .csrf-result { animation:fadeUp 0.3s ease; }
        .csrf-copy { background:transparent; border:1.5px solid #e2e8f0; border-radius:8px; padding:0.3rem 0.8rem; font-size:0.78rem; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.15s; }
        .csrf-copy:hover { border-color:#bfdbfe; color:#2563eb; }
      `}</style>

      {/* Title */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color:"#0f172a", fontSize:"1.6rem" }}>⚔️ CSRF Generator Console</h2>
        <p style={{ color:"#94a3b8", fontSize:"0.88rem", margin:0 }}>
          Generate cross-site request forgery proof-of-concept payloads from raw HTTP requests.
        </p>
      </div>

      {/* Raw Request */}
      <div className="csrf-card">
        <div className="csrf-hdr">📨 Raw HTTP Request</div>
        <div className="csrf-body">
          <p style={{ fontSize:"0.82rem", color:"#94a3b8", marginBottom:"0.8rem" }}>
            Paste a full HTTP request captured from Burp Suite or browser DevTools.
          </p>
          <textarea className="csrf-field" rows={8}
            placeholder={"POST /account/transfer HTTP/1.1\nHost: target.com\nContent-Type: application/x-www-form-urlencoded\n\namount=1000&to=attacker"}
            value={rawRequest}
            onChange={(e) => setRawRequest(e.target.value)}
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Base URL + Run */}
      <div className="csrf-card">
        <div className="csrf-hdr">🌐 Base URL</div>
        <div className="csrf-body">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <input className="csrf-field" style={{ flex:1, minWidth:200, resize:"none" }}
              placeholder="http://target.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCSRFScan()}
              disabled={isRunning}
            />
            <button className="csrf-btn" onClick={runCSRFScan} disabled={isRunning}>
              {isRunning
                ? <><span style={{ width:13,height:13,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }}/>Generating…</>
                : "⚡ Generate CSRF PoC"}
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"0.7rem 1.2rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:"0.8rem", boxShadow:"0 2px 8px rgba(0,0,0,0.03)" }}>
        <span style={{ fontSize:"0.75rem", color:"#94a3b8", fontWeight:700 }}>STATUS</span>
        <span className="csrf-status-pill" style={{
          background: isRunning ? "#fffbeb" : status==="stopped" ? "#fef2f2" : "#f0fdf4",
          color:       isRunning ? "#d97706" : status==="stopped" ? "#dc2626" : "#16a34a",
          borderColor: isRunning ? "#fde68a" : status==="stopped" ? "#fecaca" : "#bbf7d0",
        }}>
          {isRunning && <span style={{ width:8,height:8,border:"2px solid #d97706",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block",marginRight:5 }}/>}
          {status.toUpperCase()}
        </span>
        {isRunning && <button className="csrf-stop ms-auto" onClick={stopScan}>⛔ Stop</button>}
      </div>

      {error && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", color:"#dc2626", padding:"0.75rem 1rem", borderRadius:12, fontSize:"0.87rem", marginBottom:"1rem" }}>{error}</div>}

      {/* Result */}
      {result && (
        <div className="csrf-card csrf-result">
          <div className="csrf-hdr">📌 Generated PoC</div>
          <div className="csrf-body">

            {/* Meta tiles */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:"0.8rem", marginBottom:"1.2rem" }}>
              {[
                { label:"Endpoint",     value: result.endpoint     },
                { label:"Method",       value: result.method       },
                { label:"Content-Type", value: result.content_type },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"0.75rem 1rem" }}>
                  <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#94a3b8", marginBottom:3 }}>{label}</div>
                  <div style={{ fontWeight:700, color:"#0f172a", fontSize:"0.88rem", wordBreak:"break-all", fontFamily:"monospace" }}>{value || "—"}</div>
                </div>
              ))}
            </div>

            {/* PoC HTML */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.5rem" }}>
              <div style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#94a3b8" }}>
                PoC HTML
              </div>
              <button className="csrf-copy" onClick={copyPoC}>
                {copied ? "✅ Copied" : "📋 Copy"}
              </button>
            </div>
            <textarea className="csrf-field" rows={12}
              value={result.poc_html}
              readOnly
              style={{ background:"#0f172a", color:"#86efac", borderColor:"#1e293b", cursor:"text" }}
            />

          </div>
        </div>
      )}
    </div>
  );
}
