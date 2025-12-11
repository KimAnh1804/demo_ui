import React, { useState, useEffect, useCallback } from "react";
import {
  IndexCard,
  IndexChart,
  MainTable,
  StockTable,
  TopMenu,
} from "./components";
import { useAuth } from "./contexts/AuthContext";
import websocket, {
  subscribeStream,
  unsubscribeStream,
  subscribeIntradayTopic,
  unsubscribeIntradayTopic,
} from "./services/socketStream";
import { formatVolume, formatValueBillion } from "./utils/format";
import "./AppMain.scss";

// Danh sách các topic socket cho từng chỉ số
const TOPIC_CONFIGS = [
  {
    symbol: "VNI",
    topic: "KRXMDDS|IGI|STO|001",
    intraday: "INTRADAY_1m|STO|001",
  },
  {
    symbol: "VN30",
    topic: "KRXMDDS|IGI|STO|101",
    intraday: "INTRADAY_1m|STO|101",
  },
  {
    symbol: "HNX",
    topic: "KRXMDDS|IGI|STX|002",
    intraday: "INTRADAY_1m|STX|002",
  },
  {
    symbol: "UPCOM",
    topic: "KRXMDDS|IGI|UPX|301",
    intraday: "INTRADAY_1m|UPX|301",
  },
  {
    symbol: "HNX30",
    topic: "KRXMDDS|IGI|STX|100",
    intraday: "INTRADAY_1m|STX|100",
  },
];

const SESSION_MAP = {
  "00": "Chưa GD",
  "01": "Nạp lại Lệnh GT",
  10: "Phiên mở cửa",
  11: "Phiên mở cửa (mở rộng)",
  20: "Phiên định kỳ sau khi dừng thị trường",
  21: "Phiên định kỳ sau khi dừng thị trường (mở rộng)",
  30: "Phiên ATC",
  40: "Phiên liên tục",
  50: "Kiểm soát biến động giá",
  51: "Kiểm soát biến động giá (mở rộng)",
  60: "Thỏa Thuận - PLO",
  80: "Phiên khớp lệnh định kỳ nhiều lần",
  90: "Tạm ngừng giao dịch",
  91: "Nghỉ trưa",
  99: "Hết giờ GD",
};

export function MainApp() {
  const { user, logout } = useAuth();

  function getSessionText(t336) {
    if (!t336) return "";
    return SESSION_MAP[String(t336)] || "";
  }

  function handleIndexUpdate(data, indexName) {
    if (!data.data || data.data.t30217 === undefined) return;
    const price = data.data.t30217;
    const change = data.data.t40003;
    const reference = data.data.t40002;
    const percent = reference ? ((change / reference) * 100).toFixed(2) : 0;
    const volume = data.data.t387;
    const value = data.data.t381;
    const up = data.data.t30590;
    const mid = data.data.t30591;
    const down = data.data.t30592;
    const t30589 = data.data.t30589;
    const t30593 = data.data.t30593;
    const t336 = data.data.t336;
    const sessionText = getSessionText(t336);

    // Cập nhật cardConfigs cho card bên trái - UPDATE TẤT CẢ CARDS
    setCardConfigs((prev) =>
      prev.map((config) =>
        config.symbolCode === indexName
          ? {
              ...config,
              price: price.toLocaleString("vi-VN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              change: parseFloat(change),
              percent: parseFloat(percent),
              volumeText: formatVolume(volume),
              valueText: formatValueBillion(value),
              up: up !== undefined ? `${up}(${t30589})` : config.up,
              mid: mid !== undefined ? `${mid}` : config.mid,
              down: down !== undefined ? `${down}(${t30593})` : config.down,
              sessionText: sessionText || config.sessionText,
            }
          : config
      )
    );

    // Cập nhật indexList cho bảng bên phải
    setIndexList((prev) =>
      prev.map((item) =>
        item.name === indexName
          ? {
              ...item,
              price: price,
              change: parseFloat(change),
              percent: parseFloat(percent),
              volume:
                volume !== undefined
                  ? parseFloat((volume / 1000000).toFixed(2))
                  : item.volume,
              value: value !== undefined ? value : item.value,
              up: up !== undefined ? up : item.up,
              mid: mid !== undefined ? mid : item.mid,
              down: down !== undefined ? down : item.down,
            }
          : item
      )
    );
  }

  const [selectedSymbol, setSelectedSymbol] = useState("VNI");

  // State để lưu dữ liệu intraday chart theo symbol
  const [intradayData, setIntradayData] = useState({
    VNI: [],
    VN30: [],
    HNX: [],
    UPCOM: [],
    HNX30: [],
  });

  // Helper function để cập nhật chart từ dữ liệu intraday
  const updateChartFromIntraday = useCallback((dataArray, symbol) => {
    if (!dataArray || dataArray.length === 0) return;

    const lineData = dataArray.map((item) => item.data?.C || 0);
    const volumeData = dataArray.map((item) => item.data?.V || 0);
    const timeLabels = dataArray.map((item) => item.data?.T || ""); // Lấy timestamp T

    setCardConfigs((prev) => {
      const updated = prev.map((config) => {
        if (config.symbolCode === symbol) {
          return {
            ...config,
            line: lineData, // Hiển thị tất cả dữ liệu
            volume: volumeData, // Hiển thị tất cả dữ liệu
            reference: dataArray[0]?.data?.O || config.reference,
            timeLabels: timeLabels, // Hiển thị tất cả timestamps
          };
        }
        return config;
      });
      return updated;
    });
  }, []);

  // Đăng ký tất cả intraday topics khi mount để cập nhật realtime chart cho tất cả symbol
  useEffect(() => {
    const subscribeAllIntradayTopics = () => {
      TOPIC_CONFIGS.forEach(({ symbol, intraday }) => {
        subscribeIntradayTopic(intraday, {
          onHistRes: (data, receivedTopic) => {
            let responseData = data;
            let dataArray = [];

            // Nếu là array format ["HIST_RES", {...}]
            if (Array.isArray(data) && data[0] === "HIST_RES" && data[1]) {
              responseData = data[1];
            }

            // Extract symbol từ receivedTopic
            let targetSymbol = symbol;
            if (receivedTopic) {
              const config = TOPIC_CONFIGS.find(
                (c) => c.intraday === receivedTopic
              );
              if (config) {
                targetSymbol = config.symbol;
              }
            }

            // Kiểm tra xem dữ liệu có `Data` array hay không (HIST_RES lần đầu)
            if (
              responseData &&
              responseData.Data &&
              Array.isArray(responseData.Data) &&
              responseData.Data.length > 0
            ) {
              // Đây là HIST_RES lần đầu với toàn bộ dữ liệu lịch sử
              dataArray = responseData.Data;

              // Lưu trữ toàn bộ dữ liệu
              setIntradayData((prev) => {
                const updated = { ...prev, [targetSymbol]: dataArray };
                return updated;
              });

              // Cập nhật chart
              updateChartFromIntraday(dataArray, targetSymbol);
            } else if (
              responseData &&
              (!responseData.Data ||
                responseData.Data === "" ||
                responseData.Data.length === 0) &&
              responseData.Result === 0
            ) {
              // Dữ liệu rỗng - không làm gì, chờ realtime update
            } else if (
              responseData &&
              responseData.data &&
              typeof responseData.data === "object" &&
              !responseData.Data
            ) {
              // Đây là realtime update - chỉ có 1 item với structure {topic, seq, type, data: {...}}

              // Append vào dữ liệu existing
              setIntradayData((prev) => {
                const existing = prev[targetSymbol] || [];

                // Kiểm tra xem item này đã có chưa (dùng seq để check)
                const lastSeq =
                  existing.length > 0 ? existing[existing.length - 1].seq : -1;

                if (responseData.seq > lastSeq) {
                  // Append item mới
                  const updated = [...existing, responseData];

                  // Cập nhật chart với dữ liệu mới
                  updateChartFromIntraday(updated, targetSymbol);

                  return { ...prev, [targetSymbol]: updated };
                }
                return prev;
              });
            }
          },
        });
      });
    };

    subscribeAllIntradayTopics();

    return () => {
      // Cleanup: unsubscribe tất cả
      unsubscribeIntradayTopic();
    };
  }, []);

  // Khi chọn symbol khác, gửi lại HIST_REQ cho symbol đó
  useEffect(() => {
    const selectedConfig = TOPIC_CONFIGS.find(
      (c) => c.symbol === selectedSymbol
    );
    if (!selectedConfig) return;

    // Chỉ gửi HIST_REQ, không register handler mới (handler cũ từ mount sẽ xử lý)
    subscribeIntradayTopic(selectedConfig.intraday);
  }, [selectedSymbol]);

  // Chọn chỉ số topic mới trong dropdown card sẽ sub realtime cho card đó, đồng thời các card khác vẫn sub bình thường
  // update: 2/12
  useEffect(() => {
    const config = TOPIC_CONFIGS.find((c) => c.symbol === selectedSymbol);
    if (!config) return;
    const handler = (data) => handleIndexUpdate(data, selectedSymbol);
    subscribeStream(config.topic, handler);
    return () => {
      unsubscribeStream(config.topic);
    };
  }, [selectedSymbol]);

  // Đăng ký tất cả realtime topics khi mount để cập nhật price/volume/up/down/mid realtime cho tất cả card
  useEffect(() => {
    const subscribeAllRealtimeTopics = () => {
      TOPIC_CONFIGS.forEach(({ symbol, topic }) => {
        const handler = (data) => handleIndexUpdate(data, symbol);
        subscribeStream(topic, handler);
      });
    };

    subscribeAllRealtimeTopics();

    return () => {
      // Cleanup: unsubscribe tất cả
      TOPIC_CONFIGS.forEach(({ topic }) => {
        unsubscribeStream(topic);
      });
    };
  }, []);

  const connected = websocket.getStreamStatus();

  // mook data realtime cho bảng phía bên phải
  const [indexList, setIndexList] = useState([
    {
      name: "VNI",
      change: 7.24,
      percent: 0.44,
      volume: 211.13,
      value: 6492.41,
      up: 109,
      mid: 67,
      down: 163,
    },
    {
      name: "HNX",
      change: -0.67,
      percent: -0.25,
      volume: 20.3,
      value: 376.79,
      up: 39,
      mid: 65,
      down: 58,
    },
    {
      name: "UPCOM",
      change: 0.38,
      percent: 0.32,
      volume: 13.29,
      value: 225.2,
      up: 96,
      mid: 61,
      down: 60,
    },
    {
      name: "VN30",
      change: 10.55,
      percent: 0.56,
      volume: 92.92,
      value: 3996.42,
      up: 11,
      mid: 2,
      down: 17,
    },
    {
      name: "HNX30",
      change: 7.24,
      percent: 0.44,
      volume: 211.13,
      value: 6492.41,
      up: 109,
      mid: 67,
      down: 163,
    },
  ]);

  // mook data realtime cho 4 card biểu đồ phía bên trái
  const [cardConfigs, setCardConfigs] = useState([
    {
      title: "VNI",
      symbolCode: "VNI",
      line: [1652, 1660, 1666, 1661, 1657, 1664, 1662],
      volume: [120, 80, 95, 70, 50, 60, 55],
      reference: 1654.93,
      price: "1,662.17",
      change: 7.24,
      percent: 0.44,
      volumeText: formatVolume(211126288),
      valueText: formatValueBillion(6492410000),
      up: "109(5)",
      mid: "67",
      down: "163(1)",
    },
    {
      title: "VN30",
      symbolCode: "VN30",
      line: [1899, 1910, 1912, 1905, 1898, 1905, 1910],
      volume: [90, 75, 80, 65, 55, 60, 58],
      reference: 1899.89,
      price: "1,910.44",
      change: 10.55,
      percent: 0.56,
      volumeText: formatVolume(87828623),
      valueText: formatValueBillion(3751540000),
      up: "11",
      mid: "2",
      down: "17",
    },
    {
      title: "HNX",
      symbolCode: "HNX",
      line: [263.5, 263.3, 263.0, 262.8, 262.4, 262.6, 262.9],
      volume: [30, 22, 28, 18, 14, 16, 20],
      reference: 263.13,
      price: "262.46",
      change: -0.67,
      percent: -0.25,
      volumeText: formatVolume(19417531),
      valueText: formatValueBillion(361800000),
      up: "39(2)",
      mid: "65",
      down: "58(3)",
    },
    {
      title: "UPCOM",
      symbolCode: "UPCOM",
      line: [118.8, 119.0, 119.1, 119.2, 118.9, 119.0, 119.07],
      volume: [22, 18, 20, 17, 13, 16, 20],
      reference: 118.69,
      price: "119.07",
      change: 0.38,
      percent: 0.32,
      volumeText: formatVolume(12900778),
      valueText: formatValueBillion(220390000),
      up: "96(6)",
      mid: "61",
      down: "60(1)",
    },
  ]);

  return (
    <div className="app-root">
      {/* Header with User Info and Logout */}
      <div className="app-header">
        <div className="header-content">
          <h1>Bảng Giá Chứng Khoán Realtime</h1>
          <div className="user-info">
            {/* <span className="user-name">👤 {user?.username}</span> */}
            <button className="btn-logout" onClick={logout} title="Đăng xuất">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="app-layout">
        <div className="app-cards">
          {cardConfigs.map((config, idx) => {
            // Nếu card được chọn, lấy dữ liệu realtime từ intradayData
            const isSelected = selectedSymbol === config.symbolCode;
            const displayData =
              isSelected && intradayData[selectedSymbol]?.length > 0
                ? intradayData[selectedSymbol]
                : null;

            // Nếu có dữ liệu realtime, extract lineData, volumeData, timeLabels
            let displayLine = config.line;
            let displayVolume = config.volume;
            let displayTimeLabels = config.timeLabels;

            if (displayData) {
              displayLine = displayData.map((item) => item.data?.C || 0);
              displayVolume = displayData.map((item) => item.data?.V || 0);
              displayTimeLabels = displayData.map((item) => item.data?.T || "");
            }

            return (
              <IndexCard
                key={config.symbolCode}
                title={config.title}
                symbolCode={config.symbolCode}
                line={displayLine}
                volume={displayVolume}
                reference={config.reference}
                price={config.price}
                change={config.change}
                percent={config.percent}
                volumeText={config.volumeText}
                valueText={config.valueText}
                up={config.up}
                mid={config.mid}
                down={config.down}
                sessionText={config.sessionText}
                timeLabels={displayTimeLabels}
                onSymbolChange={(newSymbolCode) => {
                  setSelectedSymbol(newSymbolCode);
                }}
                isSelected={isSelected}
              />
            );
          })}
        </div>
        <div className="app-table">
          <MainTable data={indexList} />
        </div>
      </div>

      <TopMenu user={user} onLogout={logout} />

      <div className="app-stock-table-section">
        <StockTable />
      </div>
    </div>
  );
}

export default MainApp;
