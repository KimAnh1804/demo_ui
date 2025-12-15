import "./MainTable.scss";
import {ArrowUpOutlined, ArrowDownOutlined} from "@ant-design/icons";
import {formatVolume, formatValueBillion} from "../../utils/format";

export default function MainTable({data}) {
  if (!data) return null;

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
          {data.map((row, i) => {
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
                      <ArrowUpOutlined style={{marginRight: 4}} />
                    ) : (
                      <ArrowDownOutlined style={{marginRight: 4}} />
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
                      <ArrowUpOutlined style={{marginRight: 4}} />
                      {row.up}
                    </span>
                    <span className="main-table-mid">{row.mid}</span>
                    <span className="main-table-down">
                      <ArrowDownOutlined style={{marginRight: 4}} />
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

