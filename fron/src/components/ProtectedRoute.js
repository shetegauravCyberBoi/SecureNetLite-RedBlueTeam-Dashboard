import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    alert("Please login to use this tool.");
    return <Navigate to="/login" />;
  }

  return children;
}
