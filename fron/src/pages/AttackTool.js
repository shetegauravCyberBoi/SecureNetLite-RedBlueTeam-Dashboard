import React, { useState, useRef } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AttackerTool() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const abortRef = useRef(null);
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [subdomainTarget, setSubdomainTarget] = useState("");
  const [pathTarget,      setPathTarget]      = useState("");
  const [filesTarget,     setFilesTarget]     = useState("");
  const [status,          setStatus]          = useState("idle");
  const [results,         setResults]         = useState({ subdomain: [], path: [], files: [] });
  const [error,           setError]           = useState("");

  if (!token) {
    return (
      <div className="container mt-5 text-center">
        <h4 style={{ color: "#0f172a" }}>Authentication Required</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/login")}>
          Login
        </button>
      </div>
    );
  }

  const runScan = async (endpoint, payload, key) => {
    abortRef.current = new AbortController();
    setStatus("running");
    setError("");
    try {
      const res = await API.post(endpoint, payload, {
        ...authHeader,
        signal: abortRef.current.signal,
      });
      const raw = Array.isArray(res.data.results) ? res.data.results : [];
      setResults((r) => ({ ...r, [key]: raw }));
      setStatus("idle");
    } catch (err) {
      if (err.name === "CanceledError") {
        setStatus("stopped");
      } else {
        setError("Scan failed. Please check the target and try again.");
        setStatus("idle");
      }
    }
  };

  const startSubdomainScan = () => {
    if (!subdomainTarget) return alert("Enter subdomain fuzz URL");
    runScan("/enum/ffuf", { url: subdomainTarget }, "subdomain");
  };
  const startPathScan = () => {
    if (!pathTarget) return alert("Enter path fuzz URL");
    runScan("/enum/ffuf", { url: pathTarget }, "path");
  };
  const startFilesScan = () => {
    if (!filesTarget) return alert("Enter files base URL");
    runScan("/enum/dirs", { target: filesTarget, mode: "files" }, "files");
  };
  const stopScan = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setStatus("stopped");
    }
  };

  const isRunning = status === "running";

  const statusColor =
    status === "running" ? "#d97706" :
    status === "stopped" ? "#dc2626" : "#16a34a";
  const statusBg =
    status === "running" ? "#fffbeb" :
    status === "stopped" ? "#fef2f2" : "#f0fdf4";
  const statusBorder =
    status === "running" ? "#fde68a" :
    status === "stopped" ? "#fecaca" : "#bbf7d0";

  const resultIcons = { subdomain: "🌐", path: "📂", files: "📁" };
  const resultLabels = { subdomain: "Subdomain Fuzzing", path: "Directory / Path Fuzzing", files: "File Enumeration" };

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        .at-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 1rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transition: box-shadow 0.15s;
        }
        .at-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

        .at-card-header {
          background: #f8fafc;
          border-bottom: 1.5px solid #f1f5f9;
          padding: 0.7rem 1.2rem;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .at-card-body { padding: 1.2rem 1.4rem; }

        .at-field {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.7rem 1rem;
          font-size: 0.9rem;
          color: #0f172a;
          width: 100%;
          transition: border-color 0.15s;
          background: #fff;
          font-family: monospace;
        }
        .at-field:focus { outline: none; border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.12); }
        .at-field:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

        .at-btn {
          border: none;
          border-radius: 12px;
          padding: 0.65rem 1.4rem;
          font-weight: 700;
          font-size: 0.87rem;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .at-btn:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
        .at-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .at-btn-red    { background: linear-gradient(135deg,#f87171,#dc2626); color:#fff; }
        .at-btn-yellow { background: linear-gradient(135deg,#fbbf24,#d97706); color:#fff; }
        .at-btn-blue   { background: linear-gradient(135deg,#60a5fa,#2563eb); color:#fff; }
        .at-btn-stop   { background: #f1f5f9; border: 1.5px solid #e2e8f0; color: #64748b; border-radius: 999px; padding: 0.4rem 1.1rem; font-size: 0.82rem; font-weight: 600; cursor:pointer; transition:all 0.15s; }
        .at-btn-stop:hover { border-color:#fecaca; color:#dc2626; }

        .at-status-bar {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.8rem 1.2rem;
          margin-bottom: 1.2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .at-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 999px;
          padding: 0.25rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          border: 1.5px solid;
        }
        .at-spinner {
          width: 10px; height: 10px;
          border: 2px solid #d97706;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        .at-result-card { animation: fadeUp 0.25s ease; }

        .at-result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 1.1rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.84rem;
          font-family: monospace;
          color: #374151;
          transition: background 0.1s;
        }
        .at-result-item:last-child { border-bottom: none; }
        .at-result-item:hover { background: #f8fafc; }
        .at-result-item.positive { background: #f0fdf4; color: #15803d; }
        .at-result-item.positive:hover { background: #dcfce7; }

        .at-status-code {
          font-size: 0.72rem;
          font-weight: 700;
          border-radius: 999px;
          padding: 0.15rem 0.55rem;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          font-family: monospace;
        }
        .at-status-code.ok {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #bbf7d0;
        }

        .at-error {
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.87rem;
          margin-bottom: 1rem;
        }

        .at-empty {
          text-align: center;
          color: #94a3b8;
          padding: 1.8rem 1rem;
          font-size: 0.88rem;
        }

        .at-count-badge {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          padding: 0.1rem 0.55rem;
          font-size: 0.72rem;
          font-weight: 700;
          margin-left: 0.4rem;
        }
      `}</style>

      {/* ── Page Title ── */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: "#0f172a", fontSize: "1.6rem" }}>
          🎯 Enumeration Console
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>
          Offensive fuzzing and directory enumeration via FFUF — subdomain, path, and file discovery.
        </p>
      </div>

      {error && <div className="at-error">{error}</div>}

      {/* ── Status Bar ── */}
      <div className="at-status-bar">
        <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>
          SCAN STATUS
        </span>
        <span
          className="at-status-pill"
          style={{ background: statusBg, color: statusColor, borderColor: statusBorder }}
        >
          {status === "running" && <span className="at-spinner" />}
          {status.toUpperCase()}
        </span>
        {isRunning && (
          <button className="at-btn-stop ms-auto" onClick={stopScan}>
            ⛔ Stop Scan
          </button>
        )}
      </div>

      {/* ── Subdomain Fuzzing ── */}
      <div className="at-card">
        <div className="at-card-header">
          🌐 Subdomain Fuzzing
        </div>
        <div className="at-card-body">
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.8rem" }}>
            Use <code style={{ background:"#f1f5f9", padding:"0.1rem 0.4rem", borderRadius:6, color:"#475569" }}>FUZZ</code> as
            the placeholder where subdomains will be injected.
          </p>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <input
              className="at-field"
              style={{ flex: 1, minWidth: 220 }}
              placeholder="https://FUZZ.domain.com"
              value={subdomainTarget}
              onChange={(e) => setSubdomainTarget(e.target.value)}
              disabled={isRunning}
            />
            <button
              className="at-btn at-btn-red"
              onClick={startSubdomainScan}
              disabled={isRunning}
            >
              {isRunning ? <><span style={{ width:12,height:12,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />Running…</> : "▶ Run"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Path Fuzzing ── */}
      <div className="at-card">
        <div className="at-card-header">
          📂 Directory / Path Fuzzing
        </div>
        <div className="at-card-body">
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.8rem" }}>
            Brute-force directories and paths using <code style={{ background:"#f1f5f9", padding:"0.1rem 0.4rem", borderRadius:6, color:"#475569" }}>FUZZ</code> as the path segment placeholder.
          </p>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <input
              className="at-field"
              style={{ flex: 1, minWidth: 220 }}
              placeholder="https://domain.com/FUZZ"
              value={pathTarget}
              onChange={(e) => setPathTarget(e.target.value)}
              disabled={isRunning}
            />
            <button
              className="at-btn at-btn-yellow"
              onClick={startPathScan}
              disabled={isRunning}
            >
              {isRunning ? <><span style={{ width:12,height:12,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />Running…</> : "▶ Run"}
            </button>
          </div>
        </div>
      </div>

      {/* ── File Enumeration ── */}
      <div className="at-card">
        <div className="at-card-header">
          📁 File Enumeration
        </div>
        <div className="at-card-body">
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.8rem" }}>
            Discover exposed files under a base URL path.
          </p>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <input
              className="at-field"
              style={{ flex: 1, minWidth: 220 }}
              placeholder="https://domain.com/files"
              value={filesTarget}
              onChange={(e) => setFilesTarget(e.target.value)}
              disabled={isRunning}
            />
            <button
              className="at-btn at-btn-blue"
              onClick={startFilesScan}
              disabled={isRunning}
            >
              {isRunning ? <><span style={{ width:12,height:12,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />Running…</> : "▶ Run"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {Object.entries(results).map(([key, list]) =>
        list.length > 0 && (
          <div className="at-card at-result-card" key={key}>
            <div className="at-card-header">
              {resultIcons[key]} {resultLabels[key]} Results
              <span className="at-count-badge">{list.length}</span>
            </div>
            <div>
              {list.length > 0 ? (
                list.map((r, i) => {
                  const isOk = r.status >= 200 && r.status < 300;
                  return (
                    <div
                      key={i}
                      className={`at-result-item ${r.positive ? "positive" : ""}`}
                    >
                      <span>{r.payload || r.path || r.file}</span>
                      <span
                        className={`at-status-code ${isOk ? "ok" : ""}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="at-empty">No results found</div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
