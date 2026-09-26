import React, { useEffect, useState } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ReportPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [pdfReports, setPdfReports] = useState([]);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchReports = async () => {
      try {
        const res = await API.get("/reports/pdfs");
        setPdfReports(res.data.pdf_reports || []);
      } catch (err) {
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [token]);

  const handleDownload = async (pdfId, filename) => {
    try {
      setDownloading(pdfId);
      const res = await fetch(`http://${window.location.hostname === "localhost" ? "localhost" : window.location.hostname}:8000/report/download/${pdfId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  const scanTypeStyle = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("full"))    return { color:"#d97706", bg:"#fffbeb", border:"#fde68a" };
    if (t.includes("zap") || t.includes("attack") || t.includes("active"))
                               return { color:"#dc2626", bg:"#fef2f2", border:"#fecaca" };
    if (t.includes("crawl"))   return { color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" };
    if (t.includes("forensic"))return { color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc" };
    return                            { color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" };
  };

  // ── Shared empty/loading state layout ──────────────────────────────────────
  const CenterState = ({ icon, title, subtitle, btnLabel, btnAction, btnStyle }) => (
    <div className="container mt-4 mb-5">
      <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:20, padding:"4rem 2rem", textAlign:"center", maxWidth:480, margin:"4rem auto", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize:"2.5rem", marginBottom:"0.8rem" }}>{icon}</div>
        <h4 style={{ fontWeight:700, color:"#0f172a", marginBottom:"0.4rem" }}>{title}</h4>
        <p style={{ color:"#94a3b8", fontSize:"0.88rem", marginBottom:"1.5rem" }}>{subtitle}</p>
        {btnLabel && (
          <button onClick={btnAction} style={{ border:"none", borderRadius:999, padding:"0.65rem 1.6rem", fontWeight:700, fontSize:"0.88rem", cursor:"pointer", ...btnStyle }}>
            {btnLabel}
          </button>
        )}
      </div>
    </div>
  );

  if (!token) return (
    <CenterState icon="🔒" title="Authentication Required" subtitle="Please login to view your reports."
      btnLabel="Go to Login" btnAction={() => navigate("/login")}
      btnStyle={{ background:"linear-gradient(135deg,#3b82f6,#2563eb)", color:"#fff" }} />
  );

  if (loading) return (
    <CenterState icon={
      <span style={{ display:"inline-block", width:36, height:36, border:"3px solid #e2e8f0", borderTopColor:"#2563eb", borderRadius:"50%", animation:"rp-spin 0.8s linear infinite" }} />
    } title="Loading Reports" subtitle="Fetching your scan history…" />
  );

  if (pdfReports.length === 0) return (
    <CenterState icon="📭" title="No Reports Found" subtitle="You haven't generated any scan reports yet."
      btnLabel="Run a Scan" btnAction={() => navigate("/dashboard")}
      btnStyle={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#fff" }} />
  );

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes rp-spin  { to{transform:rotate(360deg)} }
        @keyframes rp-fadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rp-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:1.1rem 1.4rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.03); transition:all 0.15s; animation:rp-fadeUp 0.25s ease both; flex-wrap:wrap; }
        .rp-card:hover { border-color:#cbd5e1; box-shadow:0 6px 24px rgba(0,0,0,0.08); transform:translateY(-1px); }
        .rp-dl-btn { border:none; border-radius:12px; padding:0.55rem 1.2rem; font-weight:700; font-size:0.84rem; cursor:pointer; transition:all 0.15s; background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; white-space:nowrap; display:inline-flex; align-items:center; gap:0.4rem; }
        .rp-dl-btn:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px); }
        .rp-dl-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .rp-badge { border-radius:999px; padding:0.18rem 0.65rem; font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; border:1.5px solid; white-space:nowrap; }
      `}</style>

      {/* Title */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color:"#0f172a", fontSize:"1.6rem" }}>📁 Scan Reports</h2>
        <p style={{ color:"#94a3b8", fontSize:"0.88rem", margin:0 }}>
          Download and review vulnerability & attack reports generated from your scans.
        </p>
      </div>

      {/* Summary bar */}
      <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"0.9rem 1.3rem", marginBottom:"1.2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem", boxShadow:"0 2px 8px rgba(0,0,0,0.03)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
          <span style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#94a3b8" }}>Total Reports</span>
          <span style={{ fontWeight:800, fontSize:"1.1rem", color:"#0f172a" }}>{pdfReports.length}</span>
        </div>
        {user?.username && (
          <div style={{ fontSize:"0.78rem", color:"#94a3b8" }}>
            Logged in as <strong style={{ color:"#475569" }}>{user.username}</strong>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", color:"#dc2626", padding:"0.75rem 1rem", borderRadius:12, fontSize:"0.87rem", marginBottom:"1rem" }}>
          {error}
        </div>
      )}

      {/* Report list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {pdfReports.map((r, i) => {
          const ts = scanTypeStyle(r.scan_type);
          return (
            <div key={r.pdf_id} className="rp-card" style={{ animationDelay:`${i * 0.04}s` }}>

              {/* Icon */}
              <div style={{ width:42, height:42, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>
                📄
              </div>

              {/* Meta */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap", marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:"0.9rem", color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:300 }}>
                    {r.filename}
                  </span>
                  <span className="rp-badge" style={{ background:ts.bg, color:ts.color, borderColor:ts.border }}>
                    {r.scan_type}
                  </span>
                </div>
                <div style={{ fontSize:"0.75rem", color:"#94a3b8" }}>
                  {new Date(r.uploaded_at).toLocaleString()}
                  {r.scanned_by && <span> · by <strong style={{ color:"#64748b" }}>{r.scanned_by}</strong></span>}
                </div>
              </div>

              {/* Download */}
              <button
                className="rp-dl-btn"
                disabled={downloading === r.pdf_id}
                onClick={() => handleDownload(r.pdf_id, r.filename)}
              >
                {downloading === r.pdf_id ? (
                  <><span style={{ width:12,height:12,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"rp-spin 0.7s linear infinite",display:"inline-block" }} />Downloading…</>
                ) : "⬇️ Download"}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
