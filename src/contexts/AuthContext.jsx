import React, {createContext, useState, useCallback} from "react";
import {
  sendLoginRequest,
  sendOTPVerificationRequest,
  sendWrongOTP,
  saveSessionID,
  saveAppLoginID,
  subscribeTradingResponse,
  unsubscribeTradingResponse,
  disconnectTradingSocket,
  initTradingSocket,
} from "../services/socketTrading";

export const AuthContext = createContext(null);

const parseLoginData = (data) => {
  try {
    if (!data.Data) return {appLoginID: null, sessionId: null};

    const parsedData = JSON.parse(data.Data);
    if (!parsedData?.[0]) return {appLoginID: null, sessionId: null};

    const appLoginID = parsedData[0].c1 || null;
    const sessionId =
      parsedData[0].c40 ||
      parsedData[0].c41 ||
      parsedData[0].c2 ||
      parsedData[0].c3 ||
      null;

    return {appLoginID, sessionId};
  } catch (e) {
    console.error("Error parsing login Data:", e);
    return {appLoginID: null, sessionId: null};
  }
};

const createUserData = (username) => ({
  id: 1,
  username,
  email: `${username}@yuanta.com.vn`,
  name: username,
});

const generateToken = () => `token_${Date.now()}_${Math.random().toString(36)}`;

const saveAuthToStorage = (token, user) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(user));
};

const clearAuthFromStorage = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
};


export const AuthProvider = ({children}) => {
  // State
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("authUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSessionId, setOtpSessionId] = useState(null);
  const [pendingUsername, setPendingUsername] = useState(null);
  const [otpMessage, setOtpMessage] = useState("");
  const [isGuestMode, setIsGuestMode] = useState(false);



  const requestOTP = useCallback((sessionId) => {
    setTimeout(() => {
      const otpSeq = sendOTPVerificationRequest(sessionId);
      subscribeTradingResponse(`SEQ_${otpSeq}`, (otpData) => {
        if (otpData?.Message) setOtpMessage(otpData.Message);
        unsubscribeTradingResponse(`SEQ_${otpSeq}`);
      });
    }, 2000);
  }, []);


  const login = useCallback(
    async (username, password) => {
      setLoading(true);
      setError(null);

      return new Promise((resolve) => {
        // Validation
        if (!navigator.onLine) {
          const msg =
            "Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.";
          setError(msg);
          setLoading(false);
          return resolve({success: false, error: msg});
        }

        if (!username || !password) {
          const msg = "Vui lòng nhập tài khoản và mật khẩu";
          setError(msg);
          setLoading(false);
          return resolve({success: false, error: msg});
        }

        let isHandled = false;
        const socket = initTradingSocket();
        const clientSeq = sendLoginRequest(username, password);

        // Network error handler
        const handleNetworkError = () => {
          if (isHandled) return;
          isHandled = true;
          unsubscribeTradingResponse(`SEQ_${clientSeq}`);
          socket.off("disconnect", handleNetworkError);
          window.removeEventListener("offline", handleNetworkError);

          const msg =
            "Mất kết nối trong quá trình đăng nhập. Vui lòng thử lại.";
          setError(msg);
          setLoading(false);
          resolve({success: false, error: msg});
        };

        socket.once("disconnect", handleNetworkError);
        window.addEventListener("offline", handleNetworkError);

        // Login response handler
        const handler = (data) => {
          if (isHandled) return;
          isHandled = true;
          unsubscribeTradingResponse(`SEQ_${clientSeq}`);
          socket.off("disconnect", handleNetworkError);
          window.removeEventListener("offline", handleNetworkError);

          // Login failed
          if (!data || String(data.Result) !== "1") {
            const msg = data?.Message || "Đăng nhập thất bại";
            setError(msg);
            setLoading(false);
            return resolve({success: false, error: msg});
          }

          // Login success - parse data
          const {appLoginID, sessionId: parsedSessionId} =
            parseLoginData(data);
          if (appLoginID) saveAppLoginID(appLoginID);

          const sessionId =
            parsedSessionId ||
            data.SessionId ||
            data.SessionID ||
            data.TransId ||
            clientSeq;
          if (sessionId) saveSessionID(sessionId);

          // Setup OTP flow
          setRequiresOTP(true);
          setOtpCountdown(120);
          setOtpSessionId(sessionId);
          setPendingUsername(username);
          setOtpMessage(
            data.Message || "Vui lòng nhập mã OTP để hoàn tất đăng nhập"
          );
          setLoading(false);

          requestOTP(sessionId);

          resolve({
            success: true,
            requiresOTP: true,
            sessionId,
          });
        };

        subscribeTradingResponse(`SEQ_${clientSeq}`, handler);

        // Timeout
        setTimeout(() => {
          if (isHandled) return;
          isHandled = true;
          unsubscribeTradingResponse(`SEQ_${clientSeq}`);
          socket.off("disconnect", handleNetworkError);
          window.removeEventListener("offline", handleNetworkError);

          const msg = "Hết thời gian chờ phản hồi từ server";
          setError(msg);
          setLoading(false);
          resolve({success: false, error: msg});
        }, 30000);
      });
    },
    [requestOTP]
  );


  const verifyOTP = useCallback(
    async (otpCode) => {
      setLoading(true);
      setError(null);

      return new Promise((resolve) => {
        const wrongOtpSeq = sendWrongOTP(otpCode);

        const wrongOtpHandler = (wrongOtpData) => {
          unsubscribeTradingResponse(`SEQ_${wrongOtpSeq}`);

          if (wrongOtpData?.Message) setOtpMessage(wrongOtpData.Message);

          // OTP verification failed
          if (!wrongOtpData || String(wrongOtpData.Result) !== "1") {
            setLoading(false);
            return resolve({
              success: false,
              error: wrongOtpData?.Message || "OTP không hợp lệ",
            });
          }

          // OTP success - update SessionID from OTP response
          if (wrongOtpData.TransId) {
            saveSessionID(wrongOtpData.TransId);
          }

          // Create user session
          const userData = createUserData(pendingUsername);
          const newToken = generateToken();

          saveAuthToStorage(newToken, userData);

          setToken(newToken);
          setUser(userData);
          setIsAuthenticated(true);
          setRequiresOTP(false);
          setOtpCountdown(0);
          setOtpSessionId(null);
          setPendingUsername(null);
          setLoading(false);

          resolve({success: true, user: userData});
        };

        subscribeTradingResponse(`SEQ_${wrongOtpSeq}`, wrongOtpHandler);

        // Timeout
        setTimeout(() => {
          unsubscribeTradingResponse(`SEQ_${wrongOtpSeq}`);
          if (loading) {
            setLoading(false);
            const msg = "Hết thời gian chờ xác thực OTP";
            setOtpMessage(msg);
            resolve({success: false, error: msg});
          }
        }, 15000);
      });
    },
    [pendingUsername, loading]
  );

  const cancelOTP = useCallback(() => {
    setRequiresOTP(false);
    setOtpCountdown(0);
    setOtpSessionId(null);
    setPendingUsername(null);
    setError(null);
  }, []);

  const resendOTP = useCallback(() => {
    if (!otpSessionId) return;

    setOtpCountdown(120);
    setError(null);
    requestOTP(otpSessionId);
  }, [otpSessionId, requestOTP]);


  const enterGuestMode = useCallback(() => {
    setIsGuestMode(true);
    setRequiresOTP(false);
    setOtpCountdown(0);
    setOtpSessionId(null);
    setPendingUsername(null);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    clearAuthFromStorage();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    disconnectTradingSocket();
  }, []);

  const clearError = useCallback(() => setError(null), []);


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


export const useAuth = () => React.useContext(AuthContext);
