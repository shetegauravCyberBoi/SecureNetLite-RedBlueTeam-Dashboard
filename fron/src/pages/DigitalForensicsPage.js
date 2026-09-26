import React, { useState } from "react";
import { useLocation } from "react-router-dom";

export default function DigitalForensicsPage() {
  const location = useLocation();
  const mode     = new URLSearchParams(location.search).get("mode") || "red";
  const isRed    = mode === "red";

  const [file,      setFile]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied,    setCopied]    = useState("");

  const handleFileChange = (e) => { setFile(e.target.files[0]); setResult(null); setError(null); setActiveTab("overview"); };

  const handleAnalyze = async () => {
    if (!file) { alert("Please upload a file first"); return; }
    setLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      const token = localStorage.getItem("token");
      const res = await fetch("${API_BASE}/forensics/scan", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
      const data = await res.json();
      setResult(data.results);
    } catch (err) {
      setError(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); };
  const CopyBtn = ({ text, id }) => (
    <button onClick={() => copy(text, id)} title="Copy"
      style={{ background:"transparent", border:"1.5px solid #e2e8f0", borderRadius:6, padding:"0.1rem 0.4rem", cursor:"pointer", fontSize:"0.75rem", flexShrink:0, transition:"all 0.15s" }}>
      {copied === id ? "✅" : "📋"}
    </button>
  );

  const getThreat = (s) => s >= 75 ? { label:"MALICIOUS",  c:"#dc2626", bg:"#fef2f2", b:"#fecaca" }
                         : s >= 40 ? { label:"SUSPICIOUS", c:"#d97706", bg:"#fffbeb", b:"#fde68a" }
                         :           { label:"CLEAN",       c:"#16a34a", bg:"#f0fdf4", b:"#bbf7d0" };
  const entropyC = (e) => e > 7 ? "#dc2626" : e > 5 ? "#d97706" : "#16a34a";
  const entropyL = (e) => e > 7 ? "encrypted/packed" : e > 5 ? "compressed" : "normal";

  const rf        = result?.root_file;
  const threat    = rf ? getThreat(rf.threat_score ?? 0) : null;
  const pe        = rf?.pe;
  const iocs      = rf?.iocs      ?? {};
  const exif      = rf?.exif      ?? {};
  const mitre     = result?.mitre_techniques ?? [];
  const insights  = result?.insights         ?? [];
  const extracted = result?.extracted_files  ?? [];

  const TABS = [
    { id:"overview",  label:"📋 Overview"  },
    { id:"iocs",      label:"🌐 IOCs",      badge: iocs.total       },
    { id:"binary",    label:"⚙️ Binary"                             },
    { id:"metadata",  label:"🗂️ Metadata"                           },
    { id:"insights",  label:"🎯 Insights",  badge: insights.length  },
    { id:"extracted", label:"📂 Extracted", badge: extracted.length },
  ];

  const accent = isRed ? "#dc2626" : "#2563eb";
  const accentBg = isRed ? "#fef2f2" : "#eff6ff";
  const accentBorder = isRed ? "#fecaca" : "#bfdbfe";

  return (
    <div className="container mt-4 mb-5">
      <style>{`
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes fadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .df-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; overflow:hidden; margin-bottom:1rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .df-hdr  { background:#f8fafc; border-bottom:1.5px solid #f1f5f9; padding:0.65rem 1.2rem; font-size:0.75rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#64748b; display:flex; align-items:center; justify-content:space-between; }
        .df-body { padding:1.1rem 1.3rem; }
        .df-tab  { background:transparent; border:1.5px solid #e2e8f0; color:#94a3b8; border-radius:999px; padding:0.32rem 0.85rem; font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:0.3rem; }
        .df-tab:hover { border-color:#cbd5e1; color:#475569; }
        .df-tab.active { font-weight:700; color:#fff; }
        .df-badge { border-radius:999px; padding:0.15rem 0.55rem; font-size:0.68rem; font-weight:700; text-transform:uppercase; border:1px solid; }
        .df-tbl  { width:100%; border-collapse:collapse; font-size:0.83rem; }
        .df-tbl th { background:#f8fafc; color:#64748b; padding:0.5rem 0.8rem; font-weight:700; font-size:0.72rem; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1.5px solid #e2e8f0; text-align:left; }
        .df-tbl td { padding:0.5rem 0.8rem; border-bottom:1px solid #f1f5f9; color:#374151; vertical-align:top; }
        .df-tbl tr:last-child td { border-bottom:none; }
        .df-tbl tr:hover td { background:#f8fafc; }
        .df-row  { display:flex; align-items:center; justify-content:space-between; padding:0.45rem 0; border-bottom:1px solid #f8fafc; font-size:0.82rem; }
        .df-row:last-child { border-bottom:none; }
        .df-stat { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:0.8rem 1rem; text-align:center; flex:1; min-width:80px; transition:box-shadow 0.15s; }
        .df-stat:hover { box-shadow:0 4px 16px rgba(0,0,0,0.07); }
        .df-result { animation:fadeUp 0.3s ease; }
        .df-scroll { max-height:220px; overflow-y:auto; }
        .df-field { border:1.5px solid #e2e8f0; border-radius:12px; padding:0.7rem 1rem; font-size:0.9rem; color:#0f172a; width:100%; transition:border-color 0.15s; }
        .df-field:focus { outline:none; border-color:${accent}; box-shadow:0 0 0 3px ${accentBg}; }
        .df-run { border:none; border-radius:12px; padding:0.75rem; width:100%; font-weight:700; font-size:0.92rem; cursor:pointer; transition:all 0.15s; color:#fff; display:flex; align-items:center; justify-content:center; gap:0.5rem; background:linear-gradient(135deg,${isRed?"#f87171,#dc2626":"#60a5fa,#2563eb"}); }
        .df-run:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px); }
        .df-run:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .df-pill { display:inline-block; border-radius:8px; padding:0.18rem 0.6rem; font-family:monospace; font-size:0.8rem; font-weight:600; margin:0.18rem; }
      `}</style>

      {/* Title */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color:"#0f172a", fontSize:"1.6rem" }}>
          {isRed ? "🔴" : "🔵"} Digital Forensics Console
          <span className="ms-2" style={{ fontSize:"0.75rem", fontWeight:700, background:accentBg, color:accent, border:`1.5px solid ${accentBorder}`, borderRadius:999, padding:"0.2rem 0.7rem", letterSpacing:"0.07em", textTransform:"uppercase" }}>
            {mode} mode
          </span>
        </h2>
        <p style={{ color:"#94a3b8", fontSize:"0.88rem", margin:0 }}>
          {isRed ? "Post-exploitation forensic analysis & loot inspection" : "Incident response & defensive forensic analysis"}
        </p>
      </div>

      {/* Upload Card */}
      <div className="df-card">
        <div className="df-hdr">📁 Upload Artifact</div>
        <div className="df-body">
          <input type="file" className="df-field" style={{ marginBottom:"1rem" }} onChange={handleFileChange} />
          <small style={{ color:"#94a3b8", fontSize:"0.78rem", display:"block", marginBottom:"1rem" }}>
            Supported: ZIPs, EXE/ELF binaries, images, documents, scripts, memory dumps, logs
          </small>
          <button className="df-run" onClick={handleAnalyze} disabled={loading}>
            {loading
              ? <><span style={{ width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />Analyzing…</>
              : "🔍 Run Forensic Analysis"}
          </button>
        </div>
      </div>

      {error && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", color:"#dc2626", padding:"0.75rem 1rem", borderRadius:12, fontSize:"0.87rem", marginBottom:"1rem" }}>{error}</div>}

      {/* Results */}
      {result && rf && (
        <div className="df-result">

          {/* Threat Banner */}
          <div style={{ background:threat.bg, border:`1.5px solid ${threat.b}`, borderRadius:14, padding:"1rem 1.3rem", marginBottom:"1rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
            <div>
              <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:threat.c, marginBottom:2 }}>Threat Assessment</div>
              <div style={{ fontSize:"1.5rem", fontWeight:800, color:threat.c, lineHeight:1 }}>{threat.label}</div>
              <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:3 }}>{result.total_files_analyzed} file(s) · Mode: {result.scan_mode?.toUpperCase()}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.7rem", color:"#94a3b8", marginBottom:2 }}>Threat Score</div>
              <div style={{ fontSize:"2rem", fontWeight:800, color:threat.c, lineHeight:1 }}>{rf.threat_score ?? 0}<span style={{ fontSize:"0.9rem", color:"#94a3b8" }}> / 100</span></div>
            </div>
          </div>

          {/* MIME Mismatch */}
          {rf.mime_mismatch && (
            <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:12, padding:"0.75rem 1rem", marginBottom:"1rem", fontSize:"0.85rem", color:"#dc2626" }}>
              ⚠️ <strong>File Type Mismatch:</strong> Extension <code>{rf.extension}</code> does not match detected MIME <code>{rf.mime}</code>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem", marginBottom:"1.2rem", borderBottom:"1.5px solid #f1f5f9", paddingBottom:"0.7rem" }}>
            {TABS.map(tab => (
              <button key={tab.id} className={`df-tab ${activeTab===tab.id?"active":""}`}
                style={activeTab===tab.id ? { background:accent, borderColor:accent } : {}}
                onClick={() => setActiveTab(tab.id)}>
                {tab.label}
                {tab.badge > 0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:999, padding:"0 0.35rem", fontSize:"0.68rem", fontWeight:700 }}>{tab.badge}</span>}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="df-card">
                  <div className="df-hdr">📄 File Identity</div>
                  <div className="df-body" style={{ padding:"0.5rem" }}>
                    <table className="df-tbl">
                      <tbody>
                        {[
                          ["Filename",  <code>{rf.file}</code>],
                          ["Extension", <code>{rf.extension||"none"}</code>],
                          ["Size",      `${rf.size_kb} KB`],
                          ["MIME",      <><code>{rf.mime}</code>{rf.mime_mismatch&&<span className="df-badge ms-1" style={{background:"#fef2f2",color:"#dc2626",borderColor:"#fecaca"}}>MISMATCH</span>}</>],
                          ["Entropy",   <><span style={{fontWeight:700,color:entropyC(rf.entropy)}}>{rf.entropy}</span><small style={{color:"#94a3b8",marginLeft:6}}>({entropyL(rf.entropy)})</small></>],
                          ["Strings",   `${rf.strings_count?.toLocaleString()} extracted`],
                        ].map(([k,v])=>(
                          <tr key={k}><td style={{color:"#94a3b8",width:"38%",fontSize:"0.78rem"}}>{k}</td><td>{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="df-card">
                  <div className="df-hdr">🔑 Cryptographic Hashes</div>
                  <div className="df-body">
                    {[["MD5", rf.hashes?.md5], ["SHA256", rf.hashes?.sha256]].map(([label,value])=>(
                      <div key={label} style={{ marginBottom:"0.9rem" }}>
                        <div style={{ fontSize:"0.72rem", fontWeight:700, color:"#94a3b8", marginBottom:4 }}>{label}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <code style={{ fontSize:"0.78rem", wordBreak:"break-all", flex:1, color:"#475569" }}>{value}</code>
                          <CopyBtn text={value} id={`hash-${label}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {rf.credentials?.length > 0 && (
                <div className="col-12">
                  <div className="df-card" style={{ borderColor:"#fecaca" }}>
                    <div className="df-hdr" style={{ color:"#dc2626" }}>🔓 Credential Artifacts<span className="df-badge" style={{background:"#fef2f2",color:"#dc2626",borderColor:"#fecaca"}}>{rf.credentials.length}</span></div>
                    <div className="df-body df-scroll">
                      {rf.credentials.map((c,i)=>(
                        <div key={i} className="df-row"><code style={{fontSize:"0.8rem",color:"#dc2626",wordBreak:"break-all",flex:1}}>{c}</code><CopyBtn text={c} id={`cred-${i}`}/></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {rf.yara?.length > 0 && (
                <div className="col-12">
                  <div className="df-card" style={{ borderColor:"#fde68a" }}>
                    <div className="df-hdr" style={{ color:"#d97706" }}>🧬 YARA Matches<span className="df-badge" style={{background:"#fffbeb",color:"#d97706",borderColor:"#fde68a"}}>{rf.yara.length}</span></div>
                    <div className="df-body">{rf.yara.map((y,i)=><span key={i} className="df-pill" style={{background:"#fffbeb",color:"#d97706",border:"1px solid #fde68a"}}>{y}</span>)}</div>
                  </div>
                </div>
              )}
              {rf.mac_times && (
                <div className="col-12">
                  <div className="df-card">
                    <div className="df-hdr">🕐 MAC Times</div>
                    <div className="df-body" style={{ padding:"0.5rem" }}>
                      <table className="df-tbl"><tbody>
                        {[["Modified",rf.mac_times.modified],["Accessed",rf.mac_times.accessed],["Created",rf.mac_times.created]].map(([k,v])=>(
                          <tr key={k}><td style={{color:"#94a3b8",width:"25%",fontSize:"0.78rem"}}>{k}</td><td><div style={{display:"flex",gap:8,alignItems:"center"}}><code style={{fontSize:"0.8rem"}}>{v}</code><CopyBtn text={v} id={`mac-${k}`}/></div></td></tr>
                        ))}
                      </tbody></table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ IOCs ══ */}
          {activeTab === "iocs" && (
            <div className="row g-3">
              <div className="col-12">
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.7rem" }}>
                  {[
                    {label:"URLs",        count:iocs.urls?.length??0,        c:"#2563eb", bg:"#eff6ff", b:"#bfdbfe"},
                    {label:"Public IPs",  count:iocs.ips?.length??0,         c:"#dc2626", bg:"#fef2f2", b:"#fecaca"},
                    {label:"Private IPs", count:iocs.private_ips?.length??0, c:"#64748b", bg:"#f8fafc", b:"#e2e8f0"},
                    {label:"Domains",     count:iocs.domains?.length??0,     c:"#d97706", bg:"#fffbeb", b:"#fde68a"},
                    {label:"Emails",      count:iocs.emails?.length??0,      c:"#0891b2", bg:"#ecfeff", b:"#a5f3fc"},
                  ].map(({label,count,c,bg,b})=>(
                    <div key={label} className="df-stat" style={{ borderColor:b, background:bg }}>
                      <div style={{ fontSize:"1.5rem", fontWeight:800, color:c, lineHeight:1 }}>{count}</div>
                      <div style={{ fontSize:"0.72rem", color:"#94a3b8", marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {[
                {label:"🌍 Embedded URLs",    data:iocs.urls,        keyPfx:"url"},
                {label:"📡 Public IPs",       data:iocs.ips,         keyPfx:"ip"},
                {label:"🏠 Private IPs",      data:iocs.private_ips, keyPfx:"pip"},
                {label:"🏢 Domains",          data:iocs.domains,     keyPfx:"dom"},
                {label:"📧 Email Addresses",  data:iocs.emails,      keyPfx:"email"},
              ].map(({label,data,keyPfx})=>(
                <div className="col-md-6" key={keyPfx}>
                  <div className="df-card">
                    <div className="df-hdr">{label}<span style={{ background:"#f1f5f9", color:"#64748b", borderRadius:999, padding:"0.1rem 0.5rem", fontSize:"0.68rem", fontWeight:700 }}>{data?.length??0}</span></div>
                    <div className="df-body df-scroll">
                      {data?.length > 0
                        ? data.map((v,i)=><div key={i} className="df-row"><code style={{fontSize:"0.8rem",wordBreak:"break-all",flex:1}}>{v}</code><CopyBtn text={v} id={`${keyPfx}-${i}`}/></div>)
                        : <div style={{color:"#94a3b8",fontSize:"0.82rem"}}>None detected</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ BINARY ══ */}
          {activeTab === "binary" && (
            <div className="row g-3">
              {pe ? (
                <>
                  <div className="col-md-6">
                    <div className="df-card">
                      <div className="df-hdr">🪟 PE Header</div>
                      <div className="df-body" style={{padding:"0.5rem"}}>
                        <table className="df-tbl"><tbody>
                          {[
                            ["Entry Point", <code>{pe.entry_point}</code>],
                            ["Compile Time",<code style={{fontSize:"0.78rem"}}>{pe.compile_time}</code>],
                            ["Type",        <>{pe.is_dll&&<span className="df-badge me-1" style={{background:"#f1f5f9",color:"#475569",borderColor:"#e2e8f0"}}>DLL</span>}{pe.is_exe&&<span className="df-badge" style={{background:"#1e293b",color:"#fff",borderColor:"#1e293b"}}>EXE</span>}</>],
                            ["Imports",     pe.imports_count],
                            ["Packer",      pe.packer?<span className="df-badge" style={{background:"#fffbeb",color:"#d97706",borderColor:"#fde68a"}}>{pe.packer}</span>:<span style={{color:"#16a34a",fontSize:"0.8rem"}}>None detected</span>],
                          ].map(([k,v])=>(
                            <tr key={k}><td style={{color:"#94a3b8",width:"40%",fontSize:"0.78rem"}}>{k}</td><td>{v}</td></tr>
                          ))}
                        </tbody></table>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="df-card">
                      <div className="df-hdr">📦 PE Sections</div>
                      <div className="df-body" style={{padding:0}}>
                        <table className="df-tbl">
                          <thead><tr><th>Name</th><th>Entropy</th><th>Size</th><th></th></tr></thead>
                          <tbody>
                            {pe.sections?.map((s,i)=>(
                              <tr key={i}>
                                <td><code style={{fontSize:"0.8rem"}}>{s.name||"(unnamed)"}</code></td>
                                <td><span style={{fontWeight:700,color:entropyC(s.entropy)}}>{s.entropy}</span></td>
                                <td style={{color:"#94a3b8",fontSize:"0.78rem"}}>{s.size} B</td>
                                <td>{s.suspicious&&<span className="df-badge" style={{background:"#fef2f2",color:"#dc2626",borderColor:"#fecaca"}}>⚠️</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  {pe.suspicious_imports?.length > 0 && (
                    <div className="col-12">
                      <div className="df-card" style={{borderColor:"#fecaca"}}>
                        <div className="df-hdr" style={{color:"#dc2626"}}>🚨 Suspicious API Imports<span className="df-badge" style={{background:"#fef2f2",color:"#dc2626",borderColor:"#fecaca"}}>{pe.suspicious_imports.length}</span></div>
                        <div className="df-body">
                          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                            {pe.suspicious_imports.map((imp,i)=><span key={i} className="df-pill" style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca"}}>{imp}</span>)}
                          </div>
                          <div style={{fontSize:"0.78rem",color:"#94a3b8"}}>These functions indicate process injection, evasion, persistence, or C2 communication capability</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-12"><div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"1rem",color:"#64748b",fontSize:"0.88rem"}}>Not a Windows PE binary — PE analysis not applicable</div></div>
              )}
              {rf.lief && (
                <div className="col-md-6">
                  <div className="df-card">
                    <div className="df-hdr">⚙️ Binary Format (LIEF)</div>
                    <div className="df-body" style={{padding:"0.5rem"}}>
                      <table className="df-tbl"><tbody>
                        <tr><td style={{color:"#94a3b8",width:"40%",fontSize:"0.78rem"}}>Format</td><td><span className="df-badge" style={{background:"#1e293b",color:"#fff",borderColor:"#1e293b"}}>{rf.lief.format}</span></td></tr>
                        <tr><td style={{color:"#94a3b8",fontSize:"0.78rem"}}>Architecture</td><td><span className="df-badge" style={{background:"#f1f5f9",color:"#475569",borderColor:"#e2e8f0"}}>{rf.lief.arch}</span></td></tr>
                      </tbody></table>
                    </div>
                  </div>
                </div>
              )}
              {mitre.length > 0 && (
                <div className="col-12">
                  <div className="df-card">
                    <div className="df-hdr">🗺️ MITRE ATT&CK<span className="df-badge" style={{background:"#1e293b",color:"#fff",borderColor:"#1e293b"}}>{mitre.length}</span></div>
                    <div className="df-body">
                      <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem"}}>
                        {mitre.map((t,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"0.4rem 0.8rem"}}>
                            <span className="df-badge" style={{background:"#1e293b",color:"#fff",borderColor:"#1e293b"}}>{t.id}</span>
                            <span style={{fontSize:"0.8rem",color:"#374151"}}>{t.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ METADATA ══ */}
          {activeTab === "metadata" && (
            <div className="row g-3">
              <div className="col-12">
                <div className="df-card">
                  <div className="df-hdr">📸 EXIF Metadata<span style={{background:"#f1f5f9",color:"#64748b",borderRadius:999,padding:"0.1rem 0.5rem",fontSize:"0.68rem",fontWeight:700}}>{Object.keys(exif).length} fields</span></div>
                  <div className="df-body" style={{padding:0}}>
                    {Object.keys(exif).length > 0
                      ? <div className="df-scroll"><table className="df-tbl"><tbody>
                          {Object.entries(exif).map(([k,v])=>(
                            <tr key={k}>
                              <td style={{color:"#94a3b8",width:"35%",fontWeight:600,fontSize:"0.78rem"}}>{k}</td>
                              <td><div style={{display:"flex",gap:8,alignItems:"center"}}><code style={{fontSize:"0.78rem",wordBreak:"break-all",flex:1}}>{v}</code><CopyBtn text={v} id={`exif-${k}`}/></div></td>
                            </tr>
                          ))}
                        </tbody></table></div>
                      : <div style={{padding:"1rem",color:"#94a3b8",fontSize:"0.82rem"}}>No EXIF metadata found — file may have had metadata stripped or is not an image</div>}
                  </div>
                </div>
              </div>
              {rf.mac_times && (
                <div className="col-12">
                  <div className="df-card">
                    <div className="df-hdr">🕐 MAC Times — File Timeline</div>
                    <div className="df-body" style={{padding:"0.5rem"}}>
                      <table className="df-tbl"><tbody>
                        {[["Modified",rf.mac_times.modified],["Accessed",rf.mac_times.accessed],["Created",rf.mac_times.created]].map(([k,v])=>(
                          <tr key={k}><td style={{color:"#94a3b8",width:"25%",fontSize:"0.78rem"}}>{k}</td><td><div style={{display:"flex",gap:8,alignItems:"center"}}><code style={{fontSize:"0.8rem"}}>{v}</code><CopyBtn text={v} id={`mac2-${k}`}/></div></td></tr>
                        ))}
                      </tbody></table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ INSIGHTS ══ */}
          {activeTab === "insights" && (
            <div className="row g-3">
              {insights.length > 0 ? (
                <>
                  {insights.map((insight,idx)=>(
                    <div className="col-12" key={idx}>
                      <div style={{ background:accentBg, border:`1.5px solid ${accentBorder}`, borderRadius:12, padding:"0.85rem 1rem", display:"flex", gap:"0.8rem", alignItems:"flex-start", fontSize:"0.85rem", color:"#374151" }}>
                        <span style={{ fontSize:"1.1rem", flexShrink:0 }}>{isRed?"🎯":"🛡️"}</span>
                        <div><strong style={{color:accent}}>{isRed?"Red Team:":"Blue Team:"} </strong>{insight}</div>
                      </div>
                    </div>
                  ))}
                  {mitre.length > 0 && (
                    <div className="col-12">
                      <div className="df-card">
                        <div className="df-hdr">🗺️ MITRE ATT&CK Techniques<span className="df-badge" style={{background:"#1e293b",color:"#fff",borderColor:"#1e293b"}}>{mitre.length}</span></div>
                        <div className="df-body">
                          <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem"}}>
                            {mitre.map((t,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"0.4rem 0.8rem"}}>
                                <span className="df-badge" style={{background:"#1e293b",color:"#fff",borderColor:"#1e293b"}}>{t.id}</span>
                                <span style={{fontSize:"0.8rem"}}>{t.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-12"><div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:12,padding:"1rem",color:"#16a34a",fontSize:"0.88rem"}}>✅ No suspicious indicators detected for {mode} mode analysis</div></div>
              )}
            </div>
          )}

          {/* ══ EXTRACTED ══ */}
          {activeTab === "extracted" && (
            <div>
              {extracted.length > 0
                ? extracted.map((f,idx)=>{
                    const ft = getThreat(f.threat_score??0);
                    return (
                      <div key={idx} className="df-card" style={{ marginBottom:"0.7rem" }}>
                        <details>
                          <summary style={{ padding:"0.85rem 1.2rem", cursor:"pointer", listStyle:"none", display:"flex", flexWrap:"wrap", alignItems:"center", gap:"0.5rem", background:"#f8fafc", borderBottom:"1.5px solid #f1f5f9" }}>
                            <code style={{ fontWeight:700, fontSize:"0.85rem" }}>{f.file}</code>
                            <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>{f.size_kb} KB</span>
                            <span className="df-badge" style={{ background:`${entropyC(f.entropy)}18`, color:entropyC(f.entropy), borderColor:`${entropyC(f.entropy)}44` }}>Entropy: {f.entropy}</span>
                            <span className="df-badge" style={{ background:ft.bg, color:ft.c, borderColor:ft.b }}>{ft.label}</span>
                            {f.credentials?.length>0&&<span className="df-badge" style={{background:"#fef2f2",color:"#dc2626",borderColor:"#fecaca"}}>🔑 {f.credentials.length} Creds</span>}
                            {f.yara?.length>0&&<span className="df-badge" style={{background:"#fffbeb",color:"#d97706",borderColor:"#fde68a"}}>🧬 YARA</span>}
                            {f.mime_mismatch&&<span className="df-badge" style={{background:"#fef2f2",color:"#dc2626",borderColor:"#fecaca"}}>⚠️ Mismatch</span>}
                            {f.iocs?.total>0&&<span className="df-badge" style={{background:"#eff6ff",color:"#2563eb",borderColor:"#bfdbfe"}}>{f.iocs.total} IOCs</span>}
                          </summary>
                          <div style={{ padding:"1rem 1.2rem" }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.8rem", marginBottom:"0.8rem" }}>
                              <div><div style={{fontSize:"0.7rem",color:"#94a3b8",fontWeight:700,marginBottom:2}}>MIME</div><code style={{fontSize:"0.8rem"}}>{f.mime}</code></div>
                              <div><div style={{fontSize:"0.7rem",color:"#94a3b8",fontWeight:700,marginBottom:2}}>THREAT SCORE</div><span className="df-badge" style={{background:ft.bg,color:ft.c,borderColor:ft.b}}>{f.threat_score??0} / 100 — {ft.label}</span></div>
                            </div>
                            {[["MD5",f.hashes?.md5,`emd5-${idx}`],["SHA256",f.hashes?.sha256,`esha-${idx}`]].map(([label,val,id])=>(
                              <div key={label} style={{marginBottom:"0.5rem"}}>
                                <div style={{fontSize:"0.7rem",color:"#94a3b8",fontWeight:700,marginBottom:2}}>{label}</div>
                                <div style={{display:"flex",gap:8,alignItems:"center"}}><code style={{fontSize:"0.75rem",wordBreak:"break-all",flex:1}}>{val}</code><CopyBtn text={val} id={id}/></div>
                              </div>
                            ))}
                            {f.credentials?.length>0&&<div style={{marginBottom:"0.5rem"}}><div style={{fontSize:"0.7rem",color:"#dc2626",fontWeight:700,marginBottom:4}}>Credentials ({f.credentials.length})</div><div style={{maxHeight:100,overflowY:"auto"}}>{f.credentials.slice(0,10).map((c,ci)=><div key={ci}><code style={{fontSize:"0.75rem",color:"#dc2626"}}>{c}</code></div>)}</div></div>}
                            {f.iocs?.urls?.length>0&&<div style={{marginBottom:"0.5rem"}}><div style={{fontSize:"0.7rem",color:"#94a3b8",fontWeight:700,marginBottom:4}}>URLs ({f.iocs.urls.length})</div>{f.iocs.urls.slice(0,5).map((u,ui)=><div key={ui}><code style={{fontSize:"0.75rem"}}>{u}</code></div>)}</div>}
                            {f.yara?.length>0&&<div><div style={{fontSize:"0.7rem",color:"#94a3b8",fontWeight:700,marginBottom:4}}>YARA Matches</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{f.yara.map((y,yi)=><span key={yi} className="df-pill" style={{background:"#fffbeb",color:"#d97706",border:"1px solid #fde68a"}}>{y}</span>)}</div></div>}
                          </div>
                        </details>
                      </div>
                    );
                  })
                : <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"1rem",color:"#94a3b8",fontSize:"0.88rem"}}>No archive contents — file was not a ZIP or extractable archive</div>}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
