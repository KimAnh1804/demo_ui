import React, { createContext, useState, useCallback, useEffect } from "react";
import {
  sendLoginRequest,
  sendOTPVerificationRequest,
  subscribeTradingResponse,
  unsubscribeTradingResponse,
  disconnectTradingSocket,
  initTradingSocket,
} from "../services/socketTrading";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSessionId, setOtpSessionId] = useState(null);
  const [pendingUsername, setPendingUsername] = useState(null);
  const [otpMessage, setOtpMessage] = useState("");
  const [isGuestMode, setIsGuestMode] = useState(false);
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!navigator.onLine) {
        const msg =
          "Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.";
        setError(msg);
        setLoading(false);
        resolve({ success: false, error: msg });
        return;
      }

      if (!username || !password) {
        const msg = "Vui lòng nhập tài khoản và mật khẩu";
        setError(msg);
        setLoading(false);
        resolve({ success: false, error: msg });
        return;
      }

      let isHandled = false;

      const socket = initTradingSocket();

      const handleNetworkError = () => {
        if (isHandled) return;
        isHandled = true;

        unsubscribeTradingResponse(`SEQ_${clientSeq}`, handler);
        socket.off("disconnect", handleNetworkError);
        window.removeEventListener("offline", handleNetworkError);

        const msg = "Mất kết nối trong quá trình đăng nhập. Vui lòng thử lại.";
        setError(msg);
        setLoading(false);
        resolve({ success: false, error: msg });
      };

      socket.once("disconnect", handleNetworkError);
      window.addEventListener("offline", handleNetworkError);

      const clientSeq = sendLoginRequest(username, password);

      const handler = (data) => {
        if (isHandled) return;
        isHandled = true;
        unsubscribeTradingResponse(`SEQ_${clientSeq}`, handler);

        socket.off("disconnect", handleNetworkError);
        window.removeEventListener("offline", handleNetworkError);

        if (data && String(data.Result) === "1") {
          const forceOTP = true;

          if (
            (data.RequiresOTP && String(data.RequiresOTP) === "") ||
            forceOTP
          ) {
            setRequiresOTP(true);
            setOtpCountdown(120);
            setOtpSessionId(data.SessionId || clientSeq);
            setPendingUsername(username);

            // Set message ban đầu từ login response
            setOtpMessage(
              data.Message || "Vui lòng nhập mã OTP để hoàn tất đăng nhập"
            );
            setLoading(false);

            setTimeout(() => {
              const otpSeq = sendOTPVerificationRequest(
                data.SessionId || clientSeq
              );

              const otpHandler = (otpData) => {
                if (otpData?.Message) {
                  setOtpMessage(otpData.Message);
                }
                unsubscribeTradingResponse(`SEQ_${otpSeq}`, otpHandler);
              };

              subscribeTradingResponse(`SEQ_${otpSeq}`, otpHandler);
            }, 2000);

            resolve({
              success: true,
              requiresOTP: true,
              sessionId: data.SessionId || clientSeq,
            });
            return;
          }

          localStorage.setItem("authToken", fakeToken);
          localStorage.setItem("authUser", JSON.stringify(userData));

          setToken(fakeToken);
          setUser(userData);
          setIsAuthenticated(true);
          setLoading(false);

          resolve({ success: true, user: userData });
        } else {
          const msg = data.Message || "Đăng nhập thất bại";
          setError(msg);
          setLoading(false);
          resolve({ success: false, error: msg });
        }
      };

      subscribeTradingResponse(`SEQ_${clientSeq}`, handler);

      setTimeout(() => {
        if (!isHandled) {
          isHandled = true;
          unsubscribeTradingResponse(`SEQ_${clientSeq}`, handler);

          socket.off("disconnect", handleNetworkError);
          window.removeEventListener("offline", handleNetworkError);

          const msg = "Hết thời gian chờ phản hồi từ server";
          setError(msg);
          setLoading(false);
          resolve({ success: false, error: msg });
        }
      }, 30000);
    });
  }, []);

  // Hàm xác thực OTP
  const verifyOTP = useCallback(
    async (otpCode) => {
      setLoading(true);
      setError(null);

      return new Promise((resolve) => {
        setTimeout(() => {
          const userData = {
            id: 1,
            username: pendingUsername,
            email: `${pendingUsername}@yuanta.com.vn`,
            name: pendingUsername,
          };

          const fakeToken = `token_${Date.now()}_${Math.random().toString(36)}`;

          localStorage.setItem("authToken", fakeToken);
          localStorage.setItem("authUser", JSON.stringify(userData));

          setToken(fakeToken);
          setUser(userData);
          setIsAuthenticated(true);
          setRequiresOTP(false);
          setOtpCountdown(0);
          setOtpSessionId(null);
          setPendingUsername(null);
          setLoading(false);

          resolve({ success: true, user: userData });
        }, 1000);
      });
    },
    [pendingUsername]
  );

  const cancelOTP = useCallback(() => {
    setRequiresOTP(false);
    setOtpCountdown(0);
    setOtpSessionId(null);
    setPendingUsername(null);
    setError(null);
  }, []);

  const enterGuestMode = useCallback(() => {
    setIsGuestMode(true);
    setRequiresOTP(false);
    setOtpCountdown(0);
    setOtpSessionId(null);
    setPendingUsername(null);
    setError(null);
  }, []);

  const resendOTP = useCallback(() => {
    if (otpSessionId) {
      setOtpCountdown(120);
      setError(null);

      setTimeout(() => {
        const otpSeq = sendOTPVerificationRequest(otpSessionId);

        const otpHandler = (otpData) => {
          if (otpData?.Message) {
            setOtpMessage(otpData.Message);
          }
          unsubscribeTradingResponse(`SEQ_${otpSeq}`, otpHandler);
        };

        subscribeTradingResponse(`SEQ_${otpSeq}`, otpHandler);
      }, 500);
    }
  }, [otpSessionId]);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    disconnectTradingSocket();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    error,
    login,
    logout,
    clearError,
    requiresOTP,
    otpCountdown,
    otpSessionId,
    otpMessage,
    verifyOTP,
    cancelOTP,
    resendOTP,
    isGuestMode,
    enterGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
};
