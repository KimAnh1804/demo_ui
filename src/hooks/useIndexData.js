import { useState, useEffect, useCallback } from "react";
import {
  subscribeStream,
  unsubscribeStream,
  subscribeIntradayTopic,
} from "../services/socketStream";
import { TOPIC_CONFIGS, SESSION_MAP } from "../configs/marketConfig";
import { formatVolume, formatValueBillion } from "../utils/format";

export const useIndexData = () => {
  const [cardConfigs, setCardConfigs] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("VNI");

  const getSessionText = useCallback((t336) => {
    if (!t336) return "";
    return SESSION_MAP[String(t336)] || "";
  }, []);

  const handleIndexUpdate = useCallback(
    (data, indexName) => {
      if (!data.data || data.data.t30217 === undefined) return;

      const price = data.data.t30217;
      const change = data.data.t40003;
      const reference = data.data.t40002;
      const percent = reference
        ? ((change / reference) * 100).toFixed(2)
        : 0;
      const volume = data.data.t387;
      const value = data.data.t381;
      const up = data.data.t30590;
      const mid = data.data.t30591;
      const down = data.data.t30592;
      const t30589 = data.data.t30589;
      const t30593 = data.data.t30593;
      const t336 = data.data.t336;
      const sessionText = getSessionText(t336);

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
                down:
                  down !== undefined ? `${down}(${t30593})` : config.down,
                sessionText: sessionText || config.sessionText,
              }
            : config
        )
      );
    },
    [getSessionText]
  );

  const updateChartFromIntraday = useCallback((dataArray, symbol) => {
    if (!dataArray || dataArray.length === 0) return;

    const lineData = dataArray.map((item) => item.data?.C || 0);
    const volumeData = dataArray.map((item) => item.data?.V || 0);
    const timeLabels = dataArray.map((item) => item.data?.T || "");

    setCardConfigs((prev) =>
      prev.map((config) =>
        config.symbolCode === symbol
          ? {
              ...config,
              line: lineData,
              volume: volumeData,
              reference: dataArray[0]?.data?.O || config.reference,
              timeLabels: timeLabels,
            }
          : config
      )
    );
  }, []);

  useEffect(() => {
    const config = TOPIC_CONFIGS.find((c) => c.symbol === selectedSymbol);
    if (!config) return;
    const handler = (data) => handleIndexUpdate(data, selectedSymbol);
    subscribeStream(config.topic, handler);
    return () => {
      unsubscribeStream(config.topic);
    };
  }, [selectedSymbol, handleIndexUpdate]);

  useEffect(() => {
    const subscribeAllRealtimeTopics = () => {
      TOPIC_CONFIGS.forEach(({ symbol, topic }) => {
        const handler = (data) => handleIndexUpdate(data, symbol);
        subscribeStream(topic, handler);
      });
    };

    subscribeAllRealtimeTopics();

    return () => {
      TOPIC_CONFIGS.forEach(({ topic }) => {
        unsubscribeStream(topic);
      });
    };
  }, [handleIndexUpdate]);

  useEffect(() => {
    const selectedConfig = TOPIC_CONFIGS.find(
      (c) => c.symbol === selectedSymbol
    );
    if (!selectedConfig) return;

    subscribeIntradayTopic(selectedConfig.intraday);
  }, [selectedSymbol]);

  return {
    cardConfigs,
    setCardConfigs,
    selectedSymbol,
    setSelectedSymbol,
    updateChartFromIntraday,
  };
};
