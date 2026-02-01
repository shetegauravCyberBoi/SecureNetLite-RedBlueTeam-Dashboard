// src/pages/ScanPage.js
import React, { useState } from "react";
import axios from "axios";
import { FaLock, FaSearchPlus, FaSpider, FaHeartbeat } from "react-icons/fa";
import { importAllImages } from "../utils/importAllImages";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const securityImages = importAllImages(
  require.context("../assets/security", false, /\.(png|jpe?g|webp)$/)
);

export default function ScanPage() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { user, token } = useAuth();

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const config = { params: { target } };

      if (user && token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const res = await axios.get(
        "http://localhost:8000/basic-scan",
        config
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(
        "Baseline check failed: " +
          (err.response?.data?.detail ||
            err.message ||
            "Try again later.")
      );
    }

    setLoading(false);
  };

  const healthStatus =
    result?.result?.health_score?.status || "Unknown";

  const healthBadgeClass =
    healthStatus === "Healthy"
      ? "bg-success"
      : healthStatus === "Degraded"
      ? "bg-warning text-dark"
      : healthStatus === "At Risk"
      ? "bg-danger"
      : "bg-secondary";

  return (
    <div className="container mt-4">
      {/* 🔄 Image Carousel */}
      <div
        id="carouselSecurity"
        className="carousel slide mb-5 shadow rounded"
        data-bs-ride="carousel"
        data-bs-interval="3000"
      >
        <div className="carousel-inner rounded">
          {securityImages.map((img, idx) => (
            <div
              className={`carousel-item ${idx === 0 ? "active" : ""}`}
              key={idx}
            >
              <img
                src={img}
                className="d-block w-100"
                alt={`Security Slide ${idx + 1}`}
                style={{ height: "280px", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselSecurity"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" />
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselSecurity"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" />
        </button>
      </div>

      <h2 className="mb-4 text-primary">
        <FaHeartbeat className="me-2" />
        {user
          ? "SOC Baseline Health Check"
          : "Quick Baseline Health Check (Guest)"}
      </h2>

      <p className="text-muted">
        Fast posture assessment to identify exposure, availability, and hygiene
        issues before deeper scans.
      </p>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter IP or domain (e.g. 8.8.8.8 or example.com)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </div>

      <button
        className="btn btn-warning mb-3"
        onClick={handleScan}
        disabled={loading}
      >
        {loading ? "Running Baseline Check..." : "Run Baseline Health Check"}
      </button>

      {error && <div className="alert alert-danger mt-2">{error}</div>}

      {result && (
        <div className="mt-4">
          <h5 className="text-success">
            Baseline Results{" "}
            <span className={`badge ms-2 ${healthBadgeClass}`}>
              {healthStatus}
            </span>
          </h5>

          <pre className="bg-light p-3 rounded border mt-3">
            {JSON.stringify(result.result || {}, null, 2)}
          </pre>

          {result.report_pdf && (
            <a
              href={`http://localhost:8000${result.report_pdf}`}
              className="btn btn-outline-success mt-2"
              download
            >
              📄 Download Baseline Report
            </a>
          )}
        </div>
      )}

      {!user && (
        <div className="mt-5">
          <h4 className="text-secondary mb-4">
            🔐 Unlock Advanced SOC Capabilities
          </h4>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border-warning shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-warning">
                    <FaSearchPlus className="me-2" />
                    Full Exposure Scan
                    <span className="badge bg-secondary ms-2">
                      Login Required
                    </span>
                  </h5>
                  <p className="card-text">
                    Deep exposure analysis with vulnerability correlation and
                    intelligence enrichment.
                  </p>
                  <button
                    className="btn btn-outline-warning"
                    onClick={() => navigate("/login")}
                  >
                    <FaLock className="me-1" />
                    Sign in to Use
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-info shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-info">
                    <FaSpider className="me-2" />
                    Web Security Audit
                    <span className="badge bg-secondary ms-2">
                      Login Required
                    </span>
                  </h5>
                  <p className="card-text">
                    Crawl and audit web applications for configuration and
                    security issues.
                  </p>
                  <button
                    className="btn btn-outline-info"
                    onClick={() => navigate("/login")}
                  >
                    <FaLock className="me-1" />
                    Sign in to Use
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-muted">
              🔓 Access full SOC workflows by{" "}
              <a href="/login">signing in</a> or{" "}
              <a href="/register">creating an account</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
