import "./IndexChart.scss";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatVolume } from "../../utils/format";

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
  // Xác định mốc giờ hiện tại
  const now = new Date();
  const currentHour = now.getHours();
  let currentSlot = 0;
  if (currentHour >= 15) {
    currentSlot = 6;
  } else if (currentHour < 9) {
    currentSlot = 0;
  } else {
    for (let i = timeSlots.length - 1; i >= 0; i--) {
      const slotHour = Number(timeSlots[i].replace("h", ""));
      if (currentHour >= slotHour) {
        currentSlot = i;
        break;
      }
    }
  }

  const paddedLineData = [
    ...lineData,
    ...Array(7 - lineData.length).fill(null),
  ].slice(0, 7);
  const paddedVolumeData = [
    ...volumeData,
    ...Array(7 - volumeData.length).fill(0),
  ].slice(0, 7);

  // cấu hình Highcharts
  const options = {
    chart: {
      type: "line",
      height: 140,
      margin: [6, 6, 28, 24],
      backgroundColor: "#262626",
    },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      series: {
        marker: { enabled: false, radius: 8 },
        animation: false,
      },
      column: {
        animation: false,
        dataLabels: { style: { textShadow: false } },
        pointWidth: 1,
        maxPointWidth: 1,
        minPointWidth: 1,
        borderWidth: 0,
      },
      line: {
        lineWidth: 2,
        dataLabels: { style: { textShadow: false } },
      },
    },
    xAxis: {
      categories: timeSlots,
      labels: {
        enabled: true,
        style: { color: "#aaa", fontSize: 12 },
        y: 16,
      },
      tickLength: 0,
      lineWidth: 0,
      minorGridLineWidth: 0,
    },
    yAxis: [
      {
        visible: true,
        opposite: true,
        labels: { enabled: false },
        title: { text: null },
        plotLines: [
          {
            value: reference,
            zIndex: 10,
            width: 0,
            color: "#CE9B51",
            label: {
              text: reference != null ? reference.toFixed(2) : "", // Hiển thị giá tham chiếu
              align: "center",
              style: {
                color: "var(--TEXT__1)",
                fontSize: "0.65rem",
              },
            },
          },
        ],
      },
      {
        visible: true,
        labels: { enabled: false },
        title: { text: null },
      },
    ],
    tooltip: {
      shared: true,
      useHTML: true,
      padding: 8,
      backgroundColor: "var(PRIMARY__BG__COLOR)",
      formatter: function () {
        const indexValue = this.points?.[1]?.y ?? 0;
        const valueColor = this.points?.[1]?.color ?? "";
        const indexVolume = this.points?.[0]?.y ?? 0;
        const volumeColor = this.points?.[0]?.color ?? "";
        const time = this.points?.[1]?.x ?? "";
        return `
          <div class='flex flex-1 flex-direction-column fs-verySmall' style="background-color: var(--PRIMARY__BG__COLOR); color: var(--TEXT__1); padding: 8px;">
            <div class='flex-1'>${
              timeSlots[this.points?.[1]?.point?.index ?? 0] || ""
            }</div>
            <div class='flex-1'>
              ${
                symbolCode || ""
              }: <span style="color: ${valueColor}; font-weight: bold;">${
          indexValue?.toFixed ? indexValue.toFixed(2) : indexValue
        }</span>
            </div>
            <div class='flex-1'>
              Khối lượng: <span style="color: ${volumeColor}; font-weight: bold;">${formatVolume(
          indexVolume
        )}</span>
            </div>
          </div>
        `.replace(/<!-- -->/g, "");
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
