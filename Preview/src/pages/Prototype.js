// src/pages/Prototype.js
// ─────────────────────────────────────────────────────────────────
// PLACE THIS FILE  →  src/pages/Prototype.js
// PLACE CSS FILE   →  src/pages/Prototype.css
// No other changes needed — App.js already routes /prototype here
// Backend calls are NOT wired (UI only, all mock data)
// ─────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Prototype.css";

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const TABS = [
  { id: "overview",    label: "00 OVERVIEW",     icon: "⬛", count: 4,  kc: null },
  { id: "recon",       label: "01 RECON",         icon: "🔭", count: 6,  kc: 0   },
  { id: "exploit",     label: "02 EXPLOIT",       icon: "💥", count: 5,  kc: 1   },
  { id: "postexploit", label: "03 POST-EXPLOIT",  icon: "🎯", count: 3,  kc: 2   },
  { id: "forensics",   label: "04 FORENSICS",     icon: "🧬", count: 2,  kc: 3   },
  { id: "reports",     label: "05 REPORTS",       icon: "📁", count: 7,  kc: 4   },
];

// kill-chain step index → tab kc value mapping
const KC_LABELS = ["RECON", "EXPLOIT", "POST-EXPLOIT", "FORENSICS", "REPORT"];

// ═══════════════════════════════════════════════════════════════════
//  TINY SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Live clock — HH:MM:SS */
function useClock() {
  const [t, setT] = useState(() => new Date().toTimeString().slice(0, 8));
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toTimeString().slice(0, 8)), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/** Animate a sequence of terminal lines with delays */
function useMockRun() {
  const [status, setStatus] = useState("idle"); // idle | running | done
  const [lines,  setLines]  = useState([]);
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback((steps, finishMs) => {
    clearTimers();
    setStatus("running");
    setLines([]);
    steps.forEach(({ delay, line }) => {
      const t = setTimeout(() => setLines(p => [...p, line]), delay);
      timers.current.push(t);
    });
    const t = setTimeout(() => setStatus("done"), finishMs);
    timers.current.push(t);
  }, []);

  useEffect(() => () => clearTimers(), []);
  return { status, lines, run };
}

// ═══════════════════════════════════════════════════════════════════
//  REUSABLE PRIMITIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════

/** <StatusPill status="idle|running|done|error" label="..." /> */
function StatusPill({ status, label }) {
  const labels = { idle: "READY", running: "SCANNING", done: "COMPLETE", error: "ERROR" };
  return (
    <div className={`snl-status-pill ${status}`}>
      <div className="snl-sp-dot" />
      {label || labels[status] || status.toUpperCase()}
    </div>
  );
}

/** Terminal output box */
function Terminal({ lines = [], running = false, small = false, placeholderText }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className={`snl-terminal${small ? " sm" : ""}`} ref={ref}>
      {lines.length === 0 && !running && (
        <div className="snl-t-line">
          <span className="snl-t-dim">{placeholderText || "// awaiting input..."}</span>
          <span className="snl-t-cursor" />
        </div>
      )}
      {lines.map((l, i) => (
        <div className="snl-t-line" key={i}>
          {l.prefix && (
            <span className={`snl-t-${l.prefixCls || "ok"}`}>{l.prefix}</span>
          )}
          {l.sep && <span className="snl-t-sep">{l.sep}</span>}
          <span className={`snl-t-${l.cls || "val"}`}>{l.text}</span>
          {l.extra && (
            <span className={`snl-t-${l.extraCls || "val"}`}>{l.extra}</span>
          )}
        </div>
      ))}
      {running && <span className="snl-t-cursor" />}
    </div>
  );
}

/** Panel card wrapper */
function Panel({ color = "red", icon, title, sub, tag, tagColor, className = "", children }) {
  return (
    <div className={`snl-panel ${color} ${className}`}>
      <div className="snl-panel-hdr">
        <div className={`snl-panel-icon ${color}`}>{icon}</div>
        <div className="snl-panel-title-wrap">
          <div className="snl-panel-title">{title}</div>
          <div className="snl-panel-sub">{sub}</div>
        </div>
        {tag && (
          <div className={`snl-panel-tag ${tagColor || color}`}>{tag}</div>
        )}
      </div>
      <div className="snl-panel-body">{children}</div>
    </div>
  );
}

/** Phase label */
function PhaseBadge({ color = "red", children }) {
  return <div className={`snl-phase-badge ${color}`}>{children}</div>;
}

/** Small labelled form field wrapper */
function Field({ label, children }) {
  return (
    <div>
      <div className="snl-field-label">{label}</div>
      {children}
    </div>
  );
}

/** Score ring SVG widget */
function ScoreRing({ score, color = "red", label, sub1, sub2 }) {
  const r = 28, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const stroke = color === "red" ? "#ff2d3a" : "#00d4ff";
  return (
    <div className="snl-score-widget">
      <div className="snl-score-ring">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#1a2030" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={r} fill="none" stroke={stroke} strokeWidth="6"
            strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          />
        </svg>
        <div className="snl-score-center" style={{ color: stroke }}>
          {score}<small>/100</small>
        </div>
      </div>
      <div className="snl-score-meta">
        <h4 style={{ color: stroke }}>{label}</h4>
        {sub1 && <p>{sub1}</p>}
        {sub2 && <p style={{ marginTop: "0.3rem" }}>{sub2}</p>}
      </div>
    </div>
  );
}

/** Forensic key/value row */
function ForensicRow({ k, v, cls = "" }) {
  return (
    <div className="snl-forensic-field">
      <span className="snl-ff-key">{k}</span>
      <span className={`snl-ff-val ${cls}`}>{v}</span>
    </div>
  );
}

/** Alert feed item */
function AlertItem({ sev, title, body, time }) {
  return (
    <div className="snl-alert-item">
      <div className={`snl-alert-sev snl-sev-${sev}`} />
      <div className="snl-alert-text">
        <strong>{title}</strong> — {body}
      </div>
      <div className="snl-alert-time">{time}</div>
    </div>
  );
}

/** Findings table row */
function FindingRow({ children }) {
  return <div className="snl-finding-row">{children}</div>;
}

/** Toggle switch */
function Toggle({ label, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="snl-toggle-row">
      {label}
      <label className="snl-toggle">
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
        <div className="snl-toggle-slider" />
      </label>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE: OVERVIEW
// ═══════════════════════════════════════════════════════════════════
function PageOverview({ team }) {
  const accent = team === "red" ? "snl-accent-red" : "snl-accent-blue";
  const teamLabel = team === "red" ? "🔴 RED TEAM" : "🔵 BLUE TEAM";

  return (
    <div className="snl-content">
      <div className="snl-section-hdr">
        <h2>OPS <span className={accent}>{teamLabel}</span> OVERVIEW</h2>
        <p>// active engagement status — HTB target environment</p>
      </div>

      {/* ── Metrics ── */}
      <div className="snl-metrics-row">
        <div className="snl-metric-card" style={{ "--m-color": "var(--red)" }}>
          <div className="snl-metric-label">OPEN PORTS</div>
          <div className="snl-metric-value" style={{ color: "var(--red)" }}>12</div>
          <div className="snl-metric-sub">3 high-risk exposed</div>
        </div>
        <div className="snl-metric-card" style={{ "--m-color": "var(--yellow)" }}>
          <div className="snl-metric-label">VULNERABILITIES</div>
          <div className="snl-metric-value" style={{ color: "var(--yellow)" }}>7</div>
          <div className="snl-metric-sub">2 critical · 3 high</div>
        </div>
        <div className="snl-metric-card" style={{ "--m-color": "var(--blue)" }}>
          <div className="snl-metric-label">ENDPOINTS FOUND</div>
          <div className="snl-metric-value" style={{ color: "var(--blue)" }}>43</div>
          <div className="snl-metric-sub">via spider + enum</div>
        </div>
        <div className="snl-metric-card" style={{ "--m-color": "var(--green)" }}>
          <div className="snl-metric-label">HEALTH SCORE</div>
          <div className="snl-metric-value" style={{ color: "var(--green)" }}>32</div>
          <div className="snl-metric-sub">AT RISK</div>
        </div>
      </div>

      <div className="snl-grid-2">
        {/* Alert Feed */}
        <Panel color="red" icon="⚠️" title="Live Alert Feed" sub="REAL-TIME · AUTO-REFRESH" tag="ACTIVE">
          <div className="snl-alert-feed">
            <AlertItem sev="crit" title="SQLi detected"
              body="POST /login param `username` vulnerable to blind injection" time="00:12" />
            <AlertItem sev="high" title="Exposed .env"
              body="HTTP 200 on /.env reveals DB_PASSWORD" time="00:09" />
            <AlertItem sev="med"  title="Open redirect"
              body="/redirect?url= allows external navigation" time="00:07" />
            <AlertItem sev="high" title="Port 445 open"
              body="SMB exposed, check EternalBlue CVE-2017-0144" time="00:04" />
            <AlertItem sev="low"  title="Missing security headers"
              body="No CSP, X-Frame-Options absent" time="00:01" />
          </div>
        </Panel>

        {/* Target Intelligence */}
        <Panel color="blue" icon="🎯" title="Target Intelligence" sub="ASSET PROFILE">
          <ForensicRow k="target_ip"    v="10.10.10.5"                          cls="info" />
          <ForensicRow k="hostname"     v="lame.htb" />
          <ForensicRow k="os"           v="Linux Ubuntu 18.04" />
          <ForensicRow k="open_ports"   v="21, 22, 80, 139, 445, 3306, 8080"   cls="warn" />
          <ForensicRow k="web_server"   v="Apache/2.4.18" />
          <ForensicRow k="threat_level" v="CRITICAL"                            cls="danger" />
          <ForensicRow k="scan_phase"   v="exploitation"                        cls="ok" />
          <hr className="snl-divider" />
          <ScoreRing score={32} color="red" label="AT RISK"
            sub1="network health posture" sub2="critical exposure detected" />
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE: RECON
// ═══════════════════════════════════════════════════════════════════
function PageRecon({ team }) {
  const accent  = team === "red" ? "snl-accent-red" : "snl-accent-blue";
  const dirEnum = useMockRun();

  const runDirEnum = () => {
    const rows = [
      { path: ".env",        status: 200, note: "⚠ SENSITIVE" },
      { path: "robots.txt",  status: 200, note: "" },
      { path: "backup.zip",  status: 200, note: "⚠ BACKUP" },
      { path: "admin.php",   status: 301, note: "" },
      { path: "config.json", status: 403, note: "" },
      { path: "index.php",   status: 200, note: "" },
    ];
    const steps = rows.map((r, i) => ({
      delay: i * 180,
      line: {
        prefix: `[${r.status}]`,
        prefixCls: r.status === 200 ? "ok" : r.status === 301 ? "warn" : "err",
        text: `/${r.path}`,
        extra: r.note ? `  ${r.note}` : "",
        extraCls: "warn",
      },
    }));
    steps.push({
      delay: rows.length * 180 + 100,
      line: { prefix: "[+]", prefixCls: "ok", text: " Enumeration complete — 6 paths checked" },
    });
    dirEnum.run(steps, rows.length * 180 + 300);
  };

  return (
    <div className="snl-content">
      <div className="snl-section-hdr">
        <h2 id="recon-title">
          <span className={accent}>{team === "red" ? "Red" : "Blue"}</span> Reconnaissance
        </h2>
        <p>// identify services, exposure, and attack surface — phase 1 of kill chain</p>
      </div>

      <div className="snl-grid-3">

        {/* ── NMAP ── */}
        <Panel color="red" icon="🗺️" title="Nmap Port Scanner" sub="SERVICE FINGERPRINTING" tag="ACTIVE">
          <PhaseBadge color="red">Phase 1 — Port Discovery</PhaseBadge>
          <Field label="TARGET IP / DOMAIN">
            <input className="snl-inp red" defaultValue="10.10.10.5" />
          </Field>
          <Field label="SCAN MODE">
            <div className="snl-select-wrap">
              <select className="snl-sel">
                <option>-sV -O (Service + OS)</option>
                <option>-sC (Default Scripts)</option>
                <option>-p- (All Ports)</option>
                <option>-A (Aggressive)</option>
              </select>
            </div>
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Scan Ports</button>
            <StatusPill status="done" />
          </div>
          <div className="snl-findings">
            <div className="snl-finding-hdr">
              <span>PORT</span><span>SERVICE</span>
              <span style={{ marginLeft: "auto" }}>STATE</span>
            </div>
            <FindingRow>
              <span className="snl-fr-port">21/tcp</span>
              <span className="snl-fr-svc">vsftpd 2.3.4</span>
              <span className="snl-fr-state snl-badge snl-b-warn">OPEN</span>
            </FindingRow>
            <FindingRow>
              <span className="snl-fr-port">22/tcp</span>
              <span className="snl-fr-svc">OpenSSH 4.7p1</span>
              <span className="snl-fr-state snl-badge snl-b-ok">OPEN</span>
            </FindingRow>
            <FindingRow>
              <span className="snl-fr-port">80/tcp</span>
              <span className="snl-fr-svc">Apache httpd 2.2.8</span>
              <span className="snl-fr-state snl-badge snl-b-ok">OPEN</span>
            </FindingRow>
            <FindingRow>
              <span className="snl-fr-port">445/tcp</span>
              <span className="snl-fr-svc">Samba smbd 3.X</span>
              <span className="snl-fr-state snl-badge snl-b-err">HIGH RISK</span>
            </FindingRow>
            <FindingRow>
              <span className="snl-fr-port">3306/tcp</span>
              <span className="snl-fr-svc">MySQL 5.0.51a</span>
              <span className="snl-fr-state snl-badge snl-b-warn">OPEN</span>
            </FindingRow>
          </div>
        </Panel>

        {/* ── SHODAN ── */}
        <Panel color="red" icon="🌍" title="Shodan OSINT" sub="EXTERNAL INTELLIGENCE" tag="PASSIVE">
          <PhaseBadge color="red">Phase 1 — External Intel</PhaseBadge>
          <Field label="PUBLIC IP ADDRESS">
            <input className="snl-inp red" defaultValue="192.241.xx.xx" />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Lookup</button>
            <StatusPill status="done" />
          </div>
          <div className="snl-terminal">
            <div className="snl-t-line"><span className="snl-t-key">org</span><span className="snl-t-sep"> : </span><span className="snl-t-val">DigitalOcean LLC</span></div>
            <div className="snl-t-line"><span className="snl-t-key">country</span><span className="snl-t-sep"> : </span><span className="snl-t-val">United States</span></div>
            <div className="snl-t-line"><span className="snl-t-key">ports</span><span className="snl-t-sep"> : </span><span className="snl-t-info">[21, 22, 80, 443, 3306]</span></div>
            <div className="snl-t-line"><span className="snl-t-key">vulns</span><span className="snl-t-sep"> : </span><span className="snl-t-err">CVE-2017-0144, CVE-2007-2447</span></div>
            <div className="snl-t-line"><span className="snl-t-key">hostnames</span><span className="snl-t-sep"> : </span><span className="snl-t-val">lame.htb</span></div>
            <div className="snl-t-line"><span className="snl-t-key">os</span><span className="snl-t-sep"> : </span><span className="snl-t-val">Linux 2.6.x</span></div>
            <div className="snl-t-line"><span className="snl-t-key">last_update</span><span className="snl-t-sep"> : </span><span className="snl-t-ok">2025-01-14</span></div>
          </div>
        </Panel>

        {/* ── WHOIS ── */}
        <Panel color="blue" icon="📋" title="Whois Lookup" sub="DOMAIN REGISTRATION" tag="PASSIVE" tagColor="blue">
          <PhaseBadge color="blue">Phase 1 — Domain Intel</PhaseBadge>
          <Field label="DOMAIN / IP">
            <input className="snl-inp blue" defaultValue="lame.htb" />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-blue snl-btn-sm">▶ Query</button>
            <StatusPill status="done" />
          </div>
          <div className="snl-terminal">
            <div className="snl-t-line"><span className="snl-t-key">Registrar</span><span className="snl-t-sep"> : </span><span className="snl-t-val">Namecheap Inc.</span></div>
            <div className="snl-t-line"><span className="snl-t-key">Created</span><span className="snl-t-sep"> : </span><span className="snl-t-warn">2024-11-02</span></div>
            <div className="snl-t-line"><span className="snl-t-key">Expires</span><span className="snl-t-sep"> : </span><span className="snl-t-val">2025-11-02</span></div>
            <div className="snl-t-line"><span className="snl-t-key">Name Servers</span><span className="snl-t-sep"> : </span><span className="snl-t-info">ns1.digitalocean.com</span></div>
            <div className="snl-t-line"><span className="snl-t-key">Status</span><span className="snl-t-sep"> : </span><span className="snl-t-ok">clientTransferProhibited</span></div>
            <div className="snl-t-line"><span className="snl-t-key">Age (days)</span><span className="snl-t-sep"> : </span><span className="snl-t-warn">74 ⚠ recently registered</span></div>
          </div>
        </Panel>

        {/* ── DIR ENUM ── */}
        <Panel color="red" icon="📂" title="Dir &amp; File Enum" sub="ATTACK SURFACE MAPPING" tag="ACTIVE">
          <PhaseBadge color="red">Phase 1 — Hidden Paths</PhaseBadge>
          <Field label="BASE URL">
            <input className="snl-inp red" defaultValue="http://10.10.10.5" />
          </Field>
          <Field label="MODE">
            <div className="snl-select-wrap">
              <select className="snl-sel">
                <option>files (.env, robots.txt, backup...)</option>
                <option>dirs (admin, api, uploads...)</option>
              </select>
            </div>
          </Field>
          <div className="snl-btn-row">
            <button
              className="snl-btn snl-btn-red snl-btn-sm"
              onClick={runDirEnum}
              disabled={dirEnum.status === "running"}
            >
              {dirEnum.status === "running" ? "⏳ Scanning..." : "▶ Enumerate"}
            </button>
            <StatusPill status={dirEnum.status} />
          </div>
          <Terminal
            lines={dirEnum.lines}
            running={dirEnum.status === "running"}
            placeholderText="// run enumeration to discover hidden files and directories"
          />
        </Panel>

        {/* ── NUCLEI ── */}
        <Panel color="red" icon="☢️" title="Nuclei Scanner" sub="CVE + TEMPLATE SCAN" tag="ACTIVE">
          <PhaseBadge color="red">Phase 1 — Vuln Templates</PhaseBadge>
          <Field label="TARGET URL">
            <input className="snl-inp red" defaultValue="http://10.10.10.5" />
          </Field>
          <Field label="SEVERITY FILTER">
            <div className="snl-select-wrap">
              <select className="snl-sel">
                <option>critical, high, medium</option>
                <option>all severities</option>
                <option>critical only</option>
              </select>
            </div>
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Run Nuclei</button>
            <StatusPill status="idle" />
          </div>
          <Terminal placeholderText="// nuclei -u target -severity critical,high -jsonl" />
        </Panel>

        {/* ── BASIC SCAN ── */}
        <Panel color="blue" icon="🛡️" title="Baseline Health Check" sub="AVAILABILITY + EXPOSURE" tag="PASSIVE" tagColor="blue">
          <PhaseBadge color="blue">Phase 1 — Posture Assessment</PhaseBadge>
          <Field label="TARGET">
            <input className="snl-inp blue" defaultValue="10.10.10.5" />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-blue snl-btn-sm">▶ Run Scan</button>
            <StatusPill status="done" />
          </div>
          <ScoreRing score={32} color="red" label="AT RISK"
            sub1="high-risk ports: 21, 445" sub2="management: 22, 3389" />
        </Panel>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE: EXPLOIT
// ═══════════════════════════════════════════════════════════════════
function PageExploit({ team }) {
  const accent = team === "red" ? "snl-accent-red" : "snl-accent-blue";
  const [progress] = useState(67);

  const csrfPoC = `<html>
  <body>
    <form action="http://10.10.10.5/account/update"
          method="POST" id="csrf-form">
      <input type="hidden" name="username" value="admin"/>
      <input type="hidden" name="email" value="attacker@evil.com"/>
    </form>
    <script>document.getElementById('csrf-form').submit();<\/script>
  </body>
</html>`;

  return (
    <div className="snl-content">
      <div className="snl-section-hdr">
        <h2>
          <span className={accent}>{team === "red" ? "Red" : "Blue"}</span> Exploitation
        </h2>
        <p>// active attack vectors against identified vulnerability surface</p>
      </div>

      <div className="snl-grid-auto">

        {/* ── ZAP ATTACK ── */}
        <Panel color="red" icon="💥" title="ZAP Active Attack" sub="OWASP TOP 10 AUTO-EXPLOIT" tag="ACTIVE">
          <PhaseBadge color="red">Phase 2 — SQLi / XSS / Auth Bypass</PhaseBadge>
          <Field label="TARGET URL">
            <input className="snl-inp red" defaultValue="http://10.10.10.5" />
          </Field>
          <Toggle label="Spider first (crawl then attack)" defaultChecked />
          <Toggle label="Enable all scan policies" defaultChecked />
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Launch Attack</button>
            <StatusPill status="running" label="SCANNING" />
          </div>
          <div className="snl-prog-bar-wrap">
            <div className="snl-prog-bar-label">
              <span>active scan progress</span><span>{progress}%</span>
            </div>
            <div className="snl-prog-bar">
              <div className="snl-prog-bar-fill" style={{ width: `${progress}%`, background: "var(--red)" }} />
            </div>
          </div>
          <div className="snl-findings">
            <div className="snl-finding-hdr">
              <span>ALERT</span><span style={{ marginLeft: "auto" }}>SEVERITY</span>
            </div>
            <FindingRow>
              <span className="snl-fr-svc">SQL Injection — /login?user=</span>
              <span className="snl-fr-state snl-badge snl-b-err">CRITICAL</span>
            </FindingRow>
            <FindingRow>
              <span className="snl-fr-svc">XSS Reflected — /search?q=</span>
              <span className="snl-fr-state snl-badge snl-b-err">HIGH</span>
            </FindingRow>
            <FindingRow>
              <span className="snl-fr-svc">CSRF Missing Token — /account</span>
              <span className="snl-fr-state snl-badge snl-b-warn">MEDIUM</span>
            </FindingRow>
          </div>
        </Panel>

        {/* ── FFUF ── */}
        <Panel color="red" icon="⚡" title="FFUF Fuzzer" sub="SUBDOMAIN + PATH FUZZING" tag="ACTIVE">
          <PhaseBadge color="red">Phase 2 — Hidden Endpoint Discovery</PhaseBadge>
          <Field label="FUZZ URL (must contain FUZZ keyword)">
            <input className="snl-inp red" defaultValue="http://10.10.10.5/FUZZ" />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Start Fuzz</button>
            <StatusPill status="done" />
          </div>
          <div className="snl-findings">
            <div className="snl-finding-hdr">
              <span>PATH</span><span>STATUS</span><span style={{ marginLeft: "auto" }}>SIZE</span>
            </div>
            {[
              { path: "/admin",   badge: "snl-b-err",  code: "301", size: "4.2kb",  sc: "var(--muted)" },
              { path: "/api",     badge: "snl-b-warn", code: "403", size: "1.1kb",  sc: "var(--muted)" },
              { path: "/uploads", badge: "snl-b-ok",   code: "200", size: "8.7kb",  sc: "var(--muted)" },
              { path: "/backup",  badge: "snl-b-ok",   code: "200", size: "12.3kb", sc: "var(--muted)" },
              { path: "/.env",    badge: "snl-b-ok",   code: "200", size: "0.8kb",  sc: "var(--red)"   },
            ].map(r => (
              <FindingRow key={r.path}>
                <span className="snl-fr-svc">{r.path}</span>
                <span className={`snl-badge ${r.badge}`}>{r.code}</span>
                <span className="snl-fr-score" style={{ color: r.sc }}>{r.size}</span>
              </FindingRow>
            ))}
          </div>
        </Panel>

        {/* ── CSRF GEN ── */}
        <Panel color="red" icon="⚔️" title="CSRF PoC Generator" sub="CROSS-SITE REQUEST FORGERY" tag="WEAPONIZE">
          <PhaseBadge color="red">Phase 2 — Attack Payload</PhaseBadge>
          <Field label="BASE URL">
            <input className="snl-inp red" defaultValue="http://10.10.10.5" />
          </Field>
          <Field label="RAW HTTP REQUEST (from Burp)">
            <textarea
              className="snl-textarea"
              rows={4}
              defaultValue={"POST /account/update HTTP/1.1\nHost: 10.10.10.5\nContent-Type: application/x-www-form-urlencoded\n\nusername=admin&email=attacker@evil.com"}
            />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Generate PoC</button>
            <StatusPill status="done" label="GENERATED" />
          </div>
          <Field label="GENERATED HTML PoC">
            <textarea className="snl-textarea green-text" rows={6} readOnly value={csrfPoC} onChange={() => {}} />
          </Field>
        </Panel>

        {/* ── ZAP SPIDER ── */}
        <Panel color="blue" icon="🕷️" title="ZAP Spider / Crawler" sub="PASSIVE SURFACE DISCOVERY" tag="PASSIVE" tagColor="blue">
          <PhaseBadge color="blue">Phase 2 — URL Discovery</PhaseBadge>
          <Field label="TARGET URL">
            <input className="snl-inp blue" defaultValue="http://10.10.10.5" />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-blue snl-btn-sm">▶ Start Crawl</button>
            <StatusPill status="done" />
          </div>
          <div className="snl-terminal">
            <div className="snl-t-line"><span className="snl-t-ok">[+]</span><span className="snl-t-val"> Spider completed: 43 URLs found</span></div>
            <div className="snl-t-line"><span className="snl-t-info">[i]</span><span className="snl-t-val"> http://10.10.10.5/</span></div>
            <div className="snl-t-line"><span className="snl-t-info">[i]</span><span className="snl-t-val"> http://10.10.10.5/login</span></div>
            <div className="snl-t-line"><span className="snl-t-info">[i]</span><span className="snl-t-val"> http://10.10.10.5/admin/panel</span></div>
            <div className="snl-t-line"><span className="snl-t-info">[i]</span><span className="snl-t-val"> http://10.10.10.5/api/v1/users</span></div>
            <div className="snl-t-line"><span className="snl-t-warn">[!]</span><span className="snl-t-val"> http://10.10.10.5/.git/HEAD</span></div>
            <div className="snl-t-line"><span className="snl-t-warn">[!]</span><span className="snl-t-val"> http://10.10.10.5/phpmyadmin/</span></div>
            <div className="snl-t-line"><span className="snl-t-ok">[+]</span><span className="snl-t-val"> Report saved → zap_crawler_10_10_10_5.pdf</span></div>
          </div>
        </Panel>

        {/* ── MALICIOUS URL ── */}
        <Panel color="blue" icon="🔍" title="Malicious URL Scanner" sub="HEURISTIC THREAT ANALYSIS" tag="THREAT INTEL" tagColor="blue">
          <PhaseBadge color="blue">Phase 2 — URL Threat Detection</PhaseBadge>
          <Field label="SUSPICIOUS URL">
            <input className="snl-inp blue" defaultValue="http://paypal-secure-login.xyz/verify" />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-blue snl-btn-sm">▶ Analyze</button>
            <StatusPill status="done" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.3rem 0" }}>
            <span style={{ fontFamily: "var(--font-hdr)", fontSize: "1.2rem", color: "var(--red)" }}>
              MALICIOUS
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted)" }}>
              score: <span style={{ color: "var(--red)" }}>85</span>/100
            </span>
          </div>
          <div className="snl-findings">
            <FindingRow><span className="snl-badge snl-b-err">⚠</span><span className="snl-fr-svc">Possible brand impersonation: paypal</span></FindingRow>
            <FindingRow><span className="snl-badge snl-b-warn">⚠</span><span className="snl-fr-svc">Suspicious TLD detected: .xyz</span></FindingRow>
            <FindingRow><span className="snl-badge snl-b-warn">⚠</span><span className="snl-fr-svc">Recently registered domain (14 days)</span></FindingRow>
            <FindingRow><span className="snl-badge snl-b-info">ℹ</span><span className="snl-fr-svc">High entropy domain (possible DGA)</span></FindingRow>
          </div>
        </Panel>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE: POST-EXPLOIT
// ═══════════════════════════════════════════════════════════════════
function PagePostExploit({ team }) {
  const accent = team === "red" ? "snl-accent-red" : "snl-accent-blue";

  return (
    <div className="snl-content">
      <div className="snl-section-hdr">
        <h2>
          <span className={accent}>{team === "red" ? "Red" : "Blue"}</span> Post-Exploitation
        </h2>
        <p>// credential extraction, loot staging, persistence mapping</p>
      </div>

      <div className="snl-grid-2">

        {/* ── LOOT ── */}
        <Panel color="red" icon="💀" title="Loot Extraction Console" sub="POST-COMPROMISE ANALYSIS" tag="RED MODE">
          <PhaseBadge color="red">Phase 3 — Credential &amp; Data Harvest</PhaseBadge>
          <Field label="UPLOAD ARTIFACT / DUMP">
            <input type="file" className="snl-inp red" style={{ padding: "0.5rem" }} />
          </Field>
          <Field label="ANALYSIS MODE">
            <div className="snl-select-wrap">
              <select className="snl-sel">
                <option>red — loot &amp; credential extraction</option>
                <option>blue — IOC identification</option>
              </select>
            </div>
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Analyze Artifact</button>
            <StatusPill status="done" />
          </div>
          <ForensicRow k="file"        v="passwd.zip" />
          <ForensicRow k="entropy"     v="7.94 ⚠ high (packed/encrypted)"  cls="warn" />
          <ForensicRow k="mime"        v="application/zip" />
          <ForensicRow k="credentials" v="⚠ 8 credential artifacts found"   cls="danger" />
          <ForensicRow k="yara"        v="credential_dump, mimikatz_strings" cls="warn" />
          <div className="snl-findings" style={{ marginTop: "0.5rem" }}>
            <FindingRow><span className="snl-badge snl-b-err">🎯</span><span className="snl-fr-svc">Archive contained multiple files (data staging)</span></FindingRow>
            <FindingRow><span className="snl-badge snl-b-err">🎯</span><span className="snl-fr-svc">Credential artifacts detected (high-value loot)</span></FindingRow>
            <FindingRow><span className="snl-badge snl-b-warn">🎯</span><span className="snl-fr-svc">High entropy — possible encrypted payload</span></FindingRow>
          </div>
        </Panel>

        {/* ── PERSISTENCE PATHFINDER ── */}
        <Panel color="red" icon="🔗" title="Persistence Pathfinder" sub="LATERAL MOVEMENT MAPPING" tag="ACTIVE">
          <PhaseBadge color="red">Phase 3 — Foothold Expansion</PhaseBadge>
          <Field label="COMPROMISED HOST">
            <input className="snl-inp red" defaultValue="10.10.10.5" />
          </Field>
          <Field label="VECTOR">
            <div className="snl-select-wrap">
              <select className="snl-sel">
                <option>SMB — EternalBlue (MS17-010)</option>
                <option>FTP — vsftpd 2.3.4 Backdoor</option>
                <option>SSH — Brute Force / Key Reuse</option>
                <option>Web — File Upload RCE</option>
              </select>
            </div>
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Map Attack Path</button>
            <button className="snl-btn snl-btn-ghost snl-btn-sm">⬛ Stop</button>
          </div>
          <div style={{ marginTop: "0.4rem" }}>
            <StatusPill status="idle" />
          </div>
          <div className="snl-terminal" style={{ marginTop: "0.8rem" }}>
            <div className="snl-t-line"><span className="snl-t-ok">[+]</span><span className="snl-t-val"> Samba 3.0.20 vulnerable to CVE-2007-2447</span></div>
            <div className="snl-t-line"><span className="snl-t-warn">[!]</span><span className="snl-t-val"> usermap script command injection possible</span></div>
            <div className="snl-t-line"><span className="snl-t-info">[&gt;]</span><span className="snl-t-val"> Suggested: msf exploit/multi/samba/usermap_script</span></div>
            <div className="snl-t-line"><span className="snl-t-ok">[+]</span><span className="snl-t-val"> FTP 21 — vsftpd 2.3.4 backdoor (port 6200)</span></div>
            <div className="snl-t-line"><span className="snl-t-cursor" /></div>
          </div>
        </Panel>

        {/* ── INTERACTSH OOB — full width ── */}
        <Panel
          color="red" icon="📡"
          title="Interactsh — Out-of-Band Interaction Listener"
          sub="SSRF / BLIND XSS / DNS CALLBACK DETECTION"
          tag="OOB LISTENER" tagColor="green"
          className="snl-col-span-2"
        >
          <PhaseBadge color="red">Phase 3 — Blind Vulnerability Confirmation</PhaseBadge>
          <div className="snl-grid-2" style={{ gap: "0.8rem" }}>
            <Field label="GENERATED CALLBACK URL">
              <input className="snl-inp red" readOnly defaultValue="abc123xyz.oast.pro" />
            </Field>
            <Field label="POLL INTERVAL">
              <div className="snl-select-wrap">
                <select className="snl-sel">
                  <option>10s</option><option>20s</option><option>30s</option>
                </select>
              </div>
            </Field>
          </div>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Start Listener</button>
            <button className="snl-btn snl-btn-ghost snl-btn-sm">⬛ Stop</button>
            <StatusPill status="running" label="LISTENING" />
          </div>
          <div className="snl-findings" style={{ marginTop: "0.8rem" }}>
            <div className="snl-finding-hdr">
              <span>PROTOCOL</span><span>REMOTE ADDR</span>
              <span>UNIQUE ID</span><span style={{ marginLeft: "auto" }}>TIME</span>
            </div>
            <FindingRow>
              <span className="snl-badge snl-b-err">DNS</span>
              <span className="snl-fr-svc">192.168.1.45</span>
              <span className="snl-fr-svc" style={{ color: "var(--muted)" }}>abc123xyz-1</span>
              <span className="snl-fr-state snl-badge snl-b-dim">00:14:32</span>
            </FindingRow>
            <FindingRow>
              <span className="snl-badge snl-b-warn">HTTP</span>
              <span className="snl-fr-svc">10.10.10.5</span>
              <span className="snl-fr-svc" style={{ color: "var(--muted)" }}>abc123xyz-2</span>
              <span className="snl-fr-state snl-badge snl-b-dim">00:14:35</span>
            </FindingRow>
          </div>
        </Panel>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE: FORENSICS
// ═══════════════════════════════════════════════════════════════════
function PageForensics({ team }) {
  const accent = team === "red" ? "snl-accent-red" : "snl-accent-blue";

  return (
    <div className="snl-content">
      <div className="snl-section-hdr">
        <h2 id="forensics-title">
          <span className={accent}>{team === "red" ? "Red" : "Blue"}</span> Forensic Analysis
        </h2>
        <p>// deep artifact inspection — entropy, YARA, PE headers, credential strings</p>
      </div>

      <div className="snl-grid-2">

        {/* ── ARTIFACT SCANNER ── */}
        <Panel color="red" icon="🧬" title="Artifact Scanner" sub="DFIR · BINARY ANALYSIS" tag="RED MODE">
          <PhaseBadge color="red">Phase 4 — Deep File Inspection</PhaseBadge>
          <Field label="UPLOAD FILE (ZIP · EXE · ELF · PCAP · LOG)">
            <input type="file" className="snl-inp red" style={{ padding: "0.5rem" }} />
          </Field>
          <div className="snl-btn-row">
            <button className="snl-btn snl-btn-red snl-btn-sm">▶ Run Forensics</button>
            <StatusPill status="done" />
          </div>
          <hr className="snl-divider" />
          <ForensicRow k="file"        v="exploit_kit.exe" />
          <ForensicRow k="size"        v="142.8 KB" />
          <ForensicRow k="mime"        v="application/x-dosexec" />
          <ForensicRow k="entropy"     v="7.97 — PACKED / OBFUSCATED"              cls="danger" />
          <div className="snl-forensic-field">
            <span className="snl-ff-key">md5</span>
            <span className="snl-ff-val" style={{ fontSize: "0.7rem" }}>d41d8cd98f00b204e9800998ecf8427e</span>
          </div>
          <div className="snl-forensic-field">
            <span className="snl-ff-key">sha256</span>
            <span className="snl-ff-val" style={{ fontSize: "0.68rem" }}>e3b0c44298fc1c149afbf4c8996fb924...</span>
          </div>
          <ForensicRow k="PE sections" v=".text · .data · .rsrc · UPX0 · UPX1" />
          <ForensicRow k="YARA"        v="upx_packed · shellcode_pattern"          cls="warn" />
          <ForensicRow k="credentials" v="⚠ 3 found: API key, password hash, token" cls="danger" />
        </Panel>

        {/* ── IOC EXTRACTOR ── */}
        <Panel color="red" icon="🔬" title="IOC Extractor" sub="INDICATORS OF COMPROMISE" tag="ANALYSIS">
          <PhaseBadge color="red">Phase 4 — Evidence &amp; IOC</PhaseBadge>
          <div className="snl-alert-feed">
            <AlertItem sev="crit" title="Credential artifacts detected" body="high-value loot present" time="IOC" />
            <AlertItem sev="high" title="UPX packing detected"          body="binary obfuscated, possible dropper" time="IOC" />
            <AlertItem sev="high" title="High entropy (7.97)"           body="encrypted or packed payload" time="IOC" />
            <AlertItem sev="med"  title="PE compile timestamp"          body="2024-11-02 03:14:07 UTC (recent)" time="IOC" />
          </div>
          <hr className="snl-divider" />
          <div className="snl-field-label" style={{ marginBottom: "0.5rem" }}>EXTRACTED STRINGS (sample)</div>
          <div className="snl-terminal sm">
            <div className="snl-t-line"><span className="snl-t-err">password=Sup3rS3cretP@ssw0rd</span></div>
            <div className="snl-t-line"><span className="snl-t-err">token=eyJhbGciOiJIUzI1NiIsInR...</span></div>
            <div className="snl-t-line"><span className="snl-t-warn">http://evil.c2server.ru/gate</span></div>
            <div className="snl-t-line"><span className="snl-t-warn">AWS_SECRET_ACCESS_KEY=AKIAI...</span></div>
            <div className="snl-t-line"><span className="snl-t-val">cmd.exe /c whoami</span></div>
            <div className="snl-t-line"><span className="snl-t-val">net user administrator</span></div>
          </div>
        </Panel>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE: REPORTS
// ═══════════════════════════════════════════════════════════════════
const REPORT_FILTERS = [
  { name: "All Reports", color: "var(--blue)",   count: 7 },
  { name: "Fullscan",    color: "var(--red)",    count: 2 },
  { name: "Basic Scan",  color: "var(--yellow)", count: 1 },
  { name: "ZAP Crawler", color: "var(--blue)",   count: 2 },
  { name: "ZAP Active",  color: "var(--red)",    count: 1 },
  { name: "Forensics",   color: "var(--green)",  count: 1 },
];

const REPORTS_LIST = [
  { name: "fullscan_10_10_10_5.pdf",             type: "FULLSCAN",    date: "2025-03-10 14:32:01", size: "284 KB",  badge: "snl-b-err",  label: "CRITICAL" },
  { name: "zap_active_scan_10_10_10_5.pdf",      type: "ZAP ACTIVE",  date: "2025-03-10 13:11:44", size: "198 KB",  badge: "snl-b-err",  label: "HIGH"     },
  { name: "zap_crawler_10_10_10_5.pdf",          type: "ZAP CRAWLER", date: "2025-03-10 12:54:20", size: "76 KB",   badge: "snl-b-warn", label: "MEDIUM"   },
  { name: "forensics_exploit_kit.pdf",            type: "FORENSICS",   date: "2025-03-10 12:01:38", size: "42 KB",   badge: "snl-b-err",  label: "CRITICAL" },
  { name: "baseline_health_check_10_10_10_5.pdf", type: "BASIC SCAN",  date: "2025-03-10 11:22:57", size: "31 KB",   badge: "snl-b-warn", label: "AT RISK"  },
  { name: "fullscan_192_168_1_10.pdf",            type: "FULLSCAN",    date: "2025-03-09 22:44:11", size: "201 KB",  badge: "snl-b-warn", label: "HIGH"     },
  { name: "zap_crawler_192_168_1_10.pdf",         type: "ZAP CRAWLER", date: "2025-03-09 21:30:00", size: "58 KB",   badge: "snl-b-info", label: "LOW"      },
];

function PageReports() {
  const [activeFilter, setActiveFilter] = useState("All Reports");

  return (
    <div className="snl-content">
      <div className="snl-section-hdr">
        <h2>Scan <span className="snl-accent-blue">Reports</span></h2>
        <p>// all generated PDF reports — download evidence from completed scans</p>
      </div>

      <div className="snl-sidebar-layout">
        {/* Filter sidebar */}
        <div className="snl-sidebar-card">
          <div className="snl-sidebar-hdr">SCAN TYPES</div>
          {REPORT_FILTERS.map(f => (
            <div
              key={f.name}
              className={`snl-sidebar-item${activeFilter === f.name ? " active" : ""}`}
              onClick={() => setActiveFilter(f.name)}
            >
              <div className="snl-si-dot" style={{ background: f.color }} />
              <span className="snl-si-name">{f.name}</span>
              <span className="snl-si-time">{f.count}</span>
            </div>
          ))}
        </div>

        {/* Report list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {REPORTS_LIST.map(r => (
            <div className="snl-report-card" key={r.name}>
              <div className="snl-report-icon">📄</div>
              <div className="snl-report-meta">
                <h5>{r.name}</h5>
                <small>{r.type} · {r.date} · {r.size}</small>
              </div>
              <div className="snl-report-actions">
                <span className={`snl-badge ${r.badge}`}>{r.label}</span>
                <button className="snl-btn snl-btn-blue snl-btn-sm">⬇ PDF</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  KILL CHAIN BAR
// ═══════════════════════════════════════════════════════════════════
function KillChain({ kcIndex }) {
  return (
    <div className="snl-killchain">
      {KC_LABELS.map((label, i) => {
        const state =
          kcIndex === null ? "" :
          i < kcIndex      ? "done" :
          i === kcIndex    ? "active" : "";
        const numText = state === "done" ? "✓" : state === "active" ? "▶" : String(i + 1);
        return (
          <React.Fragment key={label}>
            <div className={`snl-kc-step ${state}`}>
              <div className="snl-kc-num">{numText}</div>
              {label}
            </div>
            {i < KC_LABELS.length - 1 && (
              <div className="snl-kc-arrow">──▶</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT EXPORT
// ═══════════════════════════════════════════════════════════════════
export default function Prototype() {
  const [team, setTeam] = useState("red");  // "red" | "blue"
  const [tab,  setTab]  = useState("recon");
  const clock           = useClock();

  const currentTab = TABS.find(t => t.id === tab);
  const kcIndex    = currentTab ? currentTab.kc : null;

  // update team across tab bar
  const handleTeam = (t) => setTeam(t);
  const handleTab  = (id) => setTab(id);

  const renderPage = () => {
    switch (tab) {
      case "overview":    return <PageOverview    team={team} />;
      case "recon":       return <PageRecon       team={team} />;
      case "exploit":     return <PageExploit     team={team} />;
      case "postexploit": return <PagePostExploit team={team} />;
      case "forensics":   return <PageForensics   team={team} />;
      case "reports":     return <PageReports />;
      default:            return null;
    }
  };

  return (
    <div className="snl">

      {/* ══ TOPBAR ══ */}
      <div className="snl-topbar">
        <div className="snl-logo">
          <div className="snl-logo-badge">
            <div className="snl-live-dot" />
            LIVE
          </div>
          SECURENETLITE
        </div>

        <div className="snl-topbar-center">
          <button
            className={`snl-team-btn red${team === "red" ? " active" : ""}`}
            onClick={() => handleTeam("red")}
          >
            🔴 RED TEAM
          </button>
          <button
            className={`snl-team-btn blue${team === "blue" ? " active" : ""}`}
            onClick={() => handleTeam("blue")}
          >
            🔵 BLUE TEAM
          </button>
        </div>

        <div className="snl-topbar-right">
          <span className="snl-op-label">operator:</span>
          <span className="snl-op-user">root@kali</span>
          <span className="snl-clock">{clock}</span>
        </div>
      </div>

      {/* ══ KILL CHAIN ══ */}
      <KillChain kcIndex={kcIndex} />

      {/* ══ TAB BAR ══ */}
      <div className="snl-tabs-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`snl-tab-btn${tab === t.id ? ` active ${team}` : ""}`}
            onClick={() => handleTab(t.id)}
          >
            {t.icon} {t.label}
            <span className="snl-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ══ PAGE CONTENT ══ */}
      {renderPage()}

    </div>
  );
}
