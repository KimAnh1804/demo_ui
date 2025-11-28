// Gửi lệnh HIST_REQ cho topic
let histSeq = 1;
function emitHISTREQ(topicFull, clientSeq, transId) {
  const s = initSocket();
  let topic = topicFull;
  let value = "";
  if (topicFull.includes("|")) {
    const arr = topicFull.split("|");
    if (arr.length >= 3) {
      topic = arr.slice(0, 2).join("|");
      value = arr[2];
    }
  }
  // Tạo ClientSeq và TransId nhỏ, tăng dần
  if (clientSeq === undefined) {
    clientSeq = histSeq;
    histSeq += 1;
  }
  if (transId === undefined) {
    transId = String(clientSeq);
  }
  const payload = {
    ClientSeq: clientSeq,
    TransId: transId,
    topic: [topic],
    value: [value],
    fromseq: [0],
    size: [500],
  };
  s.emit("HIST_REQ", payload);
}
// INTRADAY_1m realtime
const INTRADAY_TOPICS = [
  "INTRADAY_1m|STO|001",
  "INTRADAY_1m|STO|101",
  "INTRADAY_1m|STX|002",
  "INTRADAY_1m|UPX|301",
  "INTRADAY_1m|STX|100",
];
let currentIntradayTopic = null;

// Sub 1 topic, unsub topic cũ nếu có, log HIST_RES
export function subscribeIntradayTopic(topic, { onHistRes, onFOSStream } = {}) {
  if (!INTRADAY_TOPICS.includes(topic)) {
    console.warn("Topic không hợp lệ:", topic);
    return;
  }
  // Unsub topic cũ
  if (currentIntradayTopic && currentIntradayTopic !== topic) {
    unsubscribeStream(currentIntradayTopic);
  }
  currentIntradayTopic = topic;
  // Gửi HIST_REQ khi chọn topic mới
  emitHISTREQ(topic);
  // Đăng ký handler riêng cho từng loại event
  const histHandler = (data) => {
    if (data && (data.type === "HIST_RES" || data[0] === "HIST_RES")) {
      let d = Array.isArray(data) ? data[1] : data;

      if (
        Array.isArray(data) &&
        data[0] === "HIST_RES" &&
        data[1] &&
        data[1].Data &&
        Array.isArray(data[1].Data) &&
        data[1].Data[0] &&
        data[1].Data[0].topic
      ) {
        logTopic = data[1].Data[0].topic;
        logData = data[1];
        foundTopic = true;
      } else if (
        data.Data &&
        Array.isArray(data.Data) &&
        data.Data[0] &&
        data.Data[0].topic
      ) {
        logTopic = data.Data[0].topic;
        foundTopic = true;
      }
      if (!foundTopic) logTopic = "NO_TOPIC";
      if (onHistRes) onHistRes(logData, logTopic);
    }
  };
  subscribeStream(topic, histHandler);
}

export function unsubscribeIntradayTopic() {
  if (currentIntradayTopic) {
    unsubscribeStream(currentIntradayTopic);
    currentIntradayTopic = null;
  }
}
import { useEffect } from "react";
import { io } from "socket.io-client";

let socket = null;
let isReady = false;
let listenersSetup = false;

const topicHandlers = new Map();
const subscribedTopics = new Set();
const pendingTopics = new Set();

// Khởi tạo kết nối socket
const initSocket = () => {
  if (socket) {
    if (!socket.connected && !socket.connecting) {
      socket.connect();
    }
    return socket;
  }

  // Tạo kết nối mới
  socket = io("https://ysflex.yuanta.com.vn", {
    path: "/market",
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  socket.on("connect", () => {
    isReady = true;
    flushPendingSubscriptions();
  });

  socket.on("disconnect", (reason) => {
    isReady = false;
  });

  socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message || err);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });

  // Chỉ setup listeners một lần
  if (!listenersSetup) {
    setupStreamListeners();
    listenersSetup = true;
  }

  return socket;
};

// Gửi tất cả các topic đang chờ sub khi socket đã kết nối
const flushPendingSubscriptions = () => {
  if (pendingTopics.size === 0) return;

  pendingTopics.forEach((topic) => {
    emitSUB(topic);
    pendingTopics.delete(topic);
  });
};

// Gửi lệnh SUB_REQ
const emitSUB = (topic) => {
  const s = initSocket();

  const payload = {
    topic: [topic],
    value: [""],
  };
  s.emit("SUB_REQ", payload);
};

// Gửi lệnh UNSUB_REQ
const emitUNSUB = (topic) => {
  const s = initSocket();
  s.emit("UNSUB_REQ", { topic: [topic] });
};

const setupStreamListeners = () => {
  const s = initSocket();

  s.on("onFOSStream", (data) => {
    routeDataToHandlers(data);
  });

  s.on("HIST_RES", (data) => {
    routeDataToHandlers(data);
  });

  s.on("SUB_RES", (res) => {});

  s.on("UNSUB_RES", (res) => {});
};

const routeDataToHandlers = (data) => {
  if (!data || typeof data !== "object") return;

  // Data phải có topic field để match với handler
  const topic = data.topic;

  // Gửi dữ liệu đến handler tương ứng
  if (topic && topicHandlers.has(topic)) {
    const handler = topicHandlers.get(topic);
    try {
      handler(data);
    } catch (err) {
      console.error("Lỗi xử lý dữ liệu cho topic", topic, ":", err);
    }
  }
};

// Đăng ký nhận dữ liệu từ một topic cụ thể
export const subscribeStream = (topic, handler) => {
  const s = initSocket();

  topicHandlers.set(topic, handler);
  subscribedTopics.add(topic);

  if (s.connected) {
    emitSUB(topic);
  } else {
    pendingTopics.add(topic);
  }
};

// Hủy đăng ký nhận dữ liệu từ một topic cụ thể
export const unsubscribeStream = (topic) => {
  const s = initSocket();

  topicHandlers.delete(topic);
  subscribedTopics.delete(topic);
  pendingTopics.delete(topic);

  emitUNSUB(topic);
};

export const useStreamTopic = (topic, handler) => {
  useEffect(() => {
    if (!topic || !handler) return;

    subscribeStream(topic, handler);

    return () => {
      unsubscribeStream(topic);
    };
  }, [topic, handler]);
};

export const getStreamStatus = () => isReady;

export default {
  subscribeStream,
  unsubscribeStream,
  useStreamTopic,
  getStreamStatus,
  subscribeIntradayTopic,
  unsubscribeIntradayTopic,
};
