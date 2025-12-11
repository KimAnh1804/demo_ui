import { io } from "socket.io-client";
import { encryptString } from "../utils/encryption";

const TRADING_CONFIG = {
  ACCOUNT_CODE: "004C000503",
  PASSWORD: "hello6",
  IP_PRIVATE: "192.168.1.113",
  SEC_CODE: "004",
  WORKER_NAME: "FOSxID02",
  MW_LOGIN_ID: "WEB",
  MW_LOGIN_PSWD: ",+A,3-)-C.*,6,9,=+F*K.N*M.=+)+J,004",
};

let tradingSocket = null;
let isConnected = false;
let clientSeq = 0;
const tradingHandlers = new Map();

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

  tradingSocket = io("https://ysflex-uat.ysvn.com.vn/", {
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

export const sendOTPVerificationRequest = (otp) => {
  const clientSeq = getNextClientSeq();
  const encryptedOTP = encryptString(otp);

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
    SessionID: "",
  };

  sendTradingRequest(otpPayload);
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

export const getTradingSocketStatus = () => isConnected;

export const disconnectTradingSocket = () => {
  if (tradingSocket) {
    tradingSocket.disconnect();
    tradingSocket = null;
    isConnected = false;
  }
};

export default {
  initTradingSocket,
  sendTradingRequest,
  sendLoginRequest,
  sendOTPVerificationRequest,
  subscribeTradingResponse,
  unsubscribeTradingResponse,
  getTradingSocketStatus,
  disconnectTradingSocket,
};
