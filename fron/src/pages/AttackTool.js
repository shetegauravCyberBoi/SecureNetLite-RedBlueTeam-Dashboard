import React, { useState, useRef } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AttackerTool() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const abortRef = useRef(null);

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ================= INPUTS ================= */
  const [subdomainTarget, setSubdomainTarget] = useState("");
  const [pathTarget, setPathTarget] = useState("");
  const [filesTarget, setFilesTarget] = useState("");

  /* ================= STATE ================= */
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState({
    subdomain: [],
    path: [],
    files: [],
  });
  const [error, setError] = useState("");

  /* ================= AUTH GUARD ================= */
  if (!token) {
    return (
      <div className="container mt-5 text-center">
        <h4>Authentication Required</h4>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </div>
    );
  }

  /* ================= COMMON SCAN HANDLER ================= */
  const runScan = async (endpoint, payload, key) => {
    abortRef.current = new AbortController();
    setStatus("running");
    setError("");

    try {
      const res = await API.post(
        endpoint,
        payload,
        { ...authHeader, signal: abortRef.current.signal }
      );

      // Always normalize results
      const raw = Array.isArray(res.data.results)
        ? res.data.results
        : [];

      setResults((r) => ({ ...r, [key]: raw }));
      setStatus("idle");
    } catch (err) {
      if (err.name === "CanceledError") {
        setStatus("stopped");
      } else {
        setError("Scan failed");
        setStatus("idle");
      }
    }
  };

  /* ================= SCANS ================= */
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

  /* ================= UI ================= */
  return (
    <div className="container mt-4">
      <h2 className="mb-4">🧠 Enumeration Console</h2>

      {/* ================= SUBDOMAIN FUZZ ================= */}
      <div className="card mb-4">
        <div className="card-header">🌐 Subdomain Fuzzing</div>
        <div className="card-body">
          <input
            className="form-control mb-2"
            placeholder="https://FUZZ.domain.com"
            value={subdomainTarget}
            onChange={(e) => setSubdomainTarget(e.target.value)}
            disabled={status === "running"}
          />
          <button
            className="btn btn-danger"
            onClick={startSubdomainScan}
            disabled={status === "running"}
          >
            Run Subdomain Scan
          </button>
        </div>
      </div>

      {/* ================= PATH FUZZ ================= */}
      <div className="card mb-4">
        <div className="card-header">📂 Directory / Path Fuzzing</div>
        <div className="card-body">
          <input
            className="form-control mb-2"
            placeholder="https://domain.com/FUZZ"
            value={pathTarget}
            onChange={(e) => setPathTarget(e.target.value)}
            disabled={status === "running"}
          />
          <button
            className="btn btn-warning"
            onClick={startPathScan}
            disabled={status === "running"}
          >
            Run Path Scan
          </button>
        </div>
      </div>

      {/* ================= FILE ENUM ================= */}
      <div className="card mb-4">
        <div className="card-header">📁 File Enumeration</div>
        <div className="card-body">
          <input
            className="form-control mb-2"
            placeholder="https://domain.com/files"
            value={filesTarget}
            onChange={(e) => setFilesTarget(e.target.value)}
            disabled={status === "running"}
          />
          <button
            className="btn btn-info"
            onClick={startFilesScan}
            disabled={status === "running"}
          >
            Run File Scan
          </button>
        </div>
      </div>

      {/* ================= CONTROL ================= */}
      <div className="mb-3">
        <strong>Status:</strong>{" "}
        <span
          className={
            status === "running"
              ? "text-warning"
              : status === "stopped"
              ? "text-danger"
              : "text-success"
          }
        >
          {status.toUpperCase()}
        </span>

        {status === "running" && (
          <button className="btn btn-secondary ms-3" onClick={stopScan}>
            ⛔ Stop
          </button>
        )}
      </div>

      {error && <div className="text-danger">{error}</div>}

      {/* ================= RESULTS ================= */}
      {Object.entries(results).map(
        ([key, list]) =>
          list.length > 0 && (
            <div className="card mb-4" key={key}>
              <div className="card-header">📌 {key.toUpperCase()} RESULTS</div>
              <ul className="list-group list-group-flush">
                {list.map((r, i) => (
                  <li
                    key={i}
                    className={`list-group-item ${
                      r.positive ? "list-group-item-success" : ""
                    }`}
                  >
                    {r.payload || r.path || r.file}
                    <span className="badge bg-dark ms-2">
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
      )}
    </div>
  );
}
