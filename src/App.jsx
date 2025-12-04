import React from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainApp } from "./AppMain";
import "./App.scss";

export default function App() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  );
}
