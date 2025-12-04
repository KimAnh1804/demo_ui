import React, { createContext, useState, useCallback, useEffect } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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

    try {
      // Tạm thời dùng hardcode (sau có thể thay bằng API call thực)
      const validUsername = "admin";
      const validPassword = "123456";

      if (username === validUsername && password === validPassword) {
        // Tạo token giả (trong thực tế sẽ từ server)
        const fakeToken = `token_${Date.now()}_${Math.random().toString(36)}`;
        const userData = {
          id: 1,
          username: username,
          email: `${username}@yuanta.com.vn`,
          name: "Admin User",
        };

        // Lưu vào localStorage
        localStorage.setItem("authToken", fakeToken);
        localStorage.setItem("authUser", JSON.stringify(userData));

        // Update state
        setToken(fakeToken);
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        throw new Error("Tài khoản hoặc mật khẩu không đúng");
      }
    } catch (err) {
      const errorMessage = err.message || "Đăng nhập thất bại";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm đăng xuất
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
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
