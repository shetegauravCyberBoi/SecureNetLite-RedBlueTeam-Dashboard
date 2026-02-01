import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import './ZAPScanPage.css';
import { useAuth } from '../context/AuthContext';

const ZAPScanPage = () => {
  const { token } = useAuth();

  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [crawlChecked, setCrawlChecked] = useState(true);
  const [activeScanChecked, setActiveScanChecked] = useState(false);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const sanitizeFilename = (url) => {
    return url
      .replace(/\W+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleScan = async () => {
    if (!targetUrl.startsWith('http')) {
      setError('Please enter a valid URL (starting with http/https)');
      return;
    }

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      let response = null;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (crawlChecked && !activeScanChecked) {
        response = await axios.post(
          `http://localhost:8000/crawl?target=${targetUrl}`,
          {},
          config
        );
      } else if (!crawlChecked && activeScanChecked) {
        response = await axios.post(
          `http://localhost:8000/attack?target=${targetUrl}`,
          {},
          config
        );
      } else if (crawlChecked && activeScanChecked) {
        await axios.post(
          `http://localhost:8000/crawl?target=${targetUrl}`,
          {},
          config
        );
        response = await axios.post(
          `http://localhost:8000/attack?target=${targetUrl}`,
          {},
          config
        );
      } else {
        setError('Please select at least one scan option.');
        setLoading(false);
        return;
      }

      if (response.data.status === 'success') {
        setScanResult(response.data.data || { message: 'Scan completed successfully.' });
      } else {
        setError(response.data.message || 'Scan failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error contacting backend');
    }

    setLoading(false);
  };

  return (
    <div className="zap-container">
      <h1 className="zap-title">ZAP Web Security Scanner</h1>
      <p className="zap-subtitle">
        Offensive & Baseline Web Application Security Assessment (Headless Mode)
      </p>

      <input
        type="text"
        placeholder="Enter target URL (e.g., http://testphp.vulnweb.com)"
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
        className="zap-input"
      />

      {/* Scan Options */}
      <div className="zap-checkboxes">
        <label>
          <input
            type="checkbox"
            checked={crawlChecked}
            onChange={() => setCrawlChecked(!crawlChecked)}
          />
          <strong>Spider / Crawler</strong>
          <span className="zap-desc">
            (Attack surface discovery, URLs, parameters, forms)
          </span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={activeScanChecked}
            onChange={() => setActiveScanChecked(!activeScanChecked)}
          />
          <strong>Active Scan / Exploitation Tests</strong>
          <span className="zap-desc">
            (SQLi, XSS, Auth bypass, CSRF, Misconfigurations)
          </span>
        </label>
      </div>

      {/* Critical Tools Coverage */}
      <div className="zap-tools-panel">
        <h3>🔍 Critical Security Tests Covered</h3>
        <ul>
          <li>✔ SQL Injection (Error-based, Blind, Time-based)</li>
          <li>✔ Cross-Site Scripting (Reflected, Stored)</li>
          <li>✔ Authentication & Session Weaknesses</li>
          <li>✔ CSRF Token Validation</li>
          <li>✔ Insecure HTTP Headers</li>
          <li>✔ Sensitive File & Endpoint Discovery</li>
          <li>✔ Input Validation & Fuzz-Style Payloads</li>
          <li>✔ OWASP Top-10 Automated Coverage</li>
        </ul>
        <p className="zap-note">
          ⚠ Active scanning sends malicious payloads. Only scan assets you own or
          are authorized to test.
        </p>
      </div>

      <button
        onClick={handleScan}
        className="zap-button"
        disabled={loading}
      >
        {loading ? 'Scanning...' : 'Run Scan'}
      </button>

      {loading && (
        <div className="zap-loader">
          <img
            src="/zap-hacker.gif"
            alt="Scanning..."
            className="zap-hacker-gif"
          />
          <p>Scanning in progress… This may take several minutes.</p>
        </div>
      )}

      {error && <div className="zap-error">{error}</div>}

      {scanResult && (
        <div className="zap-result">
          <h2>Scan Result ✅</h2>
          <pre>{JSON.stringify(scanResult, null, 2)}</pre>
        </div>
      )}

      {(scanResult && (crawlChecked || activeScanChecked)) && (
        <div className="zap-download-section">
          <h3>📄 Download Scan Report(s)</h3>
          <ul>
            {crawlChecked && (
              <li>
                <strong>Spider / Discovery Report:</strong>
                <a
                  href={`http://localhost:8000/report/download?file=zap_crawler_${sanitizeFilename(
                    targetUrl
                  )}.pdf`}
                  className="zap-download-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download PDF
                </a>
              </li>
            )}
            {activeScanChecked && (
              <li>
                <strong>Active Exploitation Report:</strong>
                <a
                  href={`http://localhost:8000/report/download?file=zap_active_scan_${sanitizeFilename(
                    targetUrl
                  )}.pdf`}
                  className="zap-download-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download PDF
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ZAPScanPage;
