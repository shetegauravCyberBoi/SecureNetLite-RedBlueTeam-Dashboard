import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function FullScanPage() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [target,     setTarget]     = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [activeTab,  setActiveTab]  = useState("overview");
  const resultRef = useRef(null);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // ── Auto-scroll to result when it arrives ─────────────────────────────
  useEffect(() => {
    if (scanResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [scanResult]);

  // UI-only preview mode.
  // No backend request or real network scan is performed.
  const handleNetworkScan = async () => {
    if (!target.trim()) {
      setError("Please enter a valid IP or domain.");
      return;
    }

    setLoading(true);
    setError("");
    setActiveTab("overview");

    const targetValue = target.trim();

    setTimeout(() => {
      setScanResult({
        status: "success",
        scan_result: {
          modules: {
            ping: {
              status: "Reachable",
              latency_ms: 21,
            },
            nmap: {
              status: "Completed",
              ports: [
                { port: 80, protocol: "tcp", service: "http", state: "open" },
                { port: 443, protocol: "tcp", service: "https", state: "open" },
              ],
            },
            nuclei: [
              {
                name: "Demo informational finding",
                severity: "info",
                matched: true,
              },
              {
                name: "Security header review",
                severity: "low",
                matched: true,
              },
            ],
            shodan: {
              status: "Demo data",
              message: "External intelligence lookup disabled in UI preview.",
            },
          },
          threat_summary: {
            level: "Low",
            score: 18,
            summary: "Simulated security assessment for UI demonstration.",
          },
        },
        target: targetValue,
        mode: "UI Preview",
      });

      setLoading(false);
    }, 1500);
  };

  const handleDownload = () => {
    setError("Report download is unavailable in UI preview mode.");
  };

  // ── shortcuts ──────────────────────────────────────────────────────────
  const sr      = scanResult?.scan_result;
  const modules = sr?.modules ?? {};
  const ping    = modules.ping    ?? {};
  const nmap    = modules.nmap    ?? {};
  const nuclei  = modules.nuclei  ?? [];
  const shodan  = modules.shodan  ?? {};
  const threat  = sr?.threat_summary ?? {};
  const ports   = nmap.ports ?? [];

  const threatColor = (level) => {
    const l = (level || "").toLowerCase();
    if (l === "critical") return "#dc2626";
    if (l === "high")     return "#d97706";
    if (l === "medium")   return "#ca8a04";
    if (l === "low")      return "#2563eb";
    return "#16a34a";
  };
  const threatBg = (level) => {
    const l = (level || "").toLowerCase();
    if (l === "critical") return "#fef2f2";
    if (l === "high")     return "#fffbeb";
    if (l === "medium")   return "#fefce8";
    if (l === "low")      return "#eff6ff";
    return "#f0fdf4";
  };
  const threatBorder = (level) => {
    const l = (level || "").toLowerCase();
    if (l === "critical") return "#fecaca";
    if (l === "high")     return "#fde68a";
    if (l === "medium")   return "#fef08a";
    if (l === "low")      return "#bfdbfe";
    return "#bbf7d0";
  };
  const severityColor = (sev) => {
    const s = (sev || "").toLowerCase();
    if (s === "critical") return "#dc2626";
    if (s === "high")     return "#d97706";
    if (s === "medium")   return "#ca8a04";
    if (s === "low")      return "#2563eb";
    return "#64748b";
  };
  const severityBg = (sev) => {
    const s = (sev || "").toLowerCase();
    if (s === "critical") return "#fef2f2";
    if (s === "high")     return "#fffbeb";
    if (s === "medium")   return "#fefce8";
    if (s === "low")      return "#eff6ff";
    return "#f8fafc";
  };

  const TABS = [
    { id: "overview", label: "📋 Overview" },
    { id: "nmap",     label: "🔌 Ports"    },
    { id: "nuclei",   label: "🧬 Nuclei",  badge: nuclei.filter(n => !n.error).length },
    { id: "shodan",   label: "🌐 Shodan"   },
    { id: "ping",     label: "📡 Ping"     },
  ];

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        .fs-input-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:1.4rem 1.6rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); margin-bottom:1.5rem; }
        .fs-field { border:1.5px solid #e2e8f0; border-radius:12px; padding:0.7rem 1rem; font-size:0.92rem; color:#0f172a; transition:border-color 0.15s; width:100%; }
        .fs-field:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }

        .fs-btn-run { background:linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; border:none; border-radius:12px; padding:0.7rem 1.6rem; font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
        .fs-btn-run:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
        .fs-btn-run:disabled { opacity:0.6; cursor:not-allowed; }

        .fs-btn-dl { background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; border:none; border-radius:12px; padding:0.7rem 1.4rem; font-weight:700; font-size:0.88rem; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
        .fs-btn-dl:hover { filter:brightness(1.08); transform:translateY(-1px); }

        .fs-result { animation:fadeUp 0.3s ease; }
        .fs-result-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:1.6rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); }

        .fs-threat-banner { border-radius:14px; padding:1.1rem 1.4rem; margin-bottom:1.4rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.8rem; }

        .fs-tab-bar { display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:1.3rem; border-bottom:1.5px solid #f1f5f9; padding-bottom:0.7rem; }
        .fs-tab-btn { background:transparent; border:1.5px solid #e2e8f0; color:#94a3b8; border-radius:999px; padding:0.35rem 0.9rem; font-size:0.83rem; font-weight:500; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:0.35rem; }
        .fs-tab-btn:hover { border-color:#cbd5e1; color:#475569; }
        .fs-tab-btn.active { background:#3b82f6; color:#fff; border-color:#3b82f6; font-weight:700; }
        .fs-tab-badge { background:#ef4444; color:#fff; border-radius:999px; padding:0 0.4rem; font-size:0.7rem; font-weight:700; }

        .fs-stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:0.85rem; margin-bottom:1.2rem; }
        .fs-stat-tile { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:0.9rem 1.1rem; transition:box-shadow 0.15s; }
        .fs-stat-tile:hover { box-shadow:0 4px 16px rgba(0,0,0,0.07); }
        .fs-stat-label { font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
        .fs-stat-value { font-size:0.96rem; font-weight:700; color:#0f172a; word-break:break-all; }

        .fs-detail-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; margin-bottom:0.9rem; overflow:hidden; }
        .fs-detail-header { background:#f8fafc; border-bottom:1px solid #f1f5f9; padding:0.6rem 1.1rem; font-size:0.75rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#64748b; }
        .fs-detail-body { padding:1rem 1.1rem; }

        .fs-table { width:100%; border-collapse:collapse; font-size:0.85rem; }
        .fs-table th { background:#f8fafc; color:#64748b; text-align:left; padding:0.55rem 0.9rem; font-weight:700; font-size:0.75rem; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1.5px solid #e2e8f0; }
        .fs-table td { padding:0.6rem 0.9rem; border-bottom:1px solid #f1f5f9; color:#374151; vertical-align:top; }
        .fs-table tr:last-child td { border-bottom:none; }
        .fs-table tr:hover td { background:#f8fafc; }

        .fs-badge { border-radius:999px; padding:0.2rem 0.65rem; font-size:0.72rem; font-weight:700; text-transform:uppercase; border:1px solid; }

        .fs-terminal { background:#0f172a; border-radius:12px; padding:1rem; font-family:monospace; font-size:0.78rem; color:#86efac; white-space:pre-wrap; max-height:220px; overflow-y:auto; }

        .fs-host-pill { display:inline-block; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; border-radius:8px; padding:0.2rem 0.65rem; font-family:monospace; font-size:0.8rem; margin:0.2rem; }

        .fs-vuln-pill { display:inline-block; background:#fef2f2; border:1px solid #fecaca; color:#dc2626; border-radius:999px; padding:0.2rem 0.7rem; font-size:0.78rem; font-weight:600; margin:0.2rem; }

        .fs-banner-block { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:0.9rem 1rem; font-family:monospace; font-size:0.8rem; color:#475569; white-space:pre-wrap; max-height:160px; overflow-y:auto; }

        .fs-empty { text-align:center; color:#94a3b8; padding:2.5rem 1rem; font-size:0.9rem; }

        .fs-error { background:#fef2f2; border:1.5px solid #fecaca; color:#dc2626; padding:0.8rem 1rem; border-radius:12px; font-size:0.88rem; margin-bottom:1.2rem; }
      `}</style>

      {/* ── Page Title ── */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color:"#0f172a", fontSize:"1.6rem" }}>
          🔬 Full Scan — Network Threat Analysis
        </h2>
        <p style={{ color:"#94a3b8", fontSize:"0.88rem", margin:0 }}>
          Deep service discovery, vulnerability detection, and threat intelligence
          aggregation across Nmap, Nuclei, and Shodan.
        </p>
      </div>

      {error && <div className="fs-error">{error}</div>}

      {/* ── Input Card ── */}
      <div className="fs-input-card">
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <input
            type="text"
            className="fs-field"
            placeholder="Enter IP or domain  (e.g. 44.228.249.3)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNetworkScan()}
            style={{ flex:1, minWidth:200 }}
          />
          <button className="fs-btn-run" onClick={handleNetworkScan} disabled={loading}>
            {loading ? (
              <><span style={{ display:"inline-block", width:13, height:13, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:8, verticalAlign:"middle" }} />Scanning…</>
            ) : "🔍 Start Full Scan"}
          </button>
          {scanResult?.report_pdf && (
            <button className="fs-btn-dl" onClick={handleDownload}>
              ⬇️ Download PDF
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {scanResult && sr && (
        <div className="fs-result" ref={resultRef}>
          <div className="fs-result-card">

            {/* Threat Banner */}
            <div className="fs-threat-banner" style={{
              background: threatBg(threat.threat_level),
              border: `1.5px solid ${threatBorder(threat.threat_level)}`,
            }}>
              <div>
                <div style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:threatColor(threat.threat_level), marginBottom:2 }}>
                  Threat Level
                </div>
                <div style={{ fontSize:"1.6rem", fontWeight:800, color:threatColor(threat.threat_level), lineHeight:1 }}>
                  {threat.threat_level ?? "Unknown"}
                </div>
                {threat.details && (
                  <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:4 }}>
                    {threat.details}
                  </div>
                )}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"0.72rem", color:"#94a3b8", marginBottom:2 }}>Target</div>
                <div style={{ fontSize:"1.1rem", fontWeight:700, color:"#0f172a" }}>{sr.target}</div>
                <div style={{ fontSize:"0.75rem", color:"#94a3b8", marginTop:2 }}>
                  Scanned by <strong style={{ color:"#475569" }}>{sr.scanned_by}</strong>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="fs-tab-bar">
              {TABS.map(tab => (
                <button key={tab.id}
                  className={`fs-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                  {tab.badge > 0 && <span className="fs-tab-badge">{tab.badge}</span>}
                </button>
              ))}
            </div>

            {/* ══ OVERVIEW ══ */}
            {activeTab === "overview" && (
              <div>
                <div className="fs-stat-grid">
                  {[
                    { label:"Target",          value: sr.target },
                    { label:"Hostname",         value: sr.server_info?.hostname || "Unresolved" },
                    { label:"Detected OS",      value: sr.server_info?.os !== "Unknown" ? sr.server_info?.os : "Not detected" },
                    { label:"Reachable",        value: ping.status === "reachable" ? "✅ Yes" : "❌ No",
                      color: ping.status === "reachable" ? "#16a34a" : "#dc2626" },
                    { label:"Open Ports",       value: ports.length },
                    { label:"Nuclei Findings",  value: nuclei.filter(n => !n.error).length,
                      color: nuclei.filter(n => !n.error).length > 0 ? "#d97706" : "#16a34a" },
                    { label:"Known CVEs",       value: shodan.error ? "Unavailable" : shodan.vulns?.length > 0 ? shodan.vulns.length : "None",
                      color: shodan.vulns?.length > 0 ? "#dc2626" : "#16a34a" },
                    { label:"Organisation",     value: shodan.org || "—" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="fs-stat-tile">
                      <div className="fs-stat-label">{label}</div>
                      <div className="fs-stat-value" style={color ? { color } : {}}>{value}</div>
                    </div>
                  ))}
                </div>
                {nmap.banner && nmap.banner !== "No banner info" && (
                  <div className="fs-detail-card">
                    <div className="fs-detail-header">📡 Service Banner</div>
                    <div className="fs-detail-body" style={{ padding:"0.8rem 1rem" }}>
                      <div className="fs-banner-block">{nmap.banner}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PORTS ══ */}
            {activeTab === "nmap" && (
              <div>
                {ports.length > 0 ? (
                  <div style={{ overflowX:"auto" }}>
                    <table className="fs-table">
                      <thead>
                        <tr><th>Port</th><th>Service</th><th>State</th></tr>
                      </thead>
                      <tbody>
                        {ports.map((p, i) => (
                          <tr key={i}>
                            <td><code style={{ color:"#2563eb", fontWeight:600, fontSize:"0.85rem" }}>{p.port}</code></td>
                            <td style={{ color:"#374151" }}>{p.service || "unknown"}</td>
                            <td>
                              <span className="fs-badge" style={{
                                background:  p.state === "open" ? "#f0fdf4" : "#f8fafc",
                                color:       p.state === "open" ? "#16a34a" : "#64748b",
                                borderColor: p.state === "open" ? "#bbf7d0" : "#e2e8f0",
                              }}>
                                {p.state}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="fs-empty">No open ports detected</div>
                )}
              </div>
            )}

            {/* ══ NUCLEI ══ */}
            {activeTab === "nuclei" && (
              <div>
                {nuclei.length > 0 && !nuclei[0]?.error ? (
                  <div>
                    <div style={{ overflowX:"auto" }}>
                      <table className="fs-table">
                        <thead>
                          <tr><th>Severity</th><th>Template ID</th><th>Name</th><th>Matched At</th></tr>
                        </thead>
                        <tbody>
                          {nuclei.map((n, i) => (
                            <tr key={i}>
                              <td>
                                <span className="fs-badge" style={{
                                  background: severityBg(n.severity),
                                  color: severityColor(n.severity),
                                  borderColor: `${severityColor(n.severity)}44`,
                                }}>
                                  {n.severity || "info"}
                                </span>
                              </td>
                              <td><code style={{ color:"#64748b", fontSize:"0.78rem" }}>{n["template-id"]}</code></td>
                              <td style={{ color:"#0f172a", fontWeight:500 }}>{n.name}</td>
                              <td><code style={{ color:"#94a3b8", fontSize:"0.75rem" }}>{n["matched-at"]}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {nuclei.some(n => n.description) && (
                      <div style={{ marginTop:"1rem" }}>
                        {nuclei.filter(n => n.description).map((n, i) => (
                          <div key={i} style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"0.7rem 1rem", marginBottom:"0.5rem", fontSize:"0.82rem", color:"#64748b" }}>
                            <strong style={{ color:"#0f172a" }}>{n.name}</strong>
                            <span style={{ marginLeft:8 }}>{n.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : nuclei[0]?.error ? (
                  <div className="fs-empty">Nuclei error: {nuclei[0].error}</div>
                ) : (
                  <div className="fs-empty">✅ No vulnerabilities detected by Nuclei</div>
                )}
              </div>
            )}

            {/* ══ SHODAN ══ */}
            {activeTab === "shodan" && (
              <div>
                {shodan.error ? (
                  <div className="fs-empty">Shodan unavailable: {shodan.error}</div>
                ) : (
                  <div>
                    <div className="fs-stat-grid">
                      {[
                        { label:"IP",           value: shodan.ip   || "—" },
                        { label:"Organisation", value: shodan.org  || "—" },
                        { label:"OS",           value: shodan.os   || "Not detected" },
                        { label:"Open Ports",   value: shodan.ports?.join(", ") || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="fs-stat-tile">
                          <div className="fs-stat-label">{label}</div>
                          <div className="fs-stat-value">{value}</div>
                        </div>
                      ))}
                    </div>
                    {shodan.hostnames?.length > 0 && (
                      <div className="fs-detail-card">
                        <div className="fs-detail-header">🌐 Hostnames</div>
                        <div className="fs-detail-body">
                          {shodan.hostnames.map((h, i) => (
                            <span key={i} className="fs-host-pill">{h}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="fs-detail-card">
                      <div className="fs-detail-header" style={{ color: shodan.vulns?.length > 0 ? "#dc2626" : "#64748b" }}>
                        ⚠️ Known CVEs {shodan.vulns?.length > 0 ? `(${shodan.vulns.length})` : ""}
                      </div>
                      <div className="fs-detail-body">
                        {shodan.vulns?.length > 0 ? (
                          shodan.vulns.map((v, i) => (
                            <span key={i} className="fs-vuln-pill">{v}</span>
                          ))
                        ) : (
                          <div style={{ color:"#16a34a", fontSize:"0.88rem" }}>
                            ✅ No known CVEs in Shodan database
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PING ══ */}
            {activeTab === "ping" && (
              <div>
                <div className="fs-stat-grid" style={{ marginBottom:"1rem" }}>
                  <div className="fs-stat-tile">
                    <div className="fs-stat-label">Status</div>
                    <div className="fs-stat-value" style={{ color: ping.status === "reachable" ? "#16a34a" : "#dc2626" }}>
                      {ping.status === "reachable" ? "✅ Reachable" : "❌ Unreachable"}
                    </div>
                  </div>
                  <div className="fs-stat-tile">
                    <div className="fs-stat-label">Target</div>
                    <div className="fs-stat-value">{ping.target || sr.target}</div>
                  </div>
                </div>
                {ping.details && (
                  <div className="fs-detail-card">
                    <div className="fs-detail-header">📡 Ping Output</div>
                    <div className="fs-detail-body" style={{ padding:"0.8rem 1rem" }}>
                      <div className="fs-terminal">{ping.details}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
