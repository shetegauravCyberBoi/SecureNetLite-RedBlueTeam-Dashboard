import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ZAPScanPage from './pages/ZAPScanPage';
import ScanPage from "./pages/ScanPage";
import FullScanPage from "./pages/FullScanPage";
import ReportPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DigitalForensicsPage from "./pages/DigitalForensicsPage";
import CSRFpage from "./pages/CSRFpage";
import AttackTool from "./pages/AttackTool";
import MaliciousURL from "./pages/MaliciousURL";
import Prototype from "./pages/Prototype";

import ProtectedRoute from "./components/ProtectedRoute";
import './components/Navbar.css';

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/fullscan" element={<FullScanPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/zap-scan" element={<ZAPScanPage />} />
          <Route path="/attacker" element={<AttackTool />} />
          <Route path="/forensics" element={<DigitalForensicsPage />} />
          <Route path="/csrf" element={<CSRFpage />} />
          <Route path="/maliciousurl" element={<MaliciousURL />} />
          <Route path="/prototype" element={<Prototype />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
