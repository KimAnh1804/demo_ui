import React, {useState, useEffect, useRef} from "react";
import "./OTPModal.scss";
import {FaLock} from "react-icons/fa";

export default function OTPModal({
  isOpen,
  onVerify,
  onCancel,
  onResendOTP,
  countdown,
  otpMessage,
}) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(countdown || 120);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const inputRef = useRef(null);
  const [showOtp] = useState(false);

  useEffect(() => {
    if (isOpen && inputRef.current && timer > 0) {
      inputRef.current.focus();
    }
  }, [isOpen, timer]);

  useEffect(() => {
    setTimer(countdown || 120);
  }, [countdown]);

  useEffect(() => {
    if (isOpen && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, timer]);

  const handleVerify = () => {
    if (timer === 0) {
      setError("Mã OTP đã hết hạn. Vui lòng lấy mã mới.");
      return;
    }
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP");
      return;
    }
    setError("");
    onVerify(otp);
  };

  useEffect(() => {
    if (
      (otpMessage && otpMessage.includes("sai")) ||
      otpMessage.includes("không hợp lệ")
    ) {
      setError(otpMessage);
    }
  }, [otpMessage]);

  const handleCancel = () => setShowConfirmModal(true);

  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
    setOtp("");
    setError("");
    onCancel(false);
  };

  const handleContinue = () => setShowConfirmModal(false);

  const handleResendOTP = () => {
    setOtp("");
    setError("");
    setTimer(120);
    onResendOTP();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleVerify();
  };

  if (!isOpen) return null;

  const isExpired = timer === 0;

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal">
        <div className="otp-modal-header">
          <div className="otp-icon">
            <FaLock />
          </div>
          <h2 className="otp-title">Xác thực OTP</h2>
        </div>

        <div className="otp-modal-body">
          <p className="otp-description">
            {otpMessage &&
              !otpMessage.includes("sai") &&
              !otpMessage.includes("không hợp lệ")
              ? otpMessage
              : "Mã xác thực YS-OTP đã được gửi đến thiết bị của bạn"}
          </p>

          <div className="otp-input-group">
            <label htmlFor="otp-input" className="otp-label">
              OTP
            </label>
            <input
              ref={inputRef}
              id="otp-input"
              type="password"
              className="otp-input"
              placeholder=""
              value={otp}
              onChange={(e) => {
                const newOtp = e.target.value;
                setOtp(newOtp);
                setError("");

                // Tự động submit khi nhập đủ 6 ký tự
                if (newOtp.length === 6 && timer > 0) {
                  setTimeout(() => {
                    onVerify(newOtp);
                  }, 100);
                }
              }}
              onKeyPress={handleKeyPress}
              maxLength={6}
              disabled={isExpired}
            />
          </div>

          <div className={`otp-countdown ${isExpired ? "expired" : ""}`}>
            {isExpired ? (
              <span className="expired-text">Mã OTP đã hết hạn</span>
            ) : (
              <>
                <span>Mã OTP hết hạn sau </span>
                <strong>{timer} giây</strong>
              </>
            )}
          </div>

          {error && <div className="otp-error">{error}</div>}
        </div>

        <div className="otp-modal-footer">
          {isExpired ? (
            <button
              className="otp-btn otp-btn-resend"
              onClick={handleResendOTP}
            >
              LẤY MÃ OTP
            </button>
          ) : (
            <button className="otp-btn otp-btn-verify" onClick={handleVerify}>
              XÁC THỰC OTP
            </button>
          )}
          <button className="otp-btn otp-btn-cancel" onClick={handleCancel}>
            Bỏ qua
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3>Xác nhận</h3>
            </div>
            <div className="confirm-modal-body">
              <p>Quý khách vui lòng nhập OTP xác thực để hoàn tất đăng nhập</p>
            </div>
            <div className="confirm-modal-footer">
              <button
                className="confirm-btn confirm-btn-agree"
                onClick={handleContinue}
              >
                Đồng ý
              </button>
              <button
                className="confirm-btn confirm-btn-cancel"
                onClick={handleConfirmCancel}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
