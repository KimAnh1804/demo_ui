import React, {createContext, useState, useCallback, useEffect} from "react";
import {
  sendLoginRequest,
  subscribeTradingResponse,
  unsubscribeTradingResponse,
  disconnectTradingSocket,
  initTradingSocket,
} from "../services/socketTrading";

export const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra token từ localStorage khi mount
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

  // Hàm đăng nhập
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      // 1. Kiểm tra mạng trước khi gửi request
      if (!navigator.onLine) {
        const msg = "Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.";
        setError(msg);
        setLoading(false);
        resolve({success: false, error: msg});
        return;
      }

      if (!username || !password) {
        const msg = "Vui lòng nhập tài khoản và mật khẩu";
        setError(msg);
        setLoading(false);
        resolve({success: false, error: msg});
        return;
      }

      let isHandled = false;

      // Lấy socket để lắng nghe sự kiện disconnect
      const socket = initTradingSocket();

      // Hàm xử lý khi mất kết nối
      const handleNetworkError = () => {
        if (isHandled) return;
        isHandled = true;

        // Cleanup
        unsubscribeTradingResponse(`SEQ_${clientSeq}`, handler);
        socket.off("disconnect", handleNetworkError);
        window.removeEventListener("offline", handleNetworkError);

        const msg = "Mất kết nối trong quá trình đăng nhập. Vui lòng thử lại.";
        console.log(msg);
        setError(msg);
        setLoading(false);
        resolve({success: false, error: msg});
      };

      // Lắng nghe sự kiện
      socket.once("disconnect", handleNetworkError);
      window.addEventListener("offline", handleNetworkError);

      const clientSeq = sendLoginRequest(username, password);
      console.log("Login request sent with ClientSeq:", clientSeq);

      const handler = (data) => {
        if (isHandled) return;
        isHandled = true;
        unsubscribeTradingResponse(`SEQ_${clientSeq}`, handler);

        // Cleanup listeners
        socket.off("disconnect", handleNetworkError);
        window.removeEventListener("offline", handleNetworkError);

        console.log("Login response received:", data);

        // Giả sử Result = 1 là thành công
        if (data && String(data.Result) === "1") {
          const userData = {
            id: 1,
            username: username,
            email: `${username}@yuanta.com.vn`,
            name: username,
          };

          // Tạo token giả (vì socket login thường dựa trên session)
          const fakeToken = `token_${Date.now()}_${Math.random().toString(36)}`;

          // Lưu vào localStorage
          localStorage.setItem("authToken", fakeToken);
          localStorage.setItem("authUser", JSON.stringify(userData));

          // Update state
          setToken(fakeToken);
          setUser(userData);
          setIsAuthenticated(true);
          setLoading(false);

          resolve({success: true, user: userData});
        } else {
          const msg = data.Message || "Đăng nhập thất bại";
          setError(msg);
          setLoading(false);
          resolve({success: false, error: msg});
        }
      };

      subscribeTradingResponse(`SEQ_${clientSeq}`, handler);

      // Timeout
      setTimeout(() => {
        if (!isHandled) {
          isHandled = true;
          unsubscribeTradingResponse(`SEQ_${clientSeq}`, handler);

          // Cleanup listeners
          socket.off("disconnect", handleNetworkError);
          window.removeEventListener("offline", handleNetworkError);

          const msg = "Hết thời gian chờ phản hồi từ server";
          setError(msg);
          setLoading(false);
          resolve({success: false, error: msg});
        }
      }, 30000);
    });
  }, []);

  // Hàm đăng xuất
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    disconnectTradingSocket();
  }, []);

  // Hàm clear error
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

