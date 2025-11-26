import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { formatVolume, formatValueBillion } from "../utils/format";
import { useState, useEffect, useCallback } from "react";
import { useStreamTopic } from "../services/socketStream";

export default function MainTable({ data: initialData }) {
  // State lưu dữ liệu bảng, luôn đồng bộ với props và realtime socket
  const [tableData, setTableData] = useState(initialData || []);

  // Hàm nhận dữ liệu realtime từ socket, cập nhật lại bảng
  const handleTableUpdate = useCallback((message) => {
    if (!message || typeof message !== "object") return;
    if (message.type === "SUB_RES" || message.Result !== undefined) return;
    setTableData((prevData) => {
      let updated = false;

      // Nếu message.data là mảng: map từng chỉ số
      if (Array.isArray(message.data)) {
        const newData = prevData.map((row) => {
          const updates = message.data.find(
            (item) => item.name === row.name || item.code === row.name
          );
          if (updates) {
            updated = true;
            // Nếu có t381 thì map sang value (GT)
            const mapped = { ...row, ...updates };
            if (updates.t381 !== undefined) {
              mapped.value = updates.t381;
            }
            return mapped;
          }
          return row;
        });
        return updated ? newData : prevData;
      }
      // Nếu message là 1 chỉ số đơn lẻ
      if (message.symbol || message.code || message.name) {
        const indexName = message.symbol || message.code || message.name;
        return prevData.map((row) => {
          if (row.name === indexName || row.code === indexName) {
            const mapped = {
              ...row,
              change:
                message.change !== undefined ? message.change : row.change,
              percent:
                message.percent !== undefined ? message.percent : row.percent,
              price: message.price !== undefined ? message.price : row.price,
              volume:
                message.volume !== undefined ? message.volume : row.volume,
              value: message.value !== undefined ? message.value : row.value,
              up: message.up !== undefined ? message.up : row.up,
              mid: message.mid !== undefined ? message.mid : row.mid,
              down: message.down !== undefined ? message.down : row.down,
            };
            if (message.t381 !== undefined) {
              mapped.value = message.t381;
            }
            return mapped;
          }
          return row;
        });
      }
      return prevData;
    });
  }, []);

  useStreamTopic("KRXMDDS|IGI|STO|101", handleTableUpdate);
  useStreamTopic("KRXMDDS|IGI|UPX|301", handleTableUpdate);
  useStreamTopic("KRXMDDS|IGI|STX|002", handleTableUpdate);
  useStreamTopic("KRXMDDS|IGI|STO|001", handleTableUpdate);
  useStreamTopic("KRXMDDS|IGI|STX|100", handleTableUpdate);

  // Update khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      setTableData(initialData);
    }
  }, [initialData]);

  return (
    <div
      style={{
        background: "#262626",
        borderRadius: "10px",
        padding: "0",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
        border: "1px solid #1a1a1a",
        height: "33%",
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        alignSelf: "stretch",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "15px",
          flex: 1,
          overflow: "auto",
        }}
      >
        <thead>
          <tr
            style={{ borderBottom: "1px solid #262626", background: "#262626" }}
          >
            <th
              style={{
                textAlign: "left",
                padding: "8px 10px",
                fontWeight: 300,
              }}
            >
              Chỉ số chính
            </th>
            <th style={{ padding: "8px 10px", fontWeight: 600 }}>+/-</th>
            <th style={{ padding: "8px 10px", fontWeight: 600 }}>KL (Tr)</th>
            <th style={{ padding: "8px 10px", fontWeight: 600 }}>GT (Tỷ)</th>
            <th style={{ padding: "8px 10px", fontWeight: 600 }}>
              CK Tăng/Giảm
            </th>
          </tr>
        </thead>

        <tbody>
          {tableData.map((row, i) => {
            const isPositive = row.change >= 0;
            return (
              <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "8px 10px", textAlign: "left" }}>
                  <span style={{ color: "#ff6a00", fontWeight: 600 }}>
                    {row.name}
                  </span>
                </td>

                <td
                  style={{
                    padding: "8px 10px",
                    color: isPositive ? "#52c41a" : "#ff4d4f",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isPositive ? (
                      <ArrowUpOutlined style={{ marginRight: 4 }} />
                    ) : (
                      <ArrowDownOutlined style={{ marginRight: 4 }} />
                    )}
                    {row.change} ({row.percent}%)
                  </span>
                </td>

                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  {formatVolume(row.volume)}
                </td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  {row.value !== undefined && row.value !== null
                    ? formatValueBillion(row.value)
                    : "0"}
                </td>

                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: "#52c41a",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ArrowUpOutlined style={{ marginRight: 4 }} />
                      {row.up}
                    </span>
                    <span style={{ color: "#faad14" }}>{row.mid}</span>
                    <span
                      style={{
                        color: "#ff4d4f",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ArrowDownOutlined style={{ marginRight: 4 }} />
                      {row.down}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
