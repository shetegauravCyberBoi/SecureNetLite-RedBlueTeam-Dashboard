import axios from "axios";

// 🔥 Dynamic API base resolver
const getApiBase = () => {
  const host = window.location.hostname;

  // Local development
  if (host === "localhost" || host === "127.0.0.1") {
    return process.env.REACT_APP_API_URL || "http://localhost:8000";
  }

  // Fake AP (airbase-ng network)
  if (host.startsWith("10.0.0.")) {
    return process.env.REACT_APP_API_URL || "http://10.0.0.1:8000";
  }

  // Normal WiFi (LAN)
  if (host.startsWith("192.168.")) {
    return process.env.REACT_APP_API_URL || `http://${host}:8000`;
  }

  // Fallback (any other network)
  return process.env.REACT_APP_API_URL || `http://${host}:8000`;
};

// ✅ Export base (useful elsewhere if needed)
export const API_BASE = getApiBase();

// ✅ Axios instance (same as before, just dynamic now)
const API = axios.create({
  baseURL: API_BASE,
});

// ✅ Keep your existing interceptor (unchanged)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
