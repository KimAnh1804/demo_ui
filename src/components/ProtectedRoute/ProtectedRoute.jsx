import React from "react";
import {useAuth} from "../../contexts/AuthContext";
import LoginPage from "../LoginPage/LoginPage";

export const ProtectedRoute = ({children}) => {
    const {isAuthenticated, isGuestMode, loading} = useAuth();

    if (loading) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#1e1e1e",
                color: "#fff"
            }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated && !isGuestMode) {
        return <LoginPage />;
    }

    return children;
};
