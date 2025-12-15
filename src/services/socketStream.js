import { useEffect } from "react";
import { io } from "socket.io-client";
import { TOPIC_CONFIGS } from "../configs/marketConfig";

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

  socket.on("disconnect", () => {
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

  s.on("SUB_RES", () => {});
  s.on("UNSUB_RES", () => {});
};

const routeDataToHandlers = (data) => {
  if (!data || typeof data !== "object") return;

  // Xử lý HIST_RES - lấy topic từ data[1].Data[0].topic hoặc data.Data[0].topic
  let topic = data.topic;
  if (!topic) {
    if (
      Array.isArray(data) &&
      data[0] === "HIST_RES" &&
      data[1] &&
      data[1].Data &&
      Array.isArray(data[1].Data) &&
      data[1].Data[0]
    ) {
      topic = data[1].Data[0].topic;
    } else if (data.Data && Array.isArray(data.Data) && data.Data[0]) {
      topic = data.Data[0].topic;
    }
  }

  // Gửi dữ liệu đến tất cả handlers của topic này
  if (topic && topicHandlers.has(topic)) {
    const handlers = topicHandlers.get(topic);
    // handlers là array, gọi tất cả
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error("Lỗi xử lý dữ liệu cho topic", topic, ":", err);
      }
    });
  }
};

// Đăng ký nhận dữ liệu từ một topic cụ thể
export const subscribeStream = (topic, handler) => {
  const s = initSocket();

  // Lưu handler vào array cho topic này
  if (!topicHandlers.has(topic)) {
    topicHandlers.set(topic, []);
  }
  topicHandlers.get(topic).push(handler);

  subscribedTopics.add(topic);

  if (s.connected) {
    emitSUB(topic);
  } else {
    pendingTopics.add(topic);
  }
};

// Hủy đăng ký nhận dữ liệu từ một topic cụ thể
export const unsubscribeStream = (topic) => {


  topicHandlers.delete(topic);
  subscribedTopics.delete(topic);
  pendingTopics.delete(topic);

  emitUNSUB(topic);
};

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
const INTRADAY_TOPICS = TOPIC_CONFIGS.map(c => c.intraday);
const intradaySubscriptions = new Map(); // Lưu trữ subscriptions theo topic

// Sub 1 topic với callback
export function subscribeIntradayTopic(topic, { onHistRes } = {}) {
  if (!INTRADAY_TOPICS.includes(topic)) {
    console.warn("Topic không hợp lệ:", topic);
    return;
  }

  // Gửi HIST_REQ mỗi khi gọi - để lấy dữ liệu lịch sử
  emitHISTREQ(topic);

  // Nếu không pass onHistRes, chỉ gửi HIST_REQ mà thôi (sử dụng handler cũ)
  if (!onHistRes) {
    return;
  }

  // Đăng ký handler cho HIST_RES
  const histHandler = (data) => {
    if (onHistRes) {
      onHistRes(data, topic);
    }
  };

  // Nếu chưa subscribe, mới subscribe lần đầu
  if (!intradaySubscriptions.has(topic)) {
    intradaySubscriptions.set(topic, { handler: histHandler });
    subscribeStream(topic, histHandler);
  } else {
    // Nếu đã subscribe, update handler mới (từ selectedSymbol change)
    const existing = intradaySubscriptions.get(topic);
    const oldHandler = existing.handler;

    // Unregister old handler từ topicHandlers
    if (topicHandlers.has(topic)) {
      const handlers = topicHandlers.get(topic);
      const idx = handlers.indexOf(oldHandler);
      if (idx !== -1) {
        handlers.splice(idx, 1);
      }
    }

    // Register new handler
    intradaySubscriptions.set(topic, { handler: histHandler });
    subscribeStream(topic, histHandler);
  }
}
export function unsubscribeIntradayTopic(topic = null) {
  if (topic) {
    // Unsubscribe topic cụ thể
    if (intradaySubscriptions.has(topic)) {
      const { handler: _handler } = intradaySubscriptions.get(topic);
      unsubscribeStream(topic);
      intradaySubscriptions.delete(topic);
    }
  } else {
    // Unsubscribe tất cả
    intradaySubscriptions.forEach((value, key) => {
      unsubscribeStream(key);
    });
    intradaySubscriptions.clear();
  }
}

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
  initSocket,
  subscribeStream,
  unsubscribeStream,
  useStreamTopic,
  getStreamStatus,
  subscribeIntradayTopic,
  unsubscribeIntradayTopic,
};
