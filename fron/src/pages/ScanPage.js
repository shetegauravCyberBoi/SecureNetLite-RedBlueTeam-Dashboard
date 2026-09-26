// src/pages/ScanPage.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaLock, FaHeartbeat } from "react-icons/fa";
import { importAllImages } from "../utils/importAllImages";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const securityImages = importAllImages(
  require.context("../assets/security", false, /\.(png|jpe?g|webp)$/)
);

export default function ScanPage() {
  const [target,  setTarget]  = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const resultRef = useRef(null);
  const navigate  = useNavigate();
  const { user, token } = useAuth();

  // ── Dynamic API base (same pattern as Login/Register) ──────────────────
  const getApiBase = () => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return process.env.REACT_APP_API_URL || "http://localhost:8000";
    if (host.startsWith("10.0.0."))  return process.env.REACT_APP_API_URL || "http://10.0.0.1:8000";
    if (host.startsWith("192.168.")) return process.env.REACT_APP_API_URL || `http://${host}:8000`;
    return process.env.REACT_APP_API_URL || `http://${host}:8000`;
  };

  const API_BASE = getApiBase();

  useEffect(() => {
    const carouselEl = document.getElementById("carouselSecurity");
    if (carouselEl && window.bootstrap) {
      new window.bootstrap.Carousel(carouselEl, {
        interval: 3000,
        ride: "carousel",
        pause: false,
        wrap: true,
      });
    }
  }, []);

  // ── Auto-scroll to result when it arrives ──────────────────────────────
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleScan = async () => {
    if (!target.trim()) { setError("Please enter an IP or domain."); return; }
    setLoading(true);
    setError("");
    setShowRaw(false);
    // ⚠️ Do NOT reset result here — keeps previous result visible while loading

    try {
      const config = { params: { target: target.trim() } };
      if (user && token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }
      const res = await axios.get(`${API_BASE}/basic-scan`, config);
      setResult(res.data);
    } catch (err) {
      setError(
        "Baseline check failed: " +
        (err.response?.data?.detail || err.message || "Try again later.")
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Flat result shortcuts ───────────────────────────────────────────────
  const scanData        = result?.result ?? result ?? {};
  const health          = scanData?.health_score       ?? {};
  const asset           = scanData?.asset              ?? {};
  const availability    = scanData?.availability       ?? {};
  const network         = scanData?.network_exposure   ?? {};
  const findings        = scanData?.findings           ?? [];
  const recommendations = scanData?.recommendations    ?? [];
  const metadata        = scanData?.scan_metadata      ?? {};
  const ping            = availability?.ping           ?? {};

  const healthStatus = health?.status ?? "Unknown";
  const healthScore  = health?.score  ?? null;
  const healthColor  =
    healthStatus === "Healthy" ? "#16a34a" :
    healthStatus === "Warning" ? "#d97706" :
    healthStatus === "At Risk" ? "#dc2626" : "#64748b";
  const healthBg =
    healthStatus === "Healthy" ? "#f0fdf4" :
    healthStatus === "Warning" ? "#fffbeb" :
    healthStatus === "At Risk" ? "#fef2f2" : "#f8fafc";

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }

        .scan-carousel { border-radius:16px; overflow:hidden; margin-bottom:2rem; box-shadow:0 4px 24px rgba(0,0,0,0.1); }

        .scan-input-wrap { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:1.4rem 1.6rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); margin-bottom:1.5rem; }
        .scan-field { border:1.5px solid #e2e8f0; border-radius:12px; padding:0.7rem 1rem; font-size:0.92rem; color:#0f172a; transition:border-color 0.15s; width:100%; }
        .scan-field:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }

        .scan-btn-run { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; border:none; border-radius:12px; padding:0.7rem 1.6rem; font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
        .scan-btn-run:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
        .scan-btn-run:disabled { opacity:0.6; cursor:not-allowed; }

        .result-section { animation:fadeUp 0.3s ease; }
        .result-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:0.9rem; margin-bottom:1.2rem; }

        .stat-tile { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:1rem 1.2rem; transition:box-shadow 0.15s; }
        .stat-tile:hover { box-shadow:0 4px 16px rgba(0,0,0,0.07); }
        .stat-label { font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
        .stat-value { font-size:1.05rem; font-weight:700; color:#0f172a; word-break:break-all; }

        .detail-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; margin-bottom:0.9rem; overflow:hidden; }
        .detail-card-header { background:#f8fafc; border-bottom:1px solid #f1f5f9; padding:0.65rem 1.1rem; font-size:0.78rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#64748b; }
        .detail-card-body { padding:1rem 1.1rem; }

        .port-pill { display:inline-block; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; border-radius:8px; padding:0.25rem 0.65rem; font-size:0.8rem; font-weight:600; margin:0.2rem; font-family:monospace; }
        .port-pill.risk { background:#fef2f2; border-color:#fecaca; color:#dc2626; }
        .port-pill.mgmt { background:#fffbeb; border-color:#fde68a; color:#d97706; }

        .ping-block { background:#0f172a; border-radius:10px; padding:0.9rem 1rem; font-family:monospace; font-size:0.78rem; color:#86efac; white-space:pre-wrap; max-height:180px; overflow-y:auto; }

        .finding-item { display:flex; align-items:flex-start; gap:0.6rem; padding:0.5rem 0; border-bottom:1px solid #f1f5f9; font-size:0.85rem; color:#374151; }
        .finding-item:last-child { border-bottom:none; }

        .rec-item { display:flex; align-items:flex-start; gap:0.6rem; padding:0.45rem 0; border-bottom:1px solid #f1f5f9; font-size:0.83rem; color:#475569; }
        .rec-item:last-child { border-bottom:none; }

        .raw-toggle { background:transparent; border:1.5px solid #e2e8f0; border-radius:8px; padding:0.35rem 0.9rem; font-size:0.78rem; color:#94a3b8; cursor:pointer; transition:all 0.15s; }
        .raw-toggle:hover { border-color:#cbd5e1; color:#64748b; }

        .locked-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:1.4rem 1.6rem; transition:all 0.18s; }
        .locked-card:hover { border-color:#cbd5e1; box-shadow:0 4px 20px rgba(0,0,0,0.07); transform:translateY(-2px); }
        .locked-title { font-weight:700; font-size:0.95rem; color:#0f172a; margin-bottom:4px; }
        .locked-desc  { font-size:0.82rem; color:#94a3b8; margin-bottom:1rem; }
        .locked-btn { border-radius:999px; padding:0.45rem 1.2rem; font-size:0.82rem; font-weight:600; border:1.5px solid; background:transparent; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center; gap:0.4rem; }
      `}</style>

      {/* ── Carousel ── */}
      <div id="carouselSecurity" className="carousel slide scan-carousel"
        data-bs-ride="carousel" data-bs-interval="3000">
        <div className="carousel-inner">
          {securityImages.map((img, idx) => (
            <div className={`carousel-item ${idx === 0 ? "active" : ""}`} key={idx}>
              <img src={img} className="d-block w-100" alt={`Security Slide ${idx + 1}`}
                style={{ height:"260px", objectFit:"cover" }} />
            </div>
          ))}
        </div>
        <button className="carousel-control-prev" type="button"
          data-bs-target="#carouselSecurity" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" />
        </button>
        <button className="carousel-control-next" type="button"
          data-bs-target="#carouselSecurity" data-bs-slide="next">
          <span className="carousel-control-next-icon" />
        </button>
      </div>

      {/* ── Page Title ── */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color:"#0f172a", fontSize:"1.6rem" }}>
          <FaHeartbeat className="me-2 text-warning" />
          {user ? "SOC Baseline Health Check" : "Quick Baseline Health Check"}
          {!user && (
            <span className="badge ms-2 rounded-pill"
              style={{ background:"#f1f5f9", color:"#94a3b8", fontSize:"0.72rem", fontWeight:600 }}>
              Guest Mode
            </span>
          )}
        </h2>
        <p style={{ color:"#94a3b8", fontSize:"0.88rem", margin:0 }}>
          Fast posture assessment to identify exposure, availability, and hygiene issues before deeper scans.
        </p>
      </div>

      {/* ── Input Card ── */}
      <div className="scan-input-wrap">
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <input
            type="text"
            className="scan-field"
            placeholder="Enter IP or domain  (e.g. 8.8.8.8 or example.com)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            style={{ flex:1, minWidth:200 }}
          />
          <button className="scan-btn-run" onClick={handleScan} disabled={loading}>
            {loading
              ? <><span style={{ display:"inline-block", width:13, height:13, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:8, verticalAlign:"middle" }} />Running…</>
              : "⚡ Run Baseline Check"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 border-0 shadow-sm" style={{ fontSize:"0.88rem" }}>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="result-section" ref={resultRef}>

          {/* Health Score Banner */}
          <div style={{
            background: healthBg, border:`1.5px solid ${healthColor}33`,
            borderRadius:16, padding:"1.1rem 1.4rem", marginBottom:"1.2rem",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:"0.8rem"
          }}>
            <div>
              <div style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:healthColor, marginBottom:2 }}>
                Health Assessment
              </div>
              <div style={{ fontSize:"1.5rem", fontWeight:800, color:healthColor, lineHeight:1 }}>
                {healthStatus}
              </div>
              <div style={{ fontSize:"0.78rem", color:"#94a3b8", marginTop:3 }}>
                {asset.target} · {metadata.start_time}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.72rem", color:"#94a3b8", marginBottom:2 }}>Health Score</div>
              <div style={{ fontSize:"2rem", fontWeight:800, color:healthColor, lineHeight:1 }}>
                {healthScore ?? "—"}
                <span style={{ fontSize:"0.9rem", color:"#94a3b8" }}> / 100</span>
              </div>
            </div>
          </div>

          {/* Stat Tiles */}
          <div className="result-grid">
            {[
              { label:"Hostname",       value: asset.hostname || "Unresolved" },
              { label:"DNS Resolved",   value: asset.dns_resolved ? "✅ Yes" : "❌ No",   color: asset.dns_resolved ? "#16a34a" : "#dc2626" },
              { label:"Reachable",      value: availability.reachable ? "✅ Yes" : "❌ No", color: availability.reachable ? "#16a34a" : "#dc2626" },
              { label:"Open Ports",     value: network.open_ports?.length ?? 0 },
              { label:"High Risk Ports",value: network.high_risk_ports?.length > 0 ? `⚠️ ${network.high_risk_ports.length}` : "✅ None", color: network.high_risk_ports?.length > 0 ? "#dc2626" : "#16a34a" },
              { label:"Duration",       value: `${metadata.duration_seconds ?? "—"}s` },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-tile">
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={{ color: color || "#0f172a", fontSize:"0.88rem" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Network Exposure */}
          <div className="detail-card">
            <div className="detail-card-header">🔌 Network Exposure</div>
            <div className="detail-card-body">
              {network.open_ports?.length > 0 ? (
                <>
                  <div style={{ fontSize:"0.75rem", color:"#94a3b8", marginBottom:6, fontWeight:600 }}>Open Ports</div>
                  <div className="mb-3">
                    {network.open_ports.map((p, i) => {
                      const portNum = parseInt(String(p).split("/")[0]);
                      const isRisk  = network.high_risk_ports?.map(Number).includes(portNum);
                      const isMgmt  = network.management_ports?.map(Number).includes(portNum);
                      return <span key={i} className={`port-pill ${isRisk ? "risk" : isMgmt ? "mgmt" : ""}`}>{p}</span>;
                    })}
                  </div>
                </>
              ) : (
                <p style={{ color:"#94a3b8", fontSize:"0.85rem", margin:0 }}>No open ports detected</p>
              )}
              {network.high_risk_ports?.length > 0 && (
                <div className="mb-2">
                  <div style={{ fontSize:"0.75rem", color:"#dc2626", marginBottom:4, fontWeight:600 }}>High Risk Ports</div>
                  {network.high_risk_ports.map((p, i) => <span key={i} className="port-pill risk">{p}</span>)}
                </div>
              )}
              {network.management_ports?.length > 0 && (
                <div>
                  <div style={{ fontSize:"0.75rem", color:"#d97706", marginBottom:4, fontWeight:600 }}>Management Ports</div>
                  {network.management_ports.map((p, i) => <span key={i} className="port-pill mgmt">{p}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* Ping Output */}
          {ping.details && (
            <div className="detail-card">
              <div className="detail-card-header">📡 Ping Output</div>
              <div className="detail-card-body" style={{ padding:"0.8rem 1rem" }}>
                <div className="ping-block">{ping.details}</div>
              </div>
            </div>
          )}

          {/* Findings */}
          <div className="detail-card">
            <div className="detail-card-header">⚠️ Findings</div>
            <div className="detail-card-body">
              {findings.length > 0
                ? findings.map((f, i) => (
                    <div key={i} className="finding-item">
                      <span style={{ color:"#ef4444", marginTop:1 }}>•</span>
                      <span>{f}</span>
                    </div>
                  ))
                : <div style={{ color:"#16a34a", fontSize:"0.88rem" }}>✅ No security issues detected</div>
              }
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="detail-card">
              <div className="detail-card-header">💡 Recommendations</div>
              <div className="detail-card-body">
                {recommendations.map((r, i) => (
                  <div key={i} className="rec-item">
                    <span style={{ color:"#3b82f6", marginTop:1, flexShrink:0 }}>→</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scan Metadata */}
          <div className="detail-card">
            <div className="detail-card-header">🕐 Scan Metadata</div>
            <div className="detail-card-body">
              <div className="result-grid" style={{ marginBottom:0 }}>
                {[
                  { label:"Start Time", value: metadata.start_time },
                  { label:"End Time",   value: metadata.end_time },
                  { label:"Duration",   value: `${metadata.duration_seconds}s` },
                  { label:"Scanned By", value: scanData.scanned_by },
                ].map(({ label, value }) => (
                  <div key={label} className="stat-tile" style={{ padding:"0.7rem 1rem" }}>
                    <div className="stat-label">{label}</div>
                    <div className="stat-value" style={{ fontSize:"0.82rem" }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions Row */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
            {result.report_pdf && (
              <a href={`${API_BASE}${result.report_pdf}`}
                className="btn btn-success rounded-pill px-4 fw-semibold"
                style={{ fontSize:"0.88rem" }}
                download>
                📄 Download PDF Report
              </a>
            )}
            <button className="raw-toggle ms-auto" onClick={() => setShowRaw(!showRaw)}>
              {showRaw ? "▲ Hide Raw JSON" : "▼ Show Raw JSON"}
            </button>
          </div>

          {showRaw && (
            <pre style={{
              background:"#0f172a", color:"#86efac", borderRadius:12,
              padding:"1rem", fontSize:"0.75rem", marginTop:"0.8rem",
              maxHeight:320, overflowY:"auto", fontFamily:"monospace"
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}

        </div>
      )}

      {/* ── Locked Features (guest only) ── */}
      {!user && (
        <div className="mt-5">
          <div style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#94a3b8", marginBottom:"1rem" }}>
            🔐 Unlock Advanced SOC Capabilities
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="locked-card">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ fontSize:"1.3rem" }}>🔬</span>
                  <div className="locked-title">Full Exposure Scan</div>
                  <span style={{ fontSize:"0.65rem", fontWeight:700, background:"#f1f5f9", color:"#94a3b8", borderRadius:999, padding:"0.15rem 0.55rem" }}>Login Required</span>
                </div>
                <div className="locked-desc">Deep exposure analysis with vulnerability correlation and intelligence enrichment.</div>
                <button className="locked-btn" style={{ borderColor:"#fde68a", color:"#d97706" }}
                  onClick={() => navigate("/login")}
                  onMouseEnter={e => e.currentTarget.style.background = "#fffbeb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <FaLock size={11} /> Sign in to Use
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <div className="locked-card">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ fontSize:"1.3rem" }}>⚡</span>
                  <div className="locked-title">Web Security Audit</div>
                  <span style={{ fontSize:"0.65rem", fontWeight:700, background:"#f1f5f9", color:"#94a3b8", borderRadius:999, padding:"0.15rem 0.55rem" }}>Login Required</span>
                </div>
                <div className="locked-desc">Crawl and audit web applications for configuration and security issues.</div>
                <button className="locked-btn" style={{ borderColor:"#bae6fd", color:"#0284c7" }}
                  onClick={() => navigate("/login")}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <FaLock size={11} /> Sign in to Use
                </button>
              </div>
            </div>
          </div>
          <div className="text-center mt-4" style={{ fontSize:"0.82rem", color:"#94a3b8" }}>
            🔓 Access full SOC workflows by{" "}
            <a href="/login" style={{ color:"#3b82f6" }}>signing in</a> or{" "}
            <a href="/register" style={{ color:"#3b82f6" }}>creating an account</a>.
          </div>
        </div>
      )}

    </div>
  );
}
