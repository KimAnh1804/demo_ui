import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./LoginPage.scss";
import logo from "../../assets/logo-ysvn-light.05dae14283a8b82a75f930de6e006060.svg";
import nen from "../../assets/nen.jpg";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { GrDocumentPerformance } from "react-icons/gr";
import { MdTipsAndUpdates, MdOutlineSecurity } from "react-icons/md";
import { BsFillDatabaseFill } from "react-icons/bs";
import { FaRegCalendarAlt } from "react-icons/fa";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import OTPModal from "../OTPModal/OTPModal";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    login,
    error,
    clearError,
    requiresOTP,
    otpCountdown,
    otpMessage,
    verifyOTP,
    cancelOTP,
    resendOTP,
    enterGuestMode,
  } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!username || !password) return;

    setIsLoading(true);
    await login(username, password);
    setIsLoading(false);
  };

  const handleVerifyOTP = async (otpCode) => {
    const result = await verifyOTP(otpCode);
    if (!result.success) console.error("OTP verification failed");
  };

  const handleCancelOTP = (shouldContinue) => {
    if (shouldContinue === false) {
      cancelOTP();
      enterGuestMode();
    }
  };

  const handleResendOTP = () => resendOTP?.();

  return (
    <div className="login-container">
      <img src={nen} alt="Background" className="background-image" />
      <div className="login-bg"></div>
      <div className="login-box">
        {/* Logo */}
        <div className="login-header">
          <div className="logo">
            <img src={logo} alt="Logo" className="company-logo" />
          </div>

          <p className="company-name">
            Công Ty Trách Nhiệm Hữu Hạn Chứng Khoán Yuanta Việt Nam
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Username Input */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Số TK/ Số DT/ Email/ CMND
            </label>
            <div className="input-wrapper">
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder=""
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  handleInputChange();
                }}
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder=""
                value={password}
                maxLength={82}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                disabled={isLoading}
              />
              {/* <span className="fa-solid fa-eye-slash"></span> */}
              <span
                className="password-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
              </span>
            </div>
          </div>

          {/* Remember Account */}
          <div className="form-remember">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked className="checkbox" />
              <span>Lưu tài khoản</span>
            </label>
            <a href="#" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          {/* Error Message */}
          {error && <div className="error-message"> {error}</div>}

          {/* Login Button */}
          <button
            type="submit"
            className="btn-login"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>

          {/* Sign Up Link */}
          <div className="login-divider">
            <span>Bạn chưa có tài khoản ?</span>
          </div>

          {/* Sign Up Button */}
          <button type="button" className="btn-signup">
            MỞ TÀI KHOẢN
          </button>
        </form>

        {/* Footer Links */}
        <div className="login-footer">
          <a href="#" className="footer-link">
            <span className="footer-icon">
              <GrDocumentPerformance />
            </span>
            <span>Bảng giá</span>
          </a>
          <a href="#" className="footer-link">
            <span className="footer-icon">
              <MdTipsAndUpdates />
            </span>
            <span>Hướng dẫn sử dụng</span>
          </a>
          <a href="#" className="footer-link">
            <span className="footer-icon">
              <BsFillDatabaseFill />
            </span>
            <span>Hỗ trợ giao dịch</span>
          </a>
          <a href="#" className="footer-link">
            <span className="footer-icon">
              <FaRegCalendarAlt />
            </span>
            <span>Điều khoản sử dụng</span>
          </a>
          <a href="#" className="footer-link">
            <span className="footer-icon">
              <MdOutlineSecurity />
            </span>
            <span>Bảo mật</span>
          </a>
          <a href="#" className="footer-link">
            <span className="footer-icon">
              <HiOutlineDocumentSearch />
            </span>
            <span>Bản công bố rủi ro</span>
          </a>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={requiresOTP} // Hiển thị modal OTP
        onVerify={handleVerifyOTP} // Xử lý xác thực OTP
        onCancel={handleCancelOTP}
        onResendOTP={handleResendOTP} // Xử lý gửi lại OTP
        countdown={otpCountdown}
        otpMessage={otpMessage}
      />
    </div>
  );
}
