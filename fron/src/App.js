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

import AttackTool from "./pages/AttackTool";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import './components/Navbar.css';
import './pages/LoginPage.css'
export default function App() {
  return (
    <AuthProvider> {/* ✅ Wrap all routes in AuthProvider */}
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
    </AuthProvider>
  );
}
