import { useState, useEffect, useCallback } from "react";
import {
  subscribeIntradayTopic,
  unsubscribeIntradayTopic,
} from "../services/socketStream";
import { TOPIC_CONFIGS } from "../configs/marketConfig";

export const useIntradayData = (updateChartFromIntraday) => {
  const [intradayData, setIntradayData] = useState({
    VNI: [],
    VN30: [],
    HNX: [],
    UPCOM: [],
    HNX30: [],
  });

  useEffect(() => {
    const subscribeAllIntradayTopics = () => {
      TOPIC_CONFIGS.forEach(({ symbol, intraday }) => {
        subscribeIntradayTopic(intraday, {
          onHistRes: (data, receivedTopic) => {
            let responseData = data;
            let dataArray = [];

            if (Array.isArray(data) && data[0] === "HIST_RES" && data[1]) {
              responseData = data[1];
            }

            let targetSymbol = symbol;
            if (receivedTopic) {
              const config = TOPIC_CONFIGS.find(
                (c) => c.intraday === receivedTopic
              );
              if (config) {
                targetSymbol = config.symbol;
              }
            }

            if (
              responseData?.Data &&
              Array.isArray(responseData.Data) &&
              responseData.Data.length > 0
            ) {
              dataArray = responseData.Data;

              setIntradayData((prev) => {
                const updated = { ...prev, [targetSymbol]: dataArray };
                return updated;
              });

              updateChartFromIntraday(dataArray, targetSymbol);
            } else if (
              responseData &&
              (!responseData.Data ||
                responseData.Data === "" ||
                responseData.Data.length === 0) &&
              responseData.Result === 0
            ) {
              // Empty data - wait for realtime update
            } else if (
              responseData?.data &&
              typeof responseData.data === "object" &&
              !responseData.Data
            ) {
              setIntradayData((prev) => {
                const existing = prev[targetSymbol] || [];
                const lastSeq =
                  existing.length > 0 ? existing[existing.length - 1].seq : -1;

                if (responseData.seq > lastSeq) {
                  const updated = [...existing, responseData];
                  updateChartFromIntraday(updated, targetSymbol);
                  return { ...prev, [targetSymbol]: updated };
                }
                return prev;
              });
            }
          },
        });
      });
    };

    subscribeAllIntradayTopics();

    return () => {
      unsubscribeIntradayTopic();
    };
  }, [updateChartFromIntraday]);

  return intradayData;
};
