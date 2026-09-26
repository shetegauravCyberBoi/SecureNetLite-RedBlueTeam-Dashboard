// src/components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [scrolled,       setScrolled]       = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => { logout(); navigate("/"); };
  const toggleDropdown = (menu) => setActiveDropdown(prev => prev === menu ? null : menu);
  const closeAll = () => setActiveDropdown(null);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) closeAll();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { closeAll(); }, [location.pathname]);

  return (
    <nav className={`apple-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner" ref={dropdownRef}>

        {/* Brand */}
        <span className="apple-brand" onClick={() => navigate(user ? "/dashboard" : "/")}>
          <span className="brand-icon">🛡</span>
          Secure<span className="brand-accent">Net</span>Lite
        </span>

        {/* Nav items */}
        <ul className="nav-list">

          {/* Tools */}
          <li className="nav-item-wrap">
            <button
              className={`apple-nav-link ${activeDropdown === "tools" ? "link-active" : ""}`}
              onClick={() => toggleDropdown("tools")}
            >
              Tools
              <span className={`nav-chevron ${activeDropdown === "tools" ? "open" : ""}`}>‹</span>
            </button>
            <div className={`apple-dropdown ${activeDropdown === "tools" ? "show" : ""}`}>
              <div className="dropdown-section-label">Scanning</div>
              {[
                { to:"/scan",     icon:"🛡️", label:"Basic Scan",     desc:"Quick posture check"         },
                { to:"/fullscan", icon:"🔬", label:"Advanced Scan",   desc:"Deep threat analysis"        },
                { to:"/zap-scan", icon:"⚡", label:"ZAP Web Scanner", desc:"OWASP web vulnerabilities"   },
                { to:"/maliciousurl", icon:"🔗", label:"URL Inspection", desc:"Malicious URL detection"  },
              ].map(({ to, icon, label, desc }) => (
                <Link key={to} className={`dropdown-item ${isActive(to) ? "item-active" : ""}`} to={to} onClick={closeAll}>
                  <span className="item-icon">{icon}</span>
                  <span className="item-text">
                    <span className="item-label">{label}</span>
                    <span className="item-desc">{desc}</span>
                  </span>
                </Link>
              ))}
              <div className="dropdown-divider" />
              <div className="dropdown-section-label">Operations</div>
              <Link className="dropdown-item ops-item" to="/prototype" onClick={closeAll}>
                <span className="item-icon">🔴</span>
                <span className="item-text">
                  <span className="item-label">Red / Blue Ops</span>
                  <span className="item-desc">Full security console</span>
                </span>
                <span className="ops-badge">Dashboard</span>
              </Link>
            </div>
          </li>

          {/* Features */}
          <li className="nav-item-wrap">
            <button
              className={`apple-nav-link ${activeDropdown === "features" ? "link-active" : ""}`}
              onClick={() => toggleDropdown("features")}
            >
              Features
              <span className={`nav-chevron ${activeDropdown === "features" ? "open" : ""}`}>‹</span>
            </button>
            <div className={`apple-dropdown ${activeDropdown === "features" ? "show" : ""}`}>
              <div className="dropdown-section-label">Resources</div>
              {[
                { to:"/crawler-docs",  icon:"📖", label:"Docs: Web Crawler", desc:"Crawler usage & config"    },
                { to:"/cves",          icon:"🛢️", label:"Critical CVEs",     desc:"Live vulnerability feed"   },
                { to:"/port-scanner",  icon:"🔌", label:"Port Scanning",     desc:"Network exposure analysis" },
              ].map(({ to, icon, label, desc }) => (
                <Link key={to} className={`dropdown-item ${isActive(to) ? "item-active" : ""}`} to={to} onClick={closeAll}>
                  <span className="item-icon">{icon}</span>
                  <span className="item-text">
                    <span className="item-label">{label}</span>
                    <span className="item-desc">{desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </li>

          {/* Auth */}
          {!user ? (
            <li className="nav-item-wrap">
              <Link to="/login" className="apple-btn-outline">Sign In</Link>
            </li>
          ) : (
            <li className="nav-item-wrap nav-auth-group">
              <Link to="/reports" className="apple-btn-success">
                📄 Reports
              </Link>
              <button onClick={handleLogout} className="apple-btn-danger">
                Sign Out
              </button>
              <div className="nav-avatar" title={user.username}>
                {user.username?.charAt(0).toUpperCase()}
              </div>
            </li>
          )}

        </ul>
      </div>
    </nav>
  );
}
