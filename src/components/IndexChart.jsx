import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatVolume } from "../utils/format";

// lineData: mảng giá từng mốc thời gian
// volumeData: mảng khối lượng từng mốc thời gian
// reference: giá tham chiếu để vẽ đường tham chiếu
// symbolCode: mã chỉ số (VNI, VN30...)
// onHoverData: callback khi hover lên chart trả về thông tin tại điểm đó
export default function IndexChart({
  lineData = [],
  volumeData = [],
  reference,
  symbolCode,
  onHoverData,
}) {
  //  hiển thị 7 mốc thời gian
  const timeSlots = ["09h", "10h", "11h", "12h", "13h", "14h", "15h"];

  const paddedLineData = Array.from({ length: 7 }, (_, i) =>
    lineData[i] !== undefined ? lineData[i] : null
  );
  const paddedVolumeData = Array.from({ length: 7 }, (_, i) =>
    volumeData[i] !== undefined ? volumeData[i] : 0
  );

  const options = {
    chart: {
      backgroundColor: "#262626",
      height: 140,
      margin: [6, 6, 28, 24],

      // Khi hover chuột lên chart sẽ trả về thông tin giá/khối lượng tại điểm đó
      events: {
        mousemove(event) {
          const point = this.series[1].searchPoint(event, true);
          if (point) {
            const hoverInfo = {
              index: point.index,
              value: point.y,
              volume: this.series[0].data[point.index]?.y || 0,
              time: this.xAxis[0].categories?.[point.index] || "",
            };
            if (onHoverData) onHoverData(hoverInfo);
          }
        },
        mouseleave() {
          if (onHoverData) onHoverData(null);
        },
      },
    },
    title: { text: "" },
    credits: { enabled: false },
    legend: { enabled: false },

    xAxis: {
      categories: timeSlots,
      labels: {
        enabled: true,
        style: { color: "#aaa", fontSize: 12 },
        y: 16,
      },
      tickLength: 0,
    },

    yAxis: [
      { title: { text: "" }, gridLineWidth: 0 },
      { title: { text: "" }, opposite: true, gridLineWidth: 0 },
    ],

    tooltip: {
      shared: true,
      backgroundColor: "#1a1a1a",
      borderColor: "#2a2a2a",
      style: { color: "#fff" },
      formatter() {
        let result = `<b>${symbolCode || ""}</b><br>`;
        this.points.forEach((point) => {
          if (point.series.type === "line" && point.series.index === 1) {
            result += `<span style=\"color:#00ff66\">${point.y.toFixed(
              2
            )}</span><br>`;
          } else if (point.series.type === "column") {
            result += `<span style=\"color:#4dd6ff\">KL: ${formatVolume(
              point.y
            )}</span><br>`;
          }
        });
        return result;
      },
    },

    series: [
      {
        type: "column",
        data: paddedVolumeData,
        color: "#4dd6ff",
        yAxis: 1,
      },
      {
        type: "line",
        data: paddedLineData,
        color: "#00ff66",
        lineWidth: 2,
        marker: { enabled: false },
      },
      {
        type: "line",
        data: new Array(7).fill(reference),
        color: "#ffb600",
        dashStyle: "Dash",
        lineWidth: 2,
        marker: { enabled: false },
        enableMouseTracking: false,
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
