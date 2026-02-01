import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openDropdown = (menu) => {
    setActiveDropdown(menu);

    // Clear existing timer and start new auto-close timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActiveDropdown(null), 5000);
  };

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setActiveDropdown(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3">
      <div className="container" ref={dropdownRef}>
        <span
          className="navbar-brand fw-bold text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(user ? "/dashboard" : "/")}
        >
          SecureNetLites
        </span>

        <ul className="navbar-nav ms-auto d-flex align-items-center gap-3">

          {/* TOOLS */}
          <li className="nav-item dropdown">
            <button
              className="nav-link btn btn-link dropdown-toggle"
              onClick={() =>
                setActiveDropdown((prev) => (prev === "tools" ? null : "tools"))
              }
            >
              Tools
            </button>
            <div className={`dropdown-menu ${activeDropdown === "tools" ? "show" : ""}`}>
              <Link className="dropdown-item" to="/scan" onClick={() => openDropdown(null)}>Basic Scan</Link>
              <Link className="dropdown-item" to="/fullscan" onClick={() => openDropdown(null)}>Advanced Scan</Link>
              <Link className="dropdown-item" to="/zap-scan" onClick={() => openDropdown(null)}>ZAP Attack Test</Link>
             
            </div>
          </li>

          {/* FEATURES */}
          <li className="nav-item dropdown">
            <button
              className="nav-link btn btn-link dropdown-toggle"
              onClick={() =>
                setActiveDropdown((prev) => (prev === "features" ? null : "features"))
              }
            >
              Features
            </button>
            <div className={`dropdown-menu ${activeDropdown === "features" ? "show" : ""}`}>
              <Link className="dropdown-item" to="/crawler-docs" onClick={() => openDropdown(null)}>Docs: Web Crawler</Link>
              <Link className="dropdown-item" to="/cves" onClick={() => openDropdown(null)}>Critical CVEs</Link>
              <Link className="dropdown-item" to="/port-scanner" onClick={() => openDropdown(null)}>Port Scanning</Link>
            </div>
          </li>

          {/* Login / Logout */}
          {!user ? (
            <li className="nav-item">
              <Link to="/login" className="btn btn-outline-primary">Login</Link>
            </li>
          ) : (
            <li className="nav-item">
              <button onClick={handleLogout} className="btn btn-outline-danger">
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
