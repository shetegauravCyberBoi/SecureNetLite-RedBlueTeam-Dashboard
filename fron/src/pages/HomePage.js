import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-light">
      {/* HERO SECTION */}
      <div className="py-5 text-center bg-white border-bottom">
        <div className="container">
          <h1 className="display-4 fw-bold text-dark">
            SecureNetLite
          </h1>

          <p className="lead text-muted mt-3">
            Unified platform for vulnerability scanning, offensive security,
            and post-exploitation digital forensics.
          </p>

          <div className="mt-4">
            <Link
              to="/scan"
              className="btn btn-primary btn-lg me-3 shadow-sm"
            >
              🛡️ Start Security Scan
            </Link>

            <Link
              to="/forensics?mode=red"
              className="btn btn-outline-danger btn-lg shadow-sm"
            >
              🧬 Digital Forensics
            </Link>
          </div>

          {!user && (
            <p className="text-muted mt-3">
              Login to unlock advanced Red & Blue team tooling
            </p>
          )}
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="container py-5">
        <div className="row g-4">
          {/* Blue Team */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title">
                  🔵 Blue Team Defense
                </h5>
                <p className="card-text text-muted">
                  Detect vulnerabilities, misconfigurations, exposed services,
                  and malware indicators before attackers do.
                </p>
                <ul className="text-muted small">
                  <li>Port & service scanning</li>
                  <li>Web vulnerability detection</li>
                  <li>Incident response forensics</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Red Team */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title">
                  🔴 Red Team Operations
                </h5>
                <p className="card-text text-muted">
                  Simulate real-world attacker behavior to validate
                  detection, response, and data exposure risks.
                </p>
                <ul className="text-muted small">
                  <li>Active attack simulation</li>
                  <li>Post-exploitation analysis</li>
                  <li>Credential & data discovery</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Digital Forensics */}
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title">
                  🧬 Digital Forensics
                </h5>
                <p className="card-text text-muted">
                  Analyze files, memory dumps, archives, and artifacts to
                  uncover secrets, attacker traces, and high-risk data.
                </p>
                <ul className="text-muted small">
                  <li>Archive & artifact inspection</li>
                  <li>Credential detection</li>
                  <li>Malware & entropy analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="bg-dark text-light py-4">
        <div className="container text-center">
          <p className="mb-1 fw-bold">
            Built for Security Engineers, Red Teams & SOC Analysts
          </p>
          <p className="text-muted small mb-0">
            SecureNetLite • Offensive & Defensive Security Platform
          </p>
        </div>
      </div>
    </div>
  );
}
