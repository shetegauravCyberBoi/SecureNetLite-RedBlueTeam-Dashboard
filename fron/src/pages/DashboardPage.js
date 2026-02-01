// src/pages/DashboardPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 🔁 Operation Mode
  const [mode, setMode] = useState("blue"); // blue | red

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

  // 🧩 Tool Registry (easy to extend)
  const tools = {
    blue: [
      {
        label: "Start Basic Scan",
        icon: "🛡️",
        path: "/scan",
        style: "primary",
        desc: "Lightweight reconnaissance & availability checks",
      },
      {
        label: "Advanced Scan",
        icon: "🔍",
        path: "/fullscan",
        style: "warning",
        desc: "Deep vulnerability & service analysis",
      },
      {
        label: "ZAP Utility",
        icon: "⚡",
        path: "/zap-scan",
        style: "danger",
        desc: "Automated web vulnerability scanning",
      },
      {
        label: "View Reports",
        icon: "📄",
        path: "/reports",
        style: "success",
        desc: "Download and analyze scan reports",
      },
    ],
    red: [
      {
        label: "ZAP Attack Mode",
        icon: "💥",
        path: "/zap-scan",
        style: "danger",
        desc: "Active web attack simulations",
      },
      {
        label: "Digital Forensics",
        icon: "🧬",
        path: "/forensics",
        style: "secondary",
        desc: "Post-exploitation & evidence analysis",
      },
      {
        label: "Enumeration Console",
        icon: "🎯",
        path: "/attacker",
        style: "dark",
        desc: "Offensive security tooling",
      },
    ],
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "85vh" }}
    >
      <div
        className="card shadow-lg p-5 w-100"
        style={{ maxWidth: "700px", borderRadius: "1.2rem" }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-1">Welcome back,</h2>
            <h3 className="text-primary fw-bold">{user.username}</h3>
            <span className="badge bg-dark mt-2">
              Role: {user.role}
            </span>
          </div>

       
        </div>

        <hr className="my-4" />

        {/* 🔁 Mode Toggle */}
        <div className="d-flex justify-content-center mb-4">
          <div className="btn-group shadow-sm">
            <button
              className={`btn ${
                mode === "blue"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setMode("blue")}
            >
              🔵 Blue Team
            </button>
            <button
              className={`btn ${
                mode === "red"
                  ? "btn-danger"
                  : "btn-outline-danger"
              }`}
              onClick={() => setMode("red")}
            >
              🔴 Red Team
            </button>
          </div>
        </div>

        {/* 🧰 Tool Grid */}
        <div className="row g-3">
          {tools[mode].map((tool, index) => (
            <div className="col-12" key={index}>
              <Link
                to={tool.path}
                className={`btn btn-outline-${tool.style} w-100 text-start p-4 shadow-sm`}
                style={{
                  borderRadius: "0.9rem",
                  transition: "all 0.2s ease",
                }}
              >
                <div className="d-flex align-items-center">
                  <div style={{ fontSize: "1.8rem", marginRight: "1rem" }}>
                    {tool.icon}
                  </div>
                  <div>
                    <h5 className="mb-1">{tool.label}</h5>
                    <small className="text-muted">{tool.desc}</small>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
