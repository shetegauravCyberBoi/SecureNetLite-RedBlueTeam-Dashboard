import React, { useState } from "react";
import { useLocation } from "react-router-dom";

export default function DigitalForensicsPage() {
  const location = useLocation();
  const mode =
    new URLSearchParams(location.search).get("mode") || "red";

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a file first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch(
        "http://localhost:8000/forensics/scan",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Forensic scan failed");
      }

      const data = await response.json();
      setResult(data.results);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="card shadow-lg p-4">
        <h2 className="mb-1">
          {mode === "red" ? "🔴" : "🔵"} Digital Forensics Console
        </h2>
        <p className="text-muted">
          {mode === "red"
            ? "Post-exploitation forensic analysis & loot inspection"
            : "Incident response & defensive forensic analysis"}
        </p>

        <span
          className={`badge mb-3 ${
            mode === "red" ? "bg-danger" : "bg-primary"
          }`}
        >
          Mode: {mode.toUpperCase()}
        </span>

        <hr />

        {/* File Upload */}
        <div className="mb-3">
          <label className="form-label fw-bold">Upload Artifact</label>
          <input
            type="file"
            className="form-control"
            onChange={handleFileChange}
          />
          <small className="text-muted">
            ZIPs, binaries, memory dumps, logs, documents
          </small>
        </div>

        {/* Action */}
        <button
          className={`btn ${
            mode === "red" ? "btn-danger" : "btn-primary"
          } w-100 mb-3`}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Run Forensic Analysis"}
        </button>

        {/* Error */}
        {error && (
          <div className="alert alert-danger mt-3">{error}</div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-4">
            <h5 className="fw-bold">🧠 Analysis Results</h5>

            {/* Root File */}
            <div className="bg-light p-3 rounded mt-3">
              <h6 className="fw-bold">Root File</h6>

              <p><strong>File:</strong> {result.root_file.file}</p>
              <p><strong>Size:</strong> {result.root_file.size_kb} KB</p>
              <p><strong>MIME:</strong> {result.root_file.mime}</p>
              <p><strong>Entropy:</strong> {result.root_file.entropy}</p>

              <p className="fw-bold mb-1">Hashes</p>
              <ul>
                <li>MD5: {result.root_file.hashes.md5}</li>
                <li>SHA256: {result.root_file.hashes.sha256}</li>
              </ul>

              {result.root_file.credentials?.length > 0 && (
                <>
                  <p className="fw-bold text-danger mb-1">
                    Credential Artifacts
                  </p>
                  <ul>
                    {result.root_file.credentials.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </>
              )}

              {result.root_file.yara?.length > 0 && (
                <>
                  <p className="fw-bold mb-1">YARA Matches</p>
                  <ul>
                    {result.root_file.yara.map((y, i) => (
                      <li key={i}>{y}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Extracted Files */}
            {result.extracted_files?.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-bold">
                  📂 Extracted Files ({result.extracted_files.length})
                </h6>

                {result.extracted_files.map((f, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-2 mb-2"
                  >
                    <p className="mb-1">
                      <strong>{f.file}</strong> ({f.size_kb} KB)
                    </p>
                    <p className="mb-1">
                      Entropy: {f.entropy}
                    </p>

                    {f.credentials?.length > 0 && (
                      <p className="text-danger mb-1">
                        🔑 Credentials detected
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Insights */}
            {result.insights?.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-bold">🎯 Analyst Insights</h6>
                <ul>
                  {result.insights.map((i, idx) => (
                    <li key={idx}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
