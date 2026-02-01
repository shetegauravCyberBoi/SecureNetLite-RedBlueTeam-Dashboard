import React, { useEffect, useState } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ReportPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [pdfReports, setPdfReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    // ⛔ DO NOT FIRE UNTIL TOKEN EXISTS
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        const res = await API.get("/reports/pdfs");
        setPdfReports(res.data.pdf_reports || []);
      } catch (err) {
        console.error("Fetch reports failed:", err);
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token]); // 🔥 ONLY depend on token

  const handleDownload = async (pdfId, filename) => {
    try {
      setDownloading(pdfId);
      const res = await fetch(
        `http://localhost:8000/report/download/${pdfId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  if (!token) {
    return (
      <div className="container mt-4 text-center">
        <h3>Please login to view reports</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-3">Loading your reports...</p>
      </div>
    );
  }

  if (pdfReports.length === 0) {
    return (
      <div className="container mt-4 text-center">
        <h3>No reports found</h3>
        <button className="btn btn-success mt-3" onClick={() => navigate("/dashboard")}>
          Run a Scan
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">📁 Your Scan Reports</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="list-group">
        {pdfReports.map((r) => (
          <li key={r.pdf_id} className="list-group-item d-flex justify-content-between">
            <div>
              <strong>{r.filename}</strong>
              <div className="text-muted small">
                {r.scan_type.toUpperCase()} ·{" "}
                {new Date(r.uploaded_at).toLocaleString()}
              </div>
            </div>
            <button
              className="btn btn-outline-success btn-sm"
              disabled={downloading === r.pdf_id}
              onClick={() => handleDownload(r.pdf_id, r.filename)}
            >
              {downloading === r.pdf_id ? "Downloading…" : "⬇ Download"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
