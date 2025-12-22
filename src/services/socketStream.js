import { useEffect } from "react";
import { io } from "socket.io-client";
import { TOPIC_CONFIGS } from "../configs/marketConfig";

const SOCKET_CONFIG = {
  url: "https://ysflex.yuanta.com.vn",
  path: "/market",
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
};

let socket = null;
let isReady = false;
let listenersSetup = false;

const topicHandlers = new Map();
const subscribedTopics = new Set();
const intradaySubscriptions = new Map();
const INTRADAY_TOPICS = TOPIC_CONFIGS.map((c) => c.intraday);

let histSeq = 1;

const initSocket = () => {
  if (socket) {
    if (!socket.connected && !socket.connecting) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_CONFIG.url, {
    path: SOCKET_CONFIG.path,
    transports: SOCKET_CONFIG.transports,
    reconnection: SOCKET_CONFIG.reconnection,
    reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
    reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
    reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
    timeout: SOCKET_CONFIG.timeout,
  });

  socket.on("connect", () => {
    isReady = true;
    
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

  if (!listenersSetup) {
    setupStreamListeners();
    listenersSetup = true;
  }

  return socket;
};



let clientSeq = 1;

const generateTransId = () => {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `0000290095|02|01|${dateStr}|${random}|${randomStr}`;
};

export const emitSUB = (symbols, board = 'G1') => {
  const s = initSocket();
  
  // Chuẩn hóa symbols thành array
  const symbolArray = Array.isArray(symbols) ? symbols : [symbols];

  const payload = {
    ClientSeq: clientSeq++,
    TransId: generateTransId(),
    topic: [
      `KRXMDDS|ST|${board}`,  // Stock Trading
      `KRXMDDS|SI|${board}`,  // Stock Info
      `KRXMDDS|MT|${board}`,  // Market Trading
      `KRXMDDS|TP|${board}`,  // Trading Price
      `KRXMDDS|MD|${board}`,  // Market Data
    ],
    value: symbolArray,
  };
  
  console.log("[emitSUB]", payload.topic);
  s.emit("SUB_REQ", payload);
};

export const emitUNSUB = (symbols, board = 'G1') => {
  const s = initSocket();
  
  const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
  
  const payload = {
    topic: [
      `KRXMDDS|ST|${board}`,
      `KRXMDDS|SI|${board}`,
      `KRXMDDS|MT|${board}`,
      `KRXMDDS|TP|${board}`,
      `KRXMDDS|MD|${board}`,
    ],
    value: symbolArray,
  };
  
  console.log("[emitUNSUB]", payload.topic);
  s.emit("UNSUB_REQ", payload);
};

const emitHISTREQ = (topicFull, clientSeq, transId) => {
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
};

const extractTopicFromData = (data) => {
  if (data.topic) return data.topic;

  if (
    Array.isArray(data) &&
    data[0] === "HIST_RES" &&
    data[1]?.Data?.[0]?.topic
  ) {
    return data[1].Data[0].topic;
  }

  if (data.Data?.[0]?.topic) {
    return data.Data[0].topic;
  }

  return null;
};

const routeDataToHandlers = (data) => {
  if (!data || typeof data !== "object") return;

  const topic = extractTopicFromData(data);
  if (!topic || !topicHandlers.has(topic)) return;

  const handlers = topicHandlers.get(topic);
  handlers.forEach((handler) => {
    try {
      handler(data);
    } catch (err) {
      console.error(`Error handling topic ${topic}:`, err);
    }
  });
};

const setupStreamListeners = () => {
  const s = initSocket();

  s.on("onFOSStream", routeDataToHandlers);
  s.on("HIST_RES", routeDataToHandlers);
  s.on("SUB_RES", () => {});
  s.on("UNSUB_RES", () => {});
};

export const subscribeStream = (topic, handler) => {
  const s = initSocket();

  if (!topicHandlers.has(topic)) {
    topicHandlers.set(topic, []);
  }
  topicHandlers.get(topic).push(handler);
  subscribedTopics.add(topic);
  
};

export const unsubscribeStream = (topic, handler = null) => {
  if (handler) {
    // Xóa handler cụ thể
    const handlers = topicHandlers.get(topic);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
  
      if (handlers.length === 0) {
        topicHandlers.delete(topic);
        subscribedTopics.delete(topic);
      }
    }
  } else {
    // Xóa tất cả handlers cho topic này
    topicHandlers.delete(topic);
    subscribedTopics.delete(topic);
  }
  

};

export const subscribeIntradayTopic = (topic, { onHistRes } = {}) => {
  if (!INTRADAY_TOPICS.includes(topic)) {
    console.warn("Invalid topic:", topic);
    return;
  }

  emitHISTREQ(topic);

  if (!onHistRes) return;

  const histHandler = (data) => {
    if (onHistRes) {
      onHistRes(data, topic);
    }
  };

  if (!intradaySubscriptions.has(topic)) {
    intradaySubscriptions.set(topic, { handler: histHandler });
    subscribeStream(topic, histHandler);
  } else {
    const existing = intradaySubscriptions.get(topic);
    const oldHandler = existing.handler;

    if (topicHandlers.has(topic)) {
      const handlers = topicHandlers.get(topic);
      const idx = handlers.indexOf(oldHandler);
      if (idx !== -1) {
        handlers.splice(idx, 1);
      }
    }

    intradaySubscriptions.set(topic, { handler: histHandler });
    subscribeStream(topic, histHandler);
  }
};

export const unsubscribeIntradayTopic = (topic = null) => {
  if (topic) {
    if (intradaySubscriptions.has(topic)) {
      unsubscribeStream(topic);
      intradaySubscriptions.delete(topic);
    }
  } else {
    intradaySubscriptions.forEach((value, key) => {
      unsubscribeStream(key);
    });
    intradaySubscriptions.clear();
  }
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
  initSocket,
  subscribeStream,
  unsubscribeStream,
  useStreamTopic,
  getStreamStatus,
  subscribeIntradayTopic,
  unsubscribeIntradayTopic,
};
