import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ZAPScanPage = () => {
  const { token } = useAuth();
  const [targetUrl,          setTargetUrl]          = useState("");
  const [loading,            setLoading]            = useState(false);
  const [scanResult,         setScanResult]         = useState(null);
  const [error,              setError]              = useState(null);
  const [crawlChecked,       setCrawlChecked]       = useState(true);
  const [activeScanChecked,  setActiveScanChecked]  = useState(false);

  if (!token) return <Navigate to="/login" />;

  const sanitizeFilename = (url) =>
    url.replace(/\W+/g, "_").replace(/^_+|_+$/g, "");

  const handleScan = async () => {
    if (!targetUrl.startsWith("http")) {
      setError("Please enter a valid URL starting with http or https.");
      return;
    }

    if (!crawlChecked && !activeScanChecked) {
      setError("Please select at least one scan option.");
      return;
    }

    setLoading(true);
    setError(null);
    setScanResult(null);

    // UI-only preview mode: no backend/API request is performed.
    setTimeout(() => {
      setScanResult({
        status: "success",
        message: "Demo scan completed successfully.",
        target: targetUrl,
        scan_type:
          crawlChecked && activeScanChecked
            ? "Spider + Active Scan"
            : crawlChecked
            ? "Spider / Crawl"
            : "Active Scan",
        alerts: [],
      });

      setLoading(false);
    }, 1200);
  };

  // ── result shortcuts ──────────────────────────────────────────────────────
  const sr           = scanResult;
  const urls         = sr?.urls         ?? sr?.discovered_urls         ?? [];
  const alerts       = sr?.alerts       ?? sr?.passive_alerts          ?? [];
  const riskSummary  = sr?.risk_summary ?? {};
  const cveRefs      = sr?.cve_references ?? [];
  const urlCount     = sr?.url_count    ?? sr?.discovered_url_count    ?? urls.length;
  const alertCount   = sr?.alert_count  ?? sr?.passive_alert_count     ?? alerts.length;
  const scanComplete = sr?.scan_completed;

  const riskColor = (level) => {
    const l = (level || "").toLowerCase();
    if (l === "high"   || l === "critical") return { color:"#dc2626", bg:"#fef2f2", border:"#fecaca" };
    if (l === "medium")                     return { color:"#d97706", bg:"#fffbeb", border:"#fde68a" };
    if (l === "low")                        return { color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" };
    return                                         { color:"#64748b", bg:"#f8fafc", border:"#e2e8f0" };
  };

  const severityColor = (sev) => {
    const s = (sev || "").toLowerCase();
    if (s === "high"   || s === "critical") return { color:"#dc2626", bg:"#fef2f2", border:"#fecaca" };
    if (s === "medium")                     return { color:"#d97706", bg:"#fffbeb", border:"#fde68a" };
    if (s === "low")                        return { color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" };
    return                                         { color:"#64748b", bg:"#f8fafc", border:"#e2e8f0" };
  };

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── Input card ── */
        .zap-input-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.4rem 1.6rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          margin-bottom: 1.2rem;
        }
        .zap-field {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.7rem 1rem;
          font-size: 0.92rem;
          color: #0f172a;
          width: 100%;
          transition: border-color 0.15s;
          background: #fff;
        }
        .zap-field:focus {
          outline: none;
          border-color: #f87171;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.12);
        }

        /* ── Option toggles ── */
        .zap-option-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8rem;
          margin-bottom: 1.2rem;
        }
        @media (max-width:500px) { .zap-option-grid { grid-template-columns: 1fr; } }
        .zap-option-tile {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 1rem 1.1rem;
          cursor: pointer;
          transition: all 0.15s;
          user-select: none;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .zap-option-tile:hover { border-color: #cbd5e1; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .zap-option-tile.selected-crawl  { border-color: #2563eb; background: #eff6ff; }
        .zap-option-tile.selected-attack { border-color: #dc2626; background: #fef2f2; }
        .zap-option-check {
          width: 18px; height: 18px;
          border-radius: 5px;
          border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
          transition: all 0.15s;
          font-size: 0.7rem;
        }
        .zap-option-check.checked-blue  { background: #2563eb; border-color: #2563eb; color: #fff; }
        .zap-option-check.checked-red   { background: #dc2626; border-color: #dc2626; color: #fff; }

        /* ── Coverage card ── */
        .zap-coverage-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 1.2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .zap-coverage-header {
          background: #f8fafc;
          border-bottom: 1.5px solid #f1f5f9;
          padding: 0.65rem 1.2rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #64748b;
        }
        .zap-coverage-body { padding: 1rem 1.2rem; }
        .zap-coverage-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.35rem 0;
          border-bottom: 1px solid #f8fafc;
          font-size: 0.85rem;
          color: #374151;
        }
        .zap-coverage-item:last-child { border-bottom: none; }

        /* ── Run button ── */
        .zap-run-btn {
          width: 100%;
          padding: 0.8rem;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #f87171, #dc2626);
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .zap-run-btn:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(220,38,38,0.25); }
        .zap-run-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* ── Loading state ── */
        .zap-loading-card {
          background: #fff;
          border: 1.5px solid #fde68a;
          border-radius: 16px;
          padding: 1.8rem;
          text-align: center;
          margin-top: 1.2rem;
          animation: fadeUp 0.3s ease;
        }
        .zap-loading-dot {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          margin: 0 3px;
          animation: pulse 1.2s ease-in-out infinite;
        }
        .zap-loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .zap-loading-dot:nth-child(3) { animation-delay: 0.4s; }

        /* ── Error ── */
        .zap-error {
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          color: #dc2626;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-size: 0.87rem;
          margin-top: 1rem;
        }

        /* ── Results ── */
        .zap-result { animation: fadeUp 0.3s ease; margin-top: 1.2rem; }

        .zap-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px,1fr));
          gap: 0.85rem;
          margin-bottom: 1.2rem;
        }
        .zap-stat-tile {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.9rem 1.1rem;
          transition: box-shadow 0.15s;
        }
        .zap-stat-tile:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .zap-stat-label { font-size: 0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
        .zap-stat-value { font-size: 1rem; font-weight:700; color:#0f172a; }

        .zap-detail-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 0.9rem;
        }
        .zap-detail-header {
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
          padding: 0.6rem 1.1rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .zap-detail-body { padding: 1rem 1.1rem; }

        .zap-table { width:100%; border-collapse:collapse; font-size:0.84rem; }
        .zap-table th {
          background: #f8fafc;
          color: #64748b;
          text-align: left;
          padding: 0.5rem 0.9rem;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-bottom: 1.5px solid #e2e8f0;
        }
        .zap-table td {
          padding: 0.55rem 0.9rem;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
          vertical-align: top;
        }
        .zap-table tr:last-child td { border-bottom: none; }
        .zap-table tr:hover td { background: #f8fafc; }

        .zap-badge {
          border-radius: 999px;
          padding: 0.18rem 0.6rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid;
          white-space: nowrap;
        }

        .zap-url-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0;
          border-bottom: 1px solid #f8fafc;
          font-size: 0.8rem;
          font-family: monospace;
          color: #2563eb;
          word-break: break-all;
        }
        .zap-url-item:last-child { border-bottom: none; }

        .zap-cve-pill {
          display: inline-block;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 999px;
          padding: 0.18rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 600;
          margin: 0.2rem;
        }

        .zap-dl-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 0.6rem 1.3rem;
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer;
        }
        .zap-dl-btn:hover { filter: brightness(1.07); transform: translateY(-1px); color:#fff; text-decoration:none; }

        .zap-warning-bar {
          background: #fffbeb;
          border: 1.5px solid #fde68a;
          border-radius: 10px;
          padding: 0.6rem 1rem;
          font-size: 0.8rem;
          color: #92400e;
          margin-top: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .count-badge {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          padding: 0.1rem 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
        }
      `}</style>

      {/* ── Page Title ── */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: "#0f172a", fontSize: "1.6rem" }}>
          🕷️ ZAP Web Security Scanner
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>
          Offensive & baseline web application security assessment via OWASP ZAP.
        </p>
      </div>

      {/* ── Input Card ── */}
      <div className="zap-input-card">
        <input
          className="zap-field"
          type="text"
          placeholder="https://target-app.com"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
          style={{ marginBottom: "1rem" }}
        />

        {/* Scan Options */}
        <div className="zap-option-grid">
          <div
            className={`zap-option-tile ${crawlChecked ? "selected-crawl" : ""}`}
            onClick={() => setCrawlChecked(!crawlChecked)}
          >
            <div className={`zap-option-check ${crawlChecked ? "checked-blue" : ""}`}>
              {crawlChecked && "✓"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 2 }}>
                🕸️ Spider / Crawler
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Attack surface & URL discovery
              </div>
            </div>
          </div>

          <div
            className={`zap-option-tile ${activeScanChecked ? "selected-attack" : ""}`}
            onClick={() => setActiveScanChecked(!activeScanChecked)}
          >
            <div className={`zap-option-check ${activeScanChecked ? "checked-red" : ""}`}>
              {activeScanChecked && "✓"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 2 }}>
                💥 Active Scan
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                SQLi, XSS, auth flaws & more
              </div>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <button className="zap-run-btn" onClick={handleScan} disabled={loading}>
          {loading ? (
            <>
              <span style={{
                width:14, height:14,
                border:"2px solid #fff", borderTopColor:"transparent",
                borderRadius:"50%", animation:"spin 0.7s linear infinite",
                display:"inline-block"
              }} />
              Scanning…
            </>
          ) : "🔍 Run Security Scan"}
        </button>

        <div className="zap-warning-bar">
          ⚠️ Only scan systems you own or are explicitly authorized to test.
        </div>
      </div>

      {/* ── Coverage Info ── */}
      <div className="zap-coverage-card">
        <div className="zap-coverage-header">🔍 Automated Security Coverage</div>
        <div className="zap-coverage-body">
          {[
            ["🛢️", "SQL Injection & Blind Injection"],
            ["📝", "Cross-Site Scripting (XSS)"],
            ["🔑", "Authentication & Session Weaknesses"],
            ["🔄", "CSRF & Input Validation Flaws"],
            ["📋", "OWASP Top-10 Detection"],
          ].map(([icon, label]) => (
            <div key={label} className="zap-coverage-item">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="zap-error">{error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="zap-loading-card">
          <div style={{ marginBottom: "0.8rem" }}>
            <span className="zap-loading-dot" />
            <span className="zap-loading-dot" />
            <span className="zap-loading-dot" />
          </div>
          <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
            Scan in progress
          </div>
          <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            This may take several minutes depending on the scan type selected.
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {scanResult && (
        <div className="zap-result">

          {/* Stat tiles */}
          <div className="zap-stat-grid">
            {[
              { label: "URLs Discovered",  value: urlCount,    color: urlCount > 0    ? "#2563eb" : "#16a34a" },
              { label: "Alerts Found",     value: alertCount,  color: alertCount > 0  ? "#d97706" : "#16a34a" },
              { label: "CVEs Referenced",  value: cveRefs.length, color: cveRefs.length > 0 ? "#dc2626" : "#16a34a" },
              { label: "Scan Completed",   value: scanComplete === true ? "✅ Yes" : scanComplete === false ? "⚠️ Partial" : "—",
                color: scanComplete === true ? "#16a34a" : "#d97706" },
            ].map(({ label, value, color }) => (
              <div key={label} className="zap-stat-tile">
                <div className="zap-stat-label">{label}</div>
                <div className="zap-stat-value" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Risk Summary */}
          {Object.keys(riskSummary).length > 0 && (
            <div className="zap-detail-card">
              <div className="zap-detail-header">⚠️ Risk Summary</div>
              <div className="zap-detail-body">
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem" }}>
                  {Object.entries(riskSummary).map(([level, count]) => {
                    const c = riskColor(level);
                    return (
                      <div key={level} style={{
                        background: c.bg, border:`1.5px solid ${c.border}`,
                        borderRadius:12, padding:"0.6rem 1rem",
                        minWidth:90, textAlign:"center"
                      }}>
                        <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:c.color, marginBottom:2 }}>
                          {level}
                        </div>
                        <div style={{ fontSize:"1.4rem", fontWeight:800, color:c.color, lineHeight:1 }}>
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="zap-detail-card">
              <div className="zap-detail-header">
                🚨 Alerts
                <span className="count-badge">{alerts.length}</span>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table className="zap-table">
                  <thead>
                    <tr>
                      <th>Risk</th>
                      <th>Name</th>
                      <th>URL</th>
                      <th>Solution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 50).map((a, i) => {
                      const c = severityColor(a.risk || a.severity);
                      return (
                        <tr key={i}>
                          <td>
                            <span className="zap-badge" style={{ background:c.bg, color:c.color, borderColor:c.border }}>
                              {a.risk || a.severity || "info"}
                            </span>
                          </td>
                          <td style={{ fontWeight:500, color:"#0f172a" }}>{a.name || a.alert}</td>
                          <td>
                            <code style={{ fontSize:"0.75rem", color:"#64748b", wordBreak:"break-all" }}>
                              {a.url}
                            </code>
                          </td>
                          <td style={{ fontSize:"0.78rem", color:"#64748b", maxWidth:200 }}>
                            {a.solution ? a.solution.slice(0, 80) + (a.solution.length > 80 ? "…" : "") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {alerts.length > 50 && (
                  <div style={{ textAlign:"center", padding:"0.7rem", fontSize:"0.78rem", color:"#94a3b8", borderTop:"1px solid #f1f5f9" }}>
                    Showing 50 of {alerts.length} alerts — download the PDF for the full report.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URLs */}
          {urls.length > 0 && (
            <div className="zap-detail-card">
              <div className="zap-detail-header">
                🔗 Discovered URLs
                <span className="count-badge">{urls.length}</span>
              </div>
              <div className="zap-detail-body" style={{ maxHeight:260, overflowY:"auto" }}>
                {urls.map((u, i) => (
                  <div key={i} className="zap-url-item">
                    <span style={{ color:"#94a3b8", flexShrink:0 }}>›</span>
                    <span>{typeof u === "string" ? u : u.url || JSON.stringify(u)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CVE References */}
          {cveRefs.length > 0 && (
            <div className="zap-detail-card">
              <div className="zap-detail-header">
                🛡️ CVE References
                <span className="count-badge">{cveRefs.length}</span>
              </div>
              <div className="zap-detail-body">
                {cveRefs.map((c, i) => (
                  <span key={i} className="zap-cve-pill">{c}</span>
                ))}
              </div>
            </div>
          )}

         {/* Download Reports */}
{(crawlChecked || activeScanChecked) && (
  <div className="zap-detail-card">
    <div className="zap-detail-header">📄 Download Reports</div>

    <div className="zap-detail-body">
      <div className="d-flex flex-wrap gap-2">

        {crawlChecked && (
          <button
            type="button"
            className="zap-dl-btn"
            onClick={() =>
              setError("Report download is unavailable in UI preview mode.")
            }
          >
            ⬇️ Spider Report PDF
          </button>
        )}

        {activeScanChecked && (
          <button
            type="button"
            className="zap-dl-btn"
            onClick={() =>
              setError("Report download is unavailable in UI preview mode.")
            }
          >
            ⬇️ Active Scan Report PDF
          </button>
        )}

      </div>
    </div>
  </div>
)}

        </div>
      )}
    </div>
  );
};

export default ZAPScanPage;
