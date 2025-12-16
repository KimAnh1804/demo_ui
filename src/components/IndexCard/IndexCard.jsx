import "./IndexCard.scss";
import React, {useState, useEffect, useRef, useCallback, useMemo} from "react";
import {formatVolume, formatValueBillion} from "../../utils/format";
import IndexChart from "../IndexChart";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import {
  subscribeStream,
  unsubscribeStream,
} from "../../services/socketStream";
import {TOPIC_CONFIGS} from "../../configs/marketConfig";

const AVAILABLE_INDICES = [
  {code: "VNI", label: "VNI"},
  {code: "VN30", label: "VN30"},
  {code: "HNX", label: "HNX"},
  {code: "UPCOM", label: "UPCOM"},
  {code: "HNX30", label: "HNX30"},
];

const SYMBOL_TO_TOPIC = TOPIC_CONFIGS.reduce((acc, config) => {
  acc[config.symbol] = config.topic;
  return acc;
}, {});

export default function IndexCard({
  title,
  symbolCode,
  line,
  volume,
  reference,
  price,
  change,
  percent,
  volumeText,
  valueText,
  up,
  mid,
  down,
  sessionText,
  timeLabels,
  onSymbolChange,
  isSelected,
}) {
  const [currentSymbol, setCurrentSymbol] = useState(symbolCode);
  const topicRef = useRef(SYMBOL_TO_TOPIC[symbolCode]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredData, setHoveredData] = useState(null);
  const dropdownRef = useRef(null);

  const [displayData, setDisplayData] = useState({
    title,
    price,
    change,
    percent,
    volumeText,
    valueText,
    up,
    mid,
    down,
  });

  const socketHandler = useCallback(
    (data) => {
      if (data?.data) {
        const d = data.data;
        const updates = {};

        if (d.t30217 !== undefined) {
          updates.price = d.t30217;
          updates.change = d.t40003;
          const reference = d.t40002;
          updates.percent = reference
            ? (((d.t40003 || 0) / reference) * 100).toFixed(2)
            : null;

          const vol = d.t387 || d.t40004 || 0;
          const val = d.t381 || d.t40006 || 0;
          updates.volumeText = formatVolume(vol);
          updates.valueText = formatValueBillion(val);
        }

        if (d.t30590 !== undefined) {
          updates.up =
            d.t30589 !== undefined
              ? `${d.t30590}(${d.t30589})`
              : `${d.t30590}`;
        }
        if (d.t30591 !== undefined) {
          updates.mid = `${d.t30591}`;
        }
        if (d.t30592 !== undefined) {
          updates.down =
            d.t30593 !== undefined
              ? `${d.t30592}(${d.t30593})`
              : `${d.t30592}`;
        }

        if (Object.keys(updates).length > 0) {
          setDisplayData((prev) => ({...prev, ...updates}));
        }
      }
    },
    []
  );

  useEffect(() => {
    const topic = SYMBOL_TO_TOPIC[currentSymbol];
    if (!topic) return;
    subscribeStream(topic, socketHandler);
    topicRef.current = topic;
    return () => {
      unsubscribeStream(topic);
    };
  }, [currentSymbol, socketHandler]);

  useEffect(() => {
    setDisplayData({
      title,
      price,
      change,
      percent,
      volumeText,
      valueText,
      up,
      mid,
      down,
    });
  }, [price, change, percent, volumeText, valueText, title, up, mid, down]);

  const handleSelectIndex = (newSymbolCode, newTitle) => {
    setCurrentSymbol(newSymbolCode);
    setDisplayData((prev) => ({...prev, title: newTitle}));
    setShowDropdown(false);
    if (onSymbolChange) {
      onSymbolChange(newSymbolCode);
    }
  };

  const handleHoverData = useCallback((hoverInfo) => {
    setHoveredData(hoverInfo);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isPositive = displayData.change >= 0;

  return (
    <div className="index-card-root">
      <IndexChart
        lineData={line}
        volumeData={volume}
        reference={reference}
        symbolCode={currentSymbol}
        timeLabels={timeLabels}
        onHoverData={handleHoverData}
        isSelected={isSelected}
      />

      {hoveredData && (
        <div className="index-card-hover-info">
          <div className="index-card-hover-time">
            {hoveredData.time} : {hoveredData.value?.toFixed(2)}
          </div>
          <div className="index-card-hover-volume">
            KL: {hoveredData.volume}
          </div>
        </div>
      )}

      <div className="index-card-title-row" ref={dropdownRef}>
        <div
          className="index-card-title-select"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span>{displayData.title}</span>
          <CaretDownOutlined className={showDropdown ? "dropdown-open" : ""} />
        </div>
        {showDropdown && (
          <div className="index-card-dropdown">
            {AVAILABLE_INDICES.map((index) => (
              <div
                key={index.code}
                className={
                  "index-card-dropdown-item" +
                  (symbolCode === index.code ? " selected" : "")
                }
                onClick={() => handleSelectIndex(index.code, index.label)}
                onMouseEnter={(e) => {
                  if (symbolCode !== index.code)
                    e.target.classList.add("hover");
                }}
                onMouseLeave={(e) => {
                  if (symbolCode !== index.code)
                    e.target.classList.remove("hover");
                }}
              >
                {index.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="index-card-price-row">
        <span className={isPositive ? "price-up" : "price-down"}>
          {displayData.price}
        </span>
        <span
          className={
            "index-card-change " + (isPositive ? "price-up" : "price-down")
          }
        >
          {isPositive ? (
            <ArrowUpOutlined style={{marginRight: 4}} />
          ) : (
            <ArrowDownOutlined style={{marginRight: 4}} />
          )}
          {displayData.change} ({displayData.percent}%)
        </span>
      </div>

      <div className="index-card-volume-value-row">
        <div>
          <div className="index-card-label">KL</div>
          <div className="index-card-value">{displayData.volumeText}</div>
        </div>
        <div>
          <div className="index-card-label">GT</div>
          <div className="index-card-value">{displayData.valueText}</div>
        </div>
      </div>

      <div className="index-card-up-mid-down-row">
        <div className="index-card-up">
          <ArrowUpOutlined style={{marginRight: 4}} />
          <span>{displayData.up}</span>
        </div>
        <div className="index-card-mid">{displayData.mid}</div>
        <div className="index-card-down">
          <ArrowDownOutlined style={{marginRight: 4}} />
          <span>{displayData.down}</span>
        </div>
        <div className="index-card-session">{sessionText || ""}</div>
      </div>
    </div>
  );
}
