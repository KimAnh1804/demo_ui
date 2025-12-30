import { io } from "socket.io-client";
import { encryptString } from "../utils/encryption";
import { TRADING_CONFIG } from "../configs/tradingConfig";

let tradingSocket = null;
let isConnected = false;
let clientSeq = 0;
const tradingHandlers = new Map();
const STORAGE_KEYS = {
  SESSION_ID: "TRADING_SESSION_ID",
  APP_LOGIN_ID: "TRADING_APP_LOGIN_ID",
  OTP: "TRADING_OTP"
};

let savedEncryptedOtp = localStorage.getItem(STORAGE_KEYS.OTP) || "";
let savedSessionID = localStorage.getItem(STORAGE_KEYS.SESSION_ID) || "";
let savedAppLoginID = localStorage.getItem(STORAGE_KEYS.APP_LOGIN_ID) || "";

const getNextClientSeq = () => {
  clientSeq += 1;
  return clientSeq;
};

export const initTradingSocket = () => {
  if (tradingSocket) {
    if (!tradingSocket.connected && !tradingSocket.connecting) {
      tradingSocket.connect();
    }
    return tradingSocket;
  }

  tradingSocket = io(TRADING_CONFIG.SOCKET_URL, {
    path: "/services",
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  tradingSocket.on("connect", () => {
    isConnected = true;
  });

  tradingSocket.on("disconnect", () => {
    isConnected = false;
  });

  tradingSocket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
  });

  tradingSocket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });

  tradingSocket.on("RES_MSG", (data) => {
    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.error("Error parsing RES_MSG", e);
        return;
      }
    }

    if (parsedData?.ServiceName) {
      routeDataToHandlers(parsedData.ServiceName, parsedData);
    }

    if (parsedData?.ClientSeq) {
      routeDataToHandlers(`SEQ_${parsedData.ClientSeq}`, parsedData);
    }

    if (!parsedData.ServiceName && !parsedData.ClientSeq) {
      console.warn("RES_MSG missing ServiceName and ClientSeq", parsedData);
    }
  });

  return tradingSocket;
};

export const sendTradingRequest = (payload) => {
  const socket = initTradingSocket();

  if (!socket.connected) {
    return new Promise((resolve) => {
      socket.once("connect", () => {
        setTimeout(() => {
          socket.emit("REQ_MSG", JSON.stringify(payload));
          resolve(true);
        }, 500);
      });
    });
  }

  socket.emit("REQ_MSG", JSON.stringify(payload));
  return true;
};

// Gửi yêu cầu đăng nhập
export const sendLoginRequest = (
  accountCode = TRADING_CONFIG.ACCOUNT_CODE,
  password = TRADING_CONFIG.PASSWORD,
  ipPrivate = TRADING_CONFIG.IP_PRIVATE
) => {
  const clientSeq = getNextClientSeq();
  const encryptedPassword = encryptString(password);

  const loginPayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: TRADING_CONFIG.WORKER_NAME,
    ServiceName: "FOSxID02_Login",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: "",
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: [
      "login",
      accountCode,
      encryptedPassword,
      "",
      "",
      "N",
      "browser:Chrome|142.0.0.0,os:Windows|10",
      "",
      "WIN",
      "",
      "",
      "",
    ],
    TotInVal: 12,
    AprStat: "N",
    Operation: "U",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: ipPrivate,
    Otp: "",
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };

  sendTradingRequest(loginPayload);
  return clientSeq;
};

// Gửi yêu cầu xác thực OTP
export const sendOTPVerificationRequest = (otp) => {
  // Nhận mã OTP từ người dùng
  const clientSeq = getNextClientSeq();
  const encryptedOTP = encryptString(otp); // Mã hóa OTP
  
  // Save OTP for later use and persist
  savedEncryptedOtp = encryptedOTP;
  localStorage.setItem(STORAGE_KEYS.OTP, savedEncryptedOtp);

  const otpPayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: "FOSxID01",
    ServiceName: "FOSxID01_OTPManagement",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: "0000290095",
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: ["manual_otp"],
    TotInVal: 1,
    AprStat: "N",
    Operation: "I",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: encryptedOTP,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: saveSessionID,
  };

  sendTradingRequest(otpPayload);
  return clientSeq;
};
// Lưu SessionID từ response login
export const saveSessionID = (SessionID) => {
  savedSessionID = SessionID;
  if (SessionID) {
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, SessionID);
  }
};

// Lưu AppLoginID từ response login
export const saveAppLoginID = (appLoginID) => {
  savedAppLoginID = appLoginID;
  if (appLoginID) {
      localStorage.setItem(STORAGE_KEYS.APP_LOGIN_ID, appLoginID);
  }
};

// Gửi yêu cầu OTP sai
export const sendWrongOTP = (otpCode) => {
  const clientSeq = getNextClientSeq();
  const encryptedOTP = encryptString(otpCode);

  savedEncryptedOtp = encryptedOTP;

  const wrongOTPPayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: "FOSxID01",
    ServiceName: "FOSxID01_OTPManagement",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: "0000290095",
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: ["check_otp", encryptedOTP],
    TotInVal: 2,
    AprStat: "N",
    Operation: "U",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: encryptedOTP,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };
  sendTradingRequest(wrongOTPPayload);
  return clientSeq;
};

export const subscribeTradingResponse = (messageType, handler) => {
  if (!tradingHandlers.has(messageType)) {
    tradingHandlers.set(messageType, []);
  }
  tradingHandlers.get(messageType).push(handler);

  return () => {
    unsubscribeTradingResponse(messageType, handler);
  };
};

export const unsubscribeTradingResponse = (messageType, handler) => {
  const handlers = tradingHandlers.get(messageType);
  if (handlers) {
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
};

const routeDataToHandlers = (messageType, data) => {
  const handlers = tradingHandlers.get(messageType);
  if (handlers && handlers.length > 0) {
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error("Handler error:", error);
      }
    });
  }
};

// Tạo danh mục theo dõi mới
export const sendCreateWatchlist = (watchlistName, watchlistType) => {
  const clientSeq = getNextClientSeq();

  const createPayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: "FOSxID01",
    ServiceName: "FOSxID01_FavoritesMgt",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: savedAppLoginID || TRADING_CONFIG.ACCOUNT_CODE,
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: ["FAV_ADD", watchlistName, watchlistType],
    TotInVal: 3,
    AprStat: "N",
    Operation: "I",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: savedEncryptedOtp,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };

  sendTradingRequest(createPayload);
  return clientSeq;
};

// Cập nhật danh mục theo dõi
export const sendUpdateWatchlist = (watchlistId, watchlistName) => {
  const clientSeq = getNextClientSeq();

  const updatePayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: "FOSxID01",
    ServiceName: "FOSxID01_FavoritesMgt",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: savedAppLoginID || TRADING_CONFIG.ACCOUNT_CODE,
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: ["FAV_MOD", watchlistId.toString(), watchlistName],
    TotInVal: 3,
    AprStat: "N",
    Operation: "U",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: savedEncryptedOtp,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };

  sendTradingRequest(updatePayload);
  return clientSeq;
};

// Xóa danh mục theo dõi
export const sendDeleteWatchlist = (watchlistId) => {
  const clientSeq = getNextClientSeq();

  const deletePayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: "FOSxID01",
    ServiceName: "FOSxID01_FavoritesMgt",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: savedAppLoginID || TRADING_CONFIG.ACCOUNT_CODE,
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: ["FAV_REMOVE", watchlistId.toString()],
    TotInVal: 2,
    AprStat: "N",
    Operation: "I",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: savedEncryptedOtp,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };

  sendTradingRequest(deletePayload);
  return clientSeq;
};

export const sendRealtimeWatchlist = () => {
  const clientSeq = getNextClientSeq();

  const realtimePayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: "FOSqStock",
    ServiceName: "FOSqStock_01_online",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: savedAppLoginID || TRADING_CONFIG.ACCOUNT_CODE,
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: [TRADING_CONFIG.ACCOUNT_CODE],
    TotInVal: 1,
    AprStat: "N",
    Operation: "Q",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: savedEncryptedOtp,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };

  sendTradingRequest(realtimePayload);
  return clientSeq;
};

// Nhóm ngành tài chính
export const sendFinanceInfoRequest = () => {
  const clientSeq = getNextClientSeq();
  const groupPayload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: "FOSqMkt02Vs", 
    ServiceName: "FOSqMkt02Vs_FinanceInfo",
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: savedAppLoginID || TRADING_CONFIG.ACCOUNT_CODE,
    AppLoginPswd: "",
    ClientSentTime: "0",
    Lang: "VI",
    MdmTp: "02",
    InVal: ["10", "100"],
    TotInVal: 2,
    AprStat: "N",
    Operation: "Q",
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: savedEncryptedOtp,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };
  sendTradingRequest(groupPayload);
  return clientSeq;
};

// Lấy trạng thái kết nối socket
export const getTradingSocketStatus = () => isConnected;

export const disconnectTradingSocket = () => {
  if (tradingSocket) {
    tradingSocket.disconnect();
    tradingSocket = null;
    isConnected = false;
    savedEncryptedOtp = "";
    savedSessionID = "";
    savedAppLoginID = "";
    
    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.OTP);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.APP_LOGIN_ID);
  }
};


const reqFunct = {
  GET_LIST_STOCK_INDUSTRY: "GET_LIST_STOCK_INDUSTRY",
  GET_LIST_INDIVIDUAL_BONDS_SECURITIES: "GET_LIST_INDIVIDUAL_BONDS_SECURITIES"
};

// Lấy danh sách ngành - mã CK
export const sendListStockIndustryRequest = () => {
  const clientSeq = getNextClientSeq();
  const payload = {
    reqFunct: reqFunct.GET_LIST_STOCK_INDUSTRY,
    WorkerName: 'FOSqMkt02',
    ServiceName: 'FOSqMkt02_FinanceInfo',
    ClientSentTime: '0',
    Operation: 'Q',
    ClientSeq: clientSeq
  };
  sendTradingRequest(payload);
  return clientSeq;
};

// Lấy danh sách trái phiếu
export const sendGetListIndividualBondsSecuritiesRequest = () => {
  const clientSeq = getNextClientSeq();
  const payload = {
    reqFunct: reqFunct.GET_LIST_INDIVIDUAL_BONDS_SECURITIES,
    WorkerName: 'FOSqBond01',
    ServiceName: 'FOSqBond01_Common',
    Operation: 'Q',
    ClientSentTime: '0',
    ClientSeq: clientSeq
  };
  sendTradingRequest(payload);
  return clientSeq;
};


// Lấy sức mua 
export const sendGetBuyPowerRequest = (accountNo, symbol) => {
  const clientSeq = getNextClientSeq();
  const payload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: 'FOSqBuyPower',
    ServiceName: 'FOSqBuyPower',
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: savedAppLoginID || TRADING_CONFIG.ACCOUNT_CODE,
    AppLoginPswd: "",
    ClientSentTime: '0',
    Lang: "VI",
    MdmTp: "02",
    InVal: [accountNo, "01", symbol],
    TotInVal: 3,
    AprStat: "N",
    Operation: 'Q',
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: savedEncryptedOtp,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };
  console.log("[sendGetBuyPowerRequest] Sending payload:", payload);
  sendTradingRequest(payload);
  return clientSeq;
};

// Lấy khả năng bán 
export const sendGetSellAbleRequest = (accountNo) => {
  const clientSeq = getNextClientSeq();
  const payload = {
    CltVersion: "3.1.0",
    ClientSeq: clientSeq,
    SecCode: TRADING_CONFIG.SEC_CODE,
    WorkerName: 'FOSqSellAble',
    ServiceName: 'FOSqSellAble',
    TimeOut: 15,
    MWLoginID: TRADING_CONFIG.MW_LOGIN_ID,
    MWLoginPswd: TRADING_CONFIG.MW_LOGIN_PSWD,
    AppLoginID: savedAppLoginID || TRADING_CONFIG.ACCOUNT_CODE,
    AppLoginPswd: "",
    ClientSentTime: '0',
    Lang: "VI",
    MdmTp: "02",
    InVal: ["02", "today", accountNo, "01", "%", "G1"],
    TotInVal: 6,
    AprStat: "N",
    Operation: 'Q',
    CustMgnBrch: "",
    CustMgnAgc: "",
    BrkMgnBrch: "",
    BrkMgnAgc: "",
    LoginBrch: "",
    LoginAgnc: "",
    AprSeq: "",
    MakerDt: "",
    AprIP: "",
    AprID: "",
    AprAmt: "",
    IPPrivate: TRADING_CONFIG.IP_PRIVATE,
    Otp: savedEncryptedOtp,
    AcntNo: "",
    SubNo: "",
    BankCd: "",
    PCName: "",
    SessionID: "",
  };
  console.log("[sendGetSellAbleRequest] Sending payload:", payload);
  sendTradingRequest(payload);
  return clientSeq;
};

// Lấy encrypted OTP đã lưu
export const getSavedEncryptedOtp = () => savedEncryptedOtp;

export default {
  initTradingSocket,
  sendTradingRequest,
  sendLoginRequest,
  sendOTPVerificationRequest,
  sendWrongOTP,
  saveSessionID,
  saveAppLoginID,
  sendCreateWatchlist,
  sendUpdateWatchlist,
  sendDeleteWatchlist,
  sendRealtimeWatchlist,
  sendFinanceInfoRequest,
  sendListStockIndustryRequest,
  sendGetListIndividualBondsSecuritiesRequest,
  sendGetBuyPowerRequest,
  sendGetSellAbleRequest,
  subscribeTradingResponse,
  unsubscribeTradingResponse,
  getTradingSocketStatus,
  disconnectTradingSocket,
};
