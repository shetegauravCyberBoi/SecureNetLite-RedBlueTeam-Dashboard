import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function FullScanPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  /* ---------------- Network Scan ---------------- */
  const [target, setTarget] = useState("");
  const [scanResult, setScanResult] = useState(null);

  /* ---------------- Artifact Scan ---------------- */
  const [file, setFile] = useState(null);
  const [artifactResult, setArtifactResult] = useState(null);

  /* ---------------- Common ---------------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* 🔐 Auth Guard */
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  /* ---------------- Network Scan Handler ---------------- */
  const handleNetworkScan = async () => {
    if (!target.trim()) {
      setError("Please enter a valid IP or domain.");
      return;
    }

    setLoading(true);
    setError("");
    setScanResult(null);

    try {
      const res = await axios.get(
        `http://localhost:8000/fullscan?target=${encodeURIComponent(target)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setScanResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Network scan failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Artifact Scan Handler ---------------- */
  const handleArtifactScan = async () => {
    if (!file) {
      setError("Please upload a file for forensic analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setArtifactResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8000/forensics/scan",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setArtifactResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Artifact analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">🛡️ Blue Team Security Analyzer</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ================= NETWORK SCAN ================= */}
      <div className="card mb-4">
        <div className="card-header">🌐 Network Threat Analysis</div>
        <div className="card-body">
          <input
            type="text"
            className="form-control mb-2"
            placeholder="IP or domain (e.g. 8.8.8.8)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />

          <button
            className="btn btn-primary"
            onClick={handleNetworkScan}
            disabled={loading}
          >
            {loading ? "Scanning..." : "Start Network Scan"}
          </button>

          {scanResult && (
            <pre className="bg-light p-3 mt-3 overflow-auto" style={{ maxHeight: 300 }}>
              {JSON.stringify(scanResult, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* ================= ARTIFACT ANALYSIS ================= */}
      <div className="card mb-4">
        <div className="card-header">📁 Artifact Forensic Analysis</div>
        <div className="card-body">
          <p className="text-muted">
            Upload executables, scripts, logs, or disk artifacts for DFIR analysis.
          </p>

          <input
            type="file"
            className="form-control mb-3"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            className="btn btn-warning"
            onClick={handleArtifactScan}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Artifact"}
          </button>

          {artifactResult && (
            <div className="mt-4">
              <h6>Forensic Results</h6>

              <ul className="list-group mb-3">
                <li className="list-group-item">
                  <strong>Original File:</strong> {artifactResult.filename}
                </li>
                <li className="list-group-item">
                  <strong>Stored As:</strong> {artifactResult.stored_as}
                </li>
                <li className="list-group-item">
                  <strong>SHA256:</strong>{" "}
                  {artifactResult.forensics?.hashes?.sha256}
                </li>
                <li className="list-group-item">
                  <strong>Detected Type:</strong>{" "}
                  {artifactResult.forensics?.file_type}
                </li>
              </ul>

              <pre className="bg-light p-3 overflow-auto" style={{ maxHeight: 350 }}>
                {JSON.stringify(artifactResult.forensics, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
