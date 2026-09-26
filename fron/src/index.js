import React from "react";
import ReactDOM from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { API_BASE } from "./utils/api";

// 🔥 GLOBAL fetch override
const originalFetch = window.fetch;

window.fetch = (url, options) => {
  if (typeof url === "string") {
    url = url
      .replace("http://localhost:8000", API_BASE)
      .replace("http://127.0.0.1:8000", API_BASE);
  }
  return originalFetch(url, options);
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
