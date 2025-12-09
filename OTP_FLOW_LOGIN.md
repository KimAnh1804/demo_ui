┌─────────────────────────────────────────────────────────────────────┐
│ USER STARTS LOGIN │
└─────────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────┐
│ Enter Username/Password │
└─────────────────────────┘
│
▼
┌─────────────────────────┐
│ Click "Đăng nhập" │
└─────────────────────────┘
│
▼
┌─────────────────────────┐
│ Send Login Request │
│ (socketTrading.js) │
└─────────────────────────┘
│
▼
┌─────────────────────────┐
│ Wait for Response │
└─────────────────────────┘
│
┌─────────────────┴─────────────────┐
▼ ▼
┌───────────────────────┐ ┌───────────────────────┐
│ Result ≠ "1" │ │ Result = "1" │
│ (Login Failed) │ │ (Login Success) │
└───────────────────────┘ └───────────────────────┘
│ │
▼ ▼
┌───────────────────────┐ ┌───────────────────────┐
│ Show Error Message │ │ Check RequiresOTP │
└───────────────────────┘ └───────────────────────┘
│
┌─────────────────┴─────────────────┐
▼ ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│ RequiresOTP = "1" │ │ RequiresOTP ≠ "1" │
│ (OTP Required) │ │ (No OTP) │
└─────────────────────────┘ └─────────────────────────┘
│ │
▼ ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│ Set OTP States: │ │ Complete Login │
│ - requiresOTP = true │ │ - Save token │
│ - otpCountdown = 300 │ │ - Save user │
│ - otpSessionId = xxx │ │ - setAuthenticated │
└─────────────────────────┘ └─────────────────────────┘
│ │
▼ ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│ Show OTP Modal │ │ Go to AppMain │
│ - 6 input boxes │ │ (Bảng giá) │
│ - Countdown timer │ └─────────────────────────┘
│ - 3 buttons │
└─────────────────────────┘
│
┌─────────────────┼─────────────────┐
▼ ▼ ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────┐
│ User enters OTP │ │ Wait timeout │ │ Click Skip │
└───────────────────┘ └───────────────┘ └───────────────┘
│ │ │
▼ ▼ ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────┐
│ Click "Xác nhận" │ │ Countdown = 0 │ │ skipOTP() │
└───────────────────┘ └───────────────┘ └───────────────┘
│ │ │
▼ ▼ │
┌───────────────────┐ ┌───────────────┐ │
│ Send Verify OTP │ │ Enable Resend │ │
│ Request │ │ Button │ │
└───────────────────┘ └───────────────┘ │
│ │ │
▼ ▼ │
┌───────────────────┐ ┌───────────────┐ │
│ Wait Response │ │ Click Resend │ │
└───────────────────┘ └───────────────┘ │
│ │ │
┌───────────┴───────┐ ▼ │
▼ ▼ ┌───────────────┐ │
┌────────┐ ┌────────┐│ Send Resend │ │
│ Wrong │ │Correct ││ OTP Request │ │
│ OTP │ │ OTP │└───────────────┘ │
└────────┘ └────────┘ │ │
│ │ ▼ │
▼ │ ┌───────────────┐ │
┌────────┐ │ │ Reset Timer │ │
│ Show │ │ │ New countdown │ │
│ Error │ │ └───────────────┘ │
└────────┘ │ │ │
│ │ └─────────────────┤
│ │ │
└───────────────────┴───────────────────────────┘
│
▼
┌─────────────────────────┐
│ Complete Login │
│ - Save token │
│ - Save user │
│ - setAuthenticated │
│ - Clear OTP states │
└─────────────────────────┘
│
▼
┌─────────────────────────┐
│ Go to AppMain │
│ (Bảng giá) │
└─────────────────────────┘

```

## State Flow

```

┌─────────────────────────────────────────────────────────────┐
│ AuthContext States │
├─────────────────────────────────────────────────────────────┤
│ │
│ Initial State: │
│ ├─ isAuthenticated: false │
│ ├─ requiresOTP: false │
│ ├─ otpCountdown: 0 │
│ ├─ otpSessionId: null │
│ └─ otpError: null │
│ │
│ After Login (OTP Required): │
│ ├─ isAuthenticated: false (still) │
│ ├─ requiresOTP: true ✅ │
│ ├─ otpCountdown: 300 ✅ │
│ ├─ otpSessionId: "session_xxx" ✅ │
│ └─ otpError: null │
│ │
│ After OTP Verify Success: │
│ ├─ isAuthenticated: true ✅ │
│ ├─ requiresOTP: false │
│ ├─ otpCountdown: 0 │
│ ├─ otpSessionId: null │
│ └─ otpError: null │
│ │
│ After OTP Verify Fail: │
│ ├─ isAuthenticated: false │
│ ├─ requiresOTP: true (still) │
│ ├─ otpCountdown: (continues) │
│ ├─ otpSessionId: "session_xxx" (same) │
│ └─ otpError: "Mã OTP không chính xác" ❌ │
│ │
└─────────────────────────────────────────────────────────────┘

```

## Component Interaction

```

┌──────────────────────────────────────────────────────────────────┐
│ LoginPage.jsx │
├──────────────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Login Form │ │
│ │ - Username input │ │
│ │ - Password input │ │
│ │ - Submit button │ │
│ └────────────────────────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ useAuth() Hook │ │
│ │ - login() │ │
│ │ - requiresOTP │ │
│ │ - otpCountdown │ │
│ │ - verifyOTP() │ │
│ │ - resendOTP() │ │
│ │ - skipOTP() │ │
│ └────────────────────────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ OTPModal Component │ │
│ │ Props: │ │
│ │ - isOpen={requiresOTP} │ │
│ │ - countdown={otpCountdown} │ │
│ │ - error={otpError} │ │
│ │ - onVerify={handleOTPVerify} │ │
│ │ - onResend={handleOTPResend} │ │
│ │ - onClose={handleOTPClose} │ │
│ └────────────────────────────────────────────────────────┘ │
│ │
└──────────────────────────────────────────────────────────────────┘
│
▼
┌──────────────────────────────────────────────────────────────────┐
│ AuthContext.jsx │
├──────────────────────────────────────────────────────────────────┤
│ │
│ States: requiresOTP, otpCountdown, otpSessionId, otpError │
│ Functions: login(), verifyOTP(), resendOTP(), skipOTP() │
│ │
└──────────────────────────────────────────────────────────────────┘
│
▼
┌──────────────────────────────────────────────────────────────────┐
│ socketTrading.js │
├──────────────────────────────────────────────────────────────────┤
│ │
│ - sendLoginRequest() │
│ - sendOTPVerification() │
│ - sendResendOTP() │
│ - subscribeTradingResponse() │
│ │
└──────────────────────────────────────────────────────────────────┘
│
▼
┌───────────────┐
│ WebSocket │
│ Server │
└───────────────┘

```

## Timer Countdown Flow

```

OTP Modal Opens
│
▼
otpCountdown = 300 (5:00)
│
▼
┌────────────────────┐
│ useEffect Hook │
│ Watches countdown │
└────────────────────┘
│
▼
Every 1 second:
│
├─ If countdown > 0:
│ └─ countdown--
│ └─ Display: MM:SS
│
└─ If countdown = 0:
└─ Display: "Mã OTP đã hết hạn"
└─ Enable "Gửi lại" button

```

## Error Handling Flow

```

User enters OTP
│
▼
Click "Xác nhận"
│
▼
Send verifyOTP()
│
▼
Wait for response
│
├─ Success (Result = "1"):
│ └─ Clear error
│ └─ Complete login
│ └─ Go to AppMain
│
└─ Fail (Result ≠ "1"):
└─ Set otpError
└─ Show error message
└─ Shake animation
└─ Red border
└─ Allow retry

```

```
