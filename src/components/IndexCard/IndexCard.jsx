import "./IndexCard.scss";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatVolume, formatValueBillion } from "../../utils/format";
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

const AVAILABLE_INDICES = [
  { code: "VNI", label: "VNI" },
  { code: "VN30", label: "VN30" },
  { code: "HNX", label: "HNX" },
  { code: "UPCOM", label: "UPCOM" },
  { code: "HNX30", label: "HNX30" },
];

// Card hiển thị thông tin realtime của từng chỉ số
// Khi đổi chỉ số sẽ unsub topic cũ và sub topic mới, cập nhật dữ liệu realtime
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
  onSymbolChange,
}) {
  // Map mã chỉ số sang topic socket tương ứng
  const symbolToTopic = {
    VNI: "KRXMDDS|IGI|STO|001",
    VN30: "KRXMDDS|IGI|STO|101",
    HNX: "KRXMDDS|IGI|STX|002",
    UPCOM: "KRXMDDS|IGI|UPX|301",
    HNX30: "KRXMDDS|IGI|STX|100",
  };
  const [currentSymbol, setCurrentSymbol] = useState(symbolCode);
  const topicRef = useRef(symbolToTopic[symbolCode]);

  // Handler cập nhật dữ liệu realtime cho card
  const [displayUp, setDisplayUp] = useState(up);
  const [displayMid, setDisplayMid] = useState(mid);
  const [displayDown, setDisplayDown] = useState(down);

  // Handler nhận data realtime từ socket, cập nhật các state hiển thị
  const socketHandler = useCallback(
    (data) => {
      if (data && data.data) {
        if (data.data.t30217 !== undefined) {
          setDisplayPrice(data.data.t30217);
          setDisplayChange(data.data.t40003);
          const reference = data.data.t40002;
          setDisplayPercent(
            reference
              ? (((data.data.t40003 || 0) / reference) * 100).toFixed(2)
              : null
          );
          // KL: lấy từ t387, GT: lấy từ t381
          const vol = data.data.t387 || data.data.t40004 || 0;
          const val = data.data.t381 || data.data.t40006 || 0;
          setDisplayVolumeText(formatVolume(vol));
          setDisplayValueText(formatValueBillion(val));

          setDisplayUp(
            data.data.t30590 !== undefined
              ? data.data.t30589 !== undefined
                ? `${data.data.t30590}(${data.data.t30589})`
                : `${data.data.t30590}`
              : up
          );
          setDisplayMid(
            data.data.t30591 !== undefined ? `${data.data.t30591}` : mid
          );
          setDisplayDown(
            data.data.t30592 !== undefined
              ? data.data.t30593 !== undefined
                ? `${data.data.t30592}(${data.data.t30593})`
                : `${data.data.t30592}`
              : down
          );
        }
      }
    },
    [up, mid, down]
  );

  // Khi currentSymbol đổi sẽ tự động unsub topic cũ và sub topic mới
  useEffect(() => {
    const topic = symbolToTopic[currentSymbol];
    if (!topic) return;
    subscribeStream(topic, socketHandler);
    topicRef.current = topic;
    return () => {
      unsubscribeStream(topic);
    };
  }, [currentSymbol]);

  const [hoveredData, setHoveredData] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(price);
  const [displayChange, setDisplayChange] = useState(change);
  const [displayPercent, setDisplayPercent] = useState(percent);
  const [displayVolumeText, setDisplayVolumeText] = useState(volumeText);
  const [displayValueText, setDisplayValueText] = useState(valueText);
  const [showDropdown, setShowDropdown] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(title);
  const dropdownRef = useRef(null);
  const previousSymbolRef = useRef(symbolCode);

  // Luôn đồng bộ state hiển thị với props từ App (khi có realtime update)
  useEffect(() => {
    setDisplayPrice(price);
    setDisplayChange(change);
    setDisplayPercent(percent);
    setDisplayVolumeText(volumeText);
    setDisplayValueText(valueText);
    setDisplayTitle(title);
    setDisplayUp(up);
    setDisplayMid(mid);
    setDisplayDown(down);
  }, [price, change, percent, volumeText, valueText, title, up, mid, down]);

  // Xử lý khi chọn chỉ số từ dropdown
  // Khi chọn chỉ số mới từ dropdown sẽ đổi currentSymbol
  const handleSelectIndex = (newSymbolCode, newTitle) => {
    setCurrentSymbol(newSymbolCode);
    setDisplayTitle(newTitle);
    setShowDropdown(false);
    if (onSymbolChange) onSymbolChange(newSymbolCode);
  };

  // Xử lý hover data từ chart
  const handleHoverData = useCallback((hoverInfo) => {
    setHoveredData(hoverInfo);
  }, []);

  // Đóng dropdown khi click bên ngoài
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

  const isPositive = displayChange >= 0;

  return (
    <div className="index-card-root">
      <IndexChart
        lineData={line}
        volumeData={volume}
        reference={reference}
        symbolCode={symbolCode}
        onHoverData={handleHoverData}
      />

      {/* Hiển thị dữ liệu khi hover */}
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
          <span>{displayTitle}</span>
          <CaretDownOutlined className={showDropdown ? "dropdown-open" : ""} />
        </div>
        {/* Dropdown menu */}
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
          {displayPrice}
        </span>
        <span
          className={
            "index-card-change " + (isPositive ? "price-up" : "price-down")
          }
        >
          {isPositive ? (
            <ArrowUpOutlined style={{ marginRight: 4 }} />
          ) : (
            <ArrowDownOutlined style={{ marginRight: 4 }} />
          )}
          {displayChange} ({displayPercent}%)
        </span>
      </div>

      <div className="index-card-volume-value-row">
        <div>
          <div className="index-card-label">KL</div>
          <div className="index-card-value">{displayVolumeText}</div>
        </div>
        <div>
          <div className="index-card-label">GT</div>
          <div className="index-card-value">{displayValueText}</div>
        </div>
      </div>

      <div className="index-card-up-mid-down-row">
        <div className="index-card-up">
          <ArrowUpOutlined style={{ marginRight: 4 }} />
          <span>{displayUp}</span>
        </div>
        <div className="index-card-mid">{displayMid}</div>
        <div className="index-card-down">
          <ArrowDownOutlined style={{ marginRight: 4 }} />
          <span>{displayDown}</span>
        </div>
        <div className="index-card-session">Phiên liên tục</div>
      </div>
    </div>
  );
}
