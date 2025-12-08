import React from "react";
import {useAuth} from "../../contexts/AuthContext";
import {LoginPage} from "../LoginPage";

//ProtectedRoute: Component bảo vệ các route chỉ cho phép khi đã đăng nhập
// Nếu chưa đăng nhập → hiển thị LoginPage
// Nếu đã đăng nhập → hiển thị component cần bảo vệ
export const ProtectedRoute = ({children}) => {
  const {isAuthenticated, loading} = useAuth();

  // Đang load thông tin auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          {/* <p>Đang kiểm tra đăng nhập...</p> */}
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → hiển thị LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Đã đăng nhập → hiển thị component chính
  return children;
};

export default ProtectedRoute;
