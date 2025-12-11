import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LoginPage } from "../LoginPage";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isGuestMode } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isGuestMode) {
    return <LoginPage />;
  }

  return children;
};

export default ProtectedRoute;
