import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatVolume, formatValueBillion } from "../utils/format";
import IndexChart from "./IndexChart";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import { subscribeStream, unsubscribeStream } from "../services/socketStream";

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
    <div
      style={{
        background: "#262626",
        borderRadius: "0.5rem",
        padding: "0.7rem 0.5rem 0.5rem 0.5rem",
        flex: 1,
        minWidth: 0,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.45)",
        position: "relative",
        border: "1px solid #1a1a1a",
        height: "33%",
        boxSizing: "border-box",
        minHeight: 0,
      }}
    >
      <IndexChart
        lineData={line}
        volumeData={volume}
        reference={reference}
        symbolCode={symbolCode}
        onHoverData={handleHoverData}
      />

      {/* Hiển thị dữ liệu khi hover */}
      {hoveredData && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0, 0, 0, 0.8)",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            border: "1px solid #444",
            zIndex: 10,
          }}
        >
          <div style={{ color: "#aaa" }}>
            {hoveredData.time} : {hoveredData.value?.toFixed(2)}
          </div>
          <div style={{ color: "#4dd6ff", marginTop: 4 }}>
            KL: {hoveredData.volume}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "1.1rem",
          color: "#ff6a00",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          position: "relative",
        }}
        ref={dropdownRef}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
          }}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span>{displayTitle}</span>
          <CaretDownOutlined
            style={{
              fontSize: 14,
              transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </div>

        {/* Dropdown menu */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: "4px",
              marginTop: "4px",
              zIndex: 100,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.8)",
              overflow: "hidden",
            }}
          >
            {AVAILABLE_INDICES.map((index) => (
              <div
                key={index.code}
                onClick={() => handleSelectIndex(index.code, index.label)}
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #252525",
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                  backgroundColor:
                    symbolCode === index.code ? "#2E52B2" : "transparent",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (symbolCode !== index.code) {
                    e.target.style.backgroundColor = "#252525";
                  }
                }}
                onMouseLeave={(e) => {
                  if (symbolCode !== index.code) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                {index.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "1.5rem",
          fontWeight: 700,
          wordBreak: "break-all",
        }}
      >
        <span style={{ color: isPositive ? "#52c41a" : "#ff4d4f" }}>
          {displayPrice}
        </span>
        <span
          style={{
            fontSize: "0.85rem",
            marginLeft: "0.5rem",
            color: isPositive ? "#52c41a" : "#ff4d4f",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {isPositive ? (
            <ArrowUpOutlined style={{ marginRight: 4 }} />
          ) : (
            <ArrowDownOutlined style={{ marginRight: 4 }} />
          )}
          {displayChange} ({displayPercent}%)
        </span>
      </div>

      <div
        style={{
          marginTop: "0.7rem",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.9rem",
          color: "#bbb",
          gap: "1.5rem",
        }}
      >
        <div>
          <div style={{ color: "#999", marginBottom: "0.1rem" }}>KL</div>
          <div
            style={{ color: "#fff", fontWeight: 500, wordBreak: "break-all" }}
          >
            {displayVolumeText}
          </div>
        </div>

        <div>
          <div style={{ color: "#999", marginBottom: "0.1rem" }}>GT</div>
          <div
            style={{ color: "#fff", fontWeight: 500, wordBreak: "break-all" }}
          >
            {displayValueText}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "0.7rem",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.9rem",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div
          style={{ color: "#52c41a", display: "flex", alignItems: "center" }}
        >
          <ArrowUpOutlined style={{ marginRight: 4 }} />
          <span>{displayUp}</span>
        </div>
        <div style={{ color: "#faad14", minWidth: 0, wordBreak: "break-all" }}>
          {displayMid}
        </div>
        <div
          style={{ color: "#ff4d4f", display: "flex", alignItems: "center" }}
        >
          <ArrowDownOutlined style={{ marginRight: 4 }} />
          <span>{displayDown}</span>
        </div>
        <div style={{ color: "#1890ff", fontSize: "0.8rem" }}>
          Phiên liên tục
        </div>
      </div>
    </div>
  );
}
