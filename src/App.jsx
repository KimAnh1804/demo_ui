import React, { useState, useEffect } from "react";
import IndexCard from "./components/IndexCard";
import MainTable from "./components/MainTable";
import IndexChart from "./components/IndexChart";
import websocket, {
  subscribeStream,
  unsubscribeStream,
} from "./services/socketStream";
import { formatVolume, formatValueBillion } from "./utils/format";
import "./App.scss";

export default function App() {
  // Danh sách các topic socket cho từng chỉ số
  const TOPIC_CONFIGS = [
    { symbol: "VNI", topic: "KRXMDDS|IGI|STO|001" },
    { symbol: "VN30", topic: "KRXMDDS|IGI|STO|101" },
    { symbol: "HNX", topic: "KRXMDDS|IGI|STX|002" },
    { symbol: "UPCOM", topic: "KRXMDDS|IGI|UPX|301" },
    { symbol: "HNX30", topic: "KRXMDDS|IGI|STX|100" },
  ];

  // Hàm nhận data realtime từ socket, cập nhật lại state cardConfigs và indexList
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

    // Cập nhật cardConfigs cho card bên trái
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

  useEffect(() => {
    const unsubscribers = TOPIC_CONFIGS.map(({ symbol, topic }) => {
      const handler = (data) => handleIndexUpdate(data, symbol);
      subscribeStream(topic, handler);
      return () => unsubscribeStream(topic);
    });
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);
  const connected = websocket.getStreamStatus();
  const [selectedSymbol, setSelectedSymbol] = useState("VNI");

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
      line: [1652, 1660, 1666, 1661, 1657],
      volume: [120, 80, 95, 70, 50],
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
      line: [1899, 1910, 1912, 1905, 1898],
      volume: [90, 75, 80, 65, 55],
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
      line: [263.5, 263.3, 263.0, 262.8, 262.4],
      volume: [30, 22, 28, 18, 14],
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
      line: [118.8, 119.0, 119.1, 119.2, 118.9],
      volume: [22, 18, 20, 17, 13],
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
      <div className="app-layout">
        <div className="app-cards">
          {cardConfigs.map((config, idx) => (
            <IndexCard
              key={config.symbolCode + "-" + idx}
              title={config.title}
              symbolCode={config.symbolCode}
              line={config.line}
              volume={config.volume}
              reference={config.reference}
              price={config.price}
              change={config.change}
              percent={config.percent}
              volumeText={config.volumeText}
              valueText={config.valueText}
              up={config.up}
              mid={config.mid}
              down={config.down}
              onSymbolChange={(newSymbolCode) => {
                // Khi chọn symbol mới, cập nhật lại cardConfigs cho card này
                setCardConfigs((prev) => {
                  // Tìm dữ liệu mới tương ứng symbol mới
                  const found = prev.find(
                    (c) => c.symbolCode === newSymbolCode
                  );
                  if (!found) return prev;
                  // Cập nhật card tại idx bằng dữ liệu mới
                  return prev.map((c, i) => (i === idx ? { ...found } : c));
                });
              }}
              isSelected={selectedSymbol === config.symbolCode}
            />
          ))}
        </div>
        <div className="app-table">
          <MainTable data={indexList} />
        </div>
      </div>
    </div>
  );
}
