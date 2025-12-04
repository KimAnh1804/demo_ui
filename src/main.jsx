import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import websocket from "./services/socketStream";
import * as tradingSocket from "./services/socketTrading";

// Khởi tạo socket connection sớm
websocket.initSocket();
tradingSocket.initTradingSocket();

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
