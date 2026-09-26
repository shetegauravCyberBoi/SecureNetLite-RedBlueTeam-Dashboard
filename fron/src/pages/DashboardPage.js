// src/pages/DashboardPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("blue");
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="text-center mt-5 text-muted">
        <h5>You must be logged in to view this page.</h5>
      </div>
    );
  }

  const tools = {
    blue: [
      {
        label: "Start Basic Scan",
        icon: "🛡️",
        path: "/scan",
        style: "primary",
        desc: "Lightweight reconnaissance & availability checks",
        tag: "Recon",
      },
      {
        label: "Advanced Scan",
        icon: "🔍",
        path: "/fullscan",
        style: "warning",
        desc: "Deep vulnerability & service analysis",
        tag: "Deep Scan",
      },
      {
        label: "ZAP Utility",
        icon: "⚡",
        path: "/zap-scan",
        style: "danger",
        desc: "Automated web vulnerability scanning",
        tag: "Web Vulns",
      },
      {
        label: "URL Inspection",
        icon: "🔗",
        path: "/maliciousurl",
        style: "danger",
        desc: "Automated malicious URL scanning",
        tag: "Threat Intel",
      },
      {
        label: "Artifact Analysis",
        icon: "🧬",
        path: "/forensics?mode=blue",
        style: "secondary",
        desc: "Binary, malware & IOC extraction from uploaded files",
        tag: "DFIR",
      },
    ],
    red: [
      {
        label: "ZAP Attack Mode",
        icon: "💥",
        path: "/zap-scan",
        style: "danger",
        desc: "Active web attack simulations",
        tag: "Active Attack",
      },
      {
        label: "Digital Forensics",
        icon: "🧬",
        path: "/forensics?mode=red",
        style: "secondary",
        desc: "Post-exploitation & evidence analysis",
        tag: "DFIR",
      },
      {
        label: "CSRF Generator",
        icon: "⚔️",
        path: "/csrf",
        style: "danger",
        desc: "Actual attack vector generation",
        tag: "Exploit",
      },
      {
        label: "Enumeration Console",
        icon: "🎯",
        path: "/attacker",
        style: "dark",
        desc: "Offensive security tooling",
        tag: "Offensive",
      },
    ],
  };

  const tagColors = {
    primary:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    warning:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    danger:    { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    secondary: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
    dark:      { bg: "#f1f5f9", color: "#1e293b", border: "#cbd5e1" },
  };

  const isBlue = mode === "blue";

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "88vh" }}
    >
      <style>{`
        .tool-link {
          display: block;
          text-decoration: none;
          border-radius: 14px;
          transition: all 0.18s ease;
        }
        .tool-link:hover {
          text-decoration: none;
          transform: translateY(-2px);
        }
        .tool-inner {
          border-radius: 14px;
          padding: 1.1rem 1.3rem;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.18s ease;
        }
        .tool-link:hover .tool-inner {
          border-color: #cbd5e1;
          background: #f8fafc;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
        }
        .tool-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
          transition: all 0.18s ease;
        }
        .tool-link:hover .tool-icon-wrap {
          background: #e2e8f0;
        }
        .tool-arrow {
          color: #cbd5e1;
          font-size: 1.2rem;
          margin-left: auto;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .tool-link:hover .tool-arrow {
          color: #94a3b8;
          transform: translateX(3px);
        }
        .mode-pill {
          border: none;
          border-radius: 999px;
          padding: 0.55rem 1.6rem;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .section-divider {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin: 1.4rem 0 1rem;
        }
        .section-divider span {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94a3b8;
          white-space: nowrap;
        }
        .section-divider::before,
        .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }
      `}</style>

      <div
        className="card border-0 shadow-lg w-100"
        style={{
          maxWidth: "720px",
          borderRadius: "1.6rem",
          background: "#ffffff",
        }}
      >
        <div className="card-body p-5">

          {/* ── Header ── */}
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-2">
            <div>
              <p className="text-muted mb-1" style={{ fontSize: "0.82rem" }}>
                Welcome back
              </p>
              <h2 className="fw-bold mb-0" style={{ fontSize: "1.7rem", color: "#0f172a" }}>
                {user.username}
              </h2>
              <div className="mt-2 d-flex align-items-center gap-2">
                <span
                  className="badge rounded-pill px-3 py-1"
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em"
                  }}
                >
                  {user.role}
                </span>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  Security Operations Console
                </span>
              </div>
            </div>
            
          </div>

          <hr style={{ borderColor: "#f1f5f9", margin: "1.4rem 0" }} />

          {/* ── Mode Toggle ── */}
          <div className="d-flex justify-content-center mb-1">
            <div
              style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "999px",
                padding: "4px",
                display: "flex",
                gap: "2px"
              }}
            >
              <button
                className="mode-pill"
                onClick={() => setMode("blue")}
                style={{
                  background: isBlue
                    ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                    : "transparent",
                  color: isBlue ? "#fff" : "#94a3b8",
                  boxShadow: isBlue ? "0 2px 12px rgba(59,130,246,0.3)" : "none",
                }}
              >
                🔵 Blue Team
              </button>
              <button
                className="mode-pill"
                onClick={() => setMode("red")}
                style={{
                  background: !isBlue
                    ? "linear-gradient(135deg, #f87171, #dc2626)"
                    : "transparent",
                  color: !isBlue ? "#fff" : "#94a3b8",
                  boxShadow: !isBlue ? "0 2px 12px rgba(220,38,38,0.3)" : "none",
                }}
              >
                🔴 Red Team
              </button>
            </div>
          </div>

          {/* ── Section Label ── */}
          <div className="section-divider">
            <span>
              {isBlue ? "Defensive Tooling" : "Offensive Tooling"}
              {" · "}{tools[mode].length} tools
            </span>
          </div>

          {/* ── Tool Cards ── */}
          <div className="d-flex flex-column gap-2">
            {tools[mode].map((tool, index) => {
              const tc = tagColors[tool.style] || tagColors.secondary;
              return (
                <Link
                  key={index}
                  to={tool.path}
                  className="tool-link"
                >
                  <div className="tool-inner">
                    <div className="tool-icon-wrap">
                      {tool.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span style={{
                          fontWeight: 600,
                          fontSize: "0.92rem",
                          color: "#0f172a"
                        }}>
                          {tool.label}
                        </span>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          padding: "0.15rem 0.55rem",
                          borderRadius: "999px",
                          background: tc.bg,
                          color: tc.color,
                          border: `1px solid ${tc.border}`,
                          whiteSpace: "nowrap"
                        }}>
                          {tool.tag}
                        </span>
                      </div>
                      <div style={{
                        fontSize: "0.78rem",
                        color: "#94a3b8",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {tool.desc}
                      </div>
                    </div>
                    <span className="tool-arrow">›</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div
            className="text-center mt-4"
            style={{ fontSize: "0.73rem", color: "#cbd5e1", letterSpacing: "0.05em" }}
          >
            SecureNetLite · Security Operations Platform
          </div>

        </div>
      </div>
    </div>
  );
}
