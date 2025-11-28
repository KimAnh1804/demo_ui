import "./MainTable.scss";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { formatVolume, formatValueBillion } from "../../utils/format";
import { useState, useEffect, useCallback } from "react";
import { useStreamTopic } from "../../services/socketStream";

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
          // Tìm đúng chỉ số để cập nhật
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
    <div className="main-table-root">
      <table className="main-table-table">
        <thead>
          <tr className="main-table-header-row">
            <th className="main-table-header main-table-header-name">
              Chỉ số chính
            </th>
            <th className="main-table-header">+/-</th>
            <th className="main-table-header">KL (Tr)</th>
            <th className="main-table-header">GT (Tỷ)</th>
            <th className="main-table-header">CK Tăng/Giảm</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, i) => {
            const isPositive = row.change >= 0;
            return (
              <tr key={i} className="main-table-body-row">
                <td className="main-table-cell main-table-name-cell">
                  <span className="main-table-name">{row.name}</span>
                </td>
                <td
                  className={
                    "main-table-cell main-table-change-cell " +
                    (isPositive ? "main-table-up" : "main-table-down")
                  }
                >
                  <span className="main-table-change-content">
                    {isPositive ? (
                      <ArrowUpOutlined style={{ marginRight: 4 }} />
                    ) : (
                      <ArrowDownOutlined style={{ marginRight: 4 }} />
                    )}
                    {row.change} ({row.percent}%)
                  </span>
                </td>
                <td className="main-table-cell main-table-volume-cell">
                  {formatVolume(row.volume)}
                </td>
                <td className="main-table-cell main-table-value-cell">
                  {row.value !== undefined && row.value !== null
                    ? formatValueBillion(row.value)
                    : "0"}
                </td>
                <td className="main-table-cell main-table-upmid-cell">
                  <div className="main-table-upmid-content">
                    <span className="main-table-up">
                      <ArrowUpOutlined style={{ marginRight: 4 }} />
                      {row.up}
                    </span>
                    <span className="main-table-mid">{row.mid}</span>
                    <span className="main-table-down">
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
