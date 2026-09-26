import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    // Redirect to homepage instead of showing alert or login page
    return <Navigate to="/" replace />;
  }

  return children;
}
