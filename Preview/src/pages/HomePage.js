import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const user = JSON.parse(localStorage.getItem("user"));

  const features = [
    {
      icon: "🔵",
      title: "Blue Team Defense",
      desc: "Identify vulnerabilities, misconfigurations, exposed services, and early compromise indicators.",
      items: ["Port & service discovery", "Web vulnerability detection", "Incident response forensics"],
      accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
    },
    {
      icon: "🔴",
      title: "Red Team Operations",
      desc: "Emulate real-world adversaries to validate detection, response, and data exposure risks.",
      items: ["Attack path simulation", "Post-exploitation analysis", "Credential & data discovery"],
      accent: "#dc2626", bg: "#fef2f2", border: "#fecaca",
    },
    {
      icon: "🧬",
      title: "Digital Forensics",
      desc: "Analyze files, memory dumps, archives, and artifacts to uncover secrets and attacker traces.",
      items: ["Artifact & archive inspection", "Credential detection", "Malware & entropy analysis"],
      accent: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
    },
  ];

  const stats = [
    { value: "5+",    label: "Scan Modules"      },
    { value: "OWASP", label: "Top-10 Coverage"   },
    { value: "MITRE", label: "ATT&CK Mapped"     },
    { value: "DFIR",  label: "Forensics Engine"  },
  ];

  return (
    <div style={{ fontFamily:"system-ui,-apple-system,BlinkMacSystemFont", background:"#f8fafc" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .hp-hero      { animation: fadeUp 0.5s ease both; }
        .hp-card      { background:#fff; border:1.5px solid #e2e8f0; border-radius:20px; padding:1.8rem; transition:all 0.18s; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .hp-card:hover{ transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,0,0,0.09); }
        .hp-btn-primary { background:linear-gradient(135deg,#1e40af,#2563eb); color:#fff; border:none; border-radius:999px; padding:0.7rem 1.8rem; font-size:0.95rem; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:0.5rem; transition:all 0.15s; box-shadow:0 4px 16px rgba(37,99,235,0.25); }
        .hp-btn-primary:hover { filter:brightness(1.08); transform:translateY(-1px); color:#fff; text-decoration:none; box-shadow:0 8px 24px rgba(37,99,235,0.3); }
        .hp-btn-outline { background:transparent; color:#374151; border:1.5px solid #e2e8f0; border-radius:999px; padding:0.7rem 1.8rem; font-size:0.95rem; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:0.5rem; transition:all 0.15s; }
        .hp-btn-outline:hover { border-color:#cbd5e1; background:#f1f5f9; color:#0f172a; text-decoration:none; transform:translateY(-1px); }
        .hp-stat-tile { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:1.2rem 1.5rem; text-align:center; flex:1; min-width:100px; box-shadow:0 2px 8px rgba(0,0,0,0.03); transition:box-shadow 0.15s; }
        .hp-stat-tile:hover { box-shadow:0 4px 20px rgba(0,0,0,0.08); }
        .hp-badge { display:inline-flex; align-items:center; gap:0.4rem; background:#f1f5f9; border:1.5px solid #e2e8f0; border-radius:999px; padding:0.3rem 0.9rem; font-size:0.75rem; font-weight:700; color:#64748b; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:1.2rem; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background:"#fff", borderBottom:"1.5px solid #e2e8f0" }}>
        <div className="container py-5 text-center hp-hero">

          <div className="d-flex justify-content-center">
            <div className="hp-badge">🛡️ Security Operations Platform</div>
          </div>

          <h1 style={{ fontWeight:800, fontSize:"clamp(2.2rem,5vw,3.4rem)", color:"#0f172a", letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:"1rem" }}>
            Secure<span style={{ color:"#2563eb" }}>Net</span>Lite
          </h1>

          <p style={{ fontSize:"clamp(1rem,2vw,1.15rem)", color:"#64748b", maxWidth:640, margin:"0 auto 2rem", lineHeight:1.7 }}>
            A unified security platform for vulnerability scanning, offensive
            operations, and digital forensics — built for modern security teams.
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
            <Link to="/scan"              className="hp-btn-primary">🛡️ Start Security Scan</Link>
            <Link to="/forensics?mode=red" className="hp-btn-outline">🧬 Digital Forensics</Link>
          </div>

          {!user && (
            <p style={{ color:"#94a3b8", fontSize:"0.82rem" }}>
              <Link to="/login" style={{ color:"#2563eb", textDecoration:"none", fontWeight:600 }}>Sign in</Link>
              {" "}to unlock advanced Red & Blue team capabilities
            </p>
          )}

          {/* Stats row */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem", justifyContent:"center", maxWidth:640, margin:"2.5rem auto 0" }}>
            {stats.map(({ value, label }) => (
              <div key={label} className="hp-stat-tile">
                <div style={{ fontSize:"1.3rem", fontWeight:800, color:"#0f172a", lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:"0.72rem", color:"#94a3b8", marginTop:3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Feature Cards ── */}
      <div className="container py-5">
        <div className="text-center mb-5">
          <h2 style={{ fontWeight:700, color:"#0f172a", fontSize:"1.7rem", letterSpacing:"-0.02em" }}>
            Built for Security Professionals
          </h2>
          <p style={{ color:"#94a3b8", marginTop:"0.5rem", fontSize:"0.95rem" }}>
            Precision tools for detection, attack simulation, and investigation
          </p>
        </div>

        <div className="row g-4">
          {features.map(({ icon, title, desc, items, accent, bg, border }) => (
            <div className="col-md-4" key={title}>
              <div className="hp-card h-100">
                <div style={{ width:46, height:46, background:bg, border:`1.5px solid ${border}`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", marginBottom:"1rem" }}>
                  {icon}
                </div>
                <h5 style={{ fontWeight:700, color:"#0f172a", marginBottom:"0.6rem", fontSize:"1rem" }}>
                  {title}
                </h5>
                <p style={{ color:"#64748b", fontSize:"0.85rem", lineHeight:1.65, marginBottom:"1rem" }}>
                  {desc}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                  {items.map(item => (
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.82rem", color:"#475569" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:accent, flexShrink:0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Banner ── */}
      {!user && (
        <div className="container pb-5">
          <div style={{ background:"linear-gradient(135deg,#1e3a8a,#1e40af,#2563eb)", borderRadius:20, padding:"2.5rem 2rem", textAlign:"center", boxShadow:"0 8px 40px rgba(37,99,235,0.25)" }}>
            <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1.5rem", marginBottom:"0.5rem" }}>
              Ready to get started?
            </h3>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:"0.9rem", marginBottom:"1.5rem" }}>
              Create a free account to access the full SOC toolset
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Link to="/register" style={{ background:"#fff", color:"#2563eb", border:"none", borderRadius:999, padding:"0.65rem 1.8rem", fontWeight:700, fontSize:"0.9rem", textDecoration:"none", transition:"all 0.15s" }}
                onMouseEnter={e => e.target.style.background="#f1f5f9"}
                onMouseLeave={e => e.target.style.background="#fff"}>
                Create Account
              </Link>
              <Link to="/login" style={{ background:"transparent", color:"#fff", border:"1.5px solid rgba(255,255,255,0.35)", borderRadius:999, padding:"0.65rem 1.8rem", fontWeight:600, fontSize:"0.9rem", textDecoration:"none", transition:"all 0.15s" }}
                onMouseEnter={e => e.target.style.borderColor="rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.target.style.borderColor="rgba(255,255,255,0.35)"}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ background:"#fff", borderTop:"1.5px solid #e2e8f0" }}>
        <div className="container py-4 text-center">
          <div style={{ fontWeight:700, fontSize:"0.9rem", color:"#0f172a", marginBottom:4 }}>
            Secure<span style={{ color:"#2563eb" }}>Net</span>Lite
          </div>
          <p style={{ color:"#94a3b8", fontSize:"0.78rem", margin:0 }}>
            Designed for SOC Analysts, Red Teams & Security Engineers · Offensive & Defensive Security Platform
          </p>
        </div>
      </div>

    </div>
  );
}
