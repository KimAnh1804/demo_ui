import "./IndexChart.scss";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatVolume } from "../../utils/format";
import { useRef, useMemo, useEffect } from "react";

const CHART_CONFIG = {
  height: 140,
  margin: [6, 6, 28, 24],
  backgroundColor: "#262626",
};

const DEFAULT_TIME_SLOTS = ["09h", "10h", "11h", "12h", "13h", "14h", "15h"];

export default function IndexChart({
  lineData = [],
  volumeData = [],
  reference,
  symbolCode,
  timeLabels = [],
  onHoverData,
  isSelected = false,
}) {
  // Sử dụng timeLabels nếu có, nếu không dùng timeSlots fallback
  const timeSlots = useMemo(
    () =>
      (timeLabels && timeLabels.length > 0
        ? timeLabels
        : DEFAULT_TIME_SLOTS
      ).slice(0, lineData.length),
    [timeLabels, lineData.length]
  );

  const chartRef = useRef(null);

  // Memoize reference line data
  const referenceLineData = useMemo(
    () => new Array(lineData.length).fill(reference),
    [lineData.length, reference]
  );

  // cấu hình Highcharts - memoize để tránh tạo object mới mỗi render
  const options = useMemo(
    () => ({
      chart: {
        type: "line",
        height: CHART_CONFIG.height,
        margin: CHART_CONFIG.margin,
        backgroundColor: CHART_CONFIG.backgroundColor,
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
                text: reference != null ? reference.toFixed(2) : "",
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
          const pointIndex = this.points?.[1]?.point?.index ?? 0;
          const timeDisplay = timeSlots[pointIndex] || "";

          return `
          <div class='flex flex-1 flex-direction-column fs-verySmall' style="background-color: black; color: white; padding: 8px;">
            <div class='flex-1'>${timeDisplay}</div>
            <div class='flex-1'>
              ${
                symbolCode || ""
              }: <span style="color: ${valueColor}; font-weight: bold;">${
            indexValue?.toFixed ? indexValue.toFixed(2) : indexValue
          }</span>
            </div>
            <div class='flex-1'>
              KLGD: <span style="color: ${volumeColor}; font-weight: bold;">${formatVolume(
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
          data: volumeData,
          color: "#4dd6ff",
          yAxis: 1,
        },
        {
          type: "line",
          data: lineData,
          color: "#00ff66",
          lineWidth: 2,
          marker: { enabled: false },
        },
        {
          type: "line",
          data: referenceLineData,
          color: "#ffb600",
          dashStyle: "Dash",
          lineWidth: 2,
          marker: { enabled: false },
          enableMouseTracking: false,
        },
      ],
    }),
    [lineData, volumeData, reference, timeSlots, symbolCode, referenceLineData]
  );

  // Imperative update khi symbolCode thay đổi (chỉ update khi card được chọn)
  useEffect(() => {
    if (!isSelected) return;

    if (!chartRef.current?.chart) return;

    const chart = chartRef.current.chart;

    // Update series data
    chart.series[0].setData(volumeData, false);
    chart.series[1].setData(lineData, false);
    chart.series[2].setData(referenceLineData, false);

    // Update xAxis categories
    chart.xAxis[0].setCategories(timeSlots, false);

    // Update yAxis plotLines (reference line)
    chart.yAxis[0].update({
      plotLines: [
        {
          value: reference,
          zIndex: 10,
          width: 0,
          color: "#CE9B51",
          label: {
            text: reference != null ? reference.toFixed(2) : "",
            align: "center",
            style: {
              color: "var(--TEXT__1)",
              fontSize: "0.65rem",
            },
          },
        },
      ],
    });

    // Redraw chart
    chart.redraw();
  }, [
    symbolCode,
    lineData,
    volumeData,
    reference,
    timeSlots,
    isSelected,
    referenceLineData,
  ]);

  return (
    <HighchartsReact
      key={symbolCode}
      ref={chartRef}
      highcharts={Highcharts}
      options={options}
    />
  );
}
