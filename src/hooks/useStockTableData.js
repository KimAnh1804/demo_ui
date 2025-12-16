import { useState, useEffect, useCallback } from "react";
import {
  subscribeStream,
  unsubscribeStream,
} from "../services/socketStream";

export const useStockTableData = () => {
  const [tableData, setTableData] = useState(null);
  const [watchlistTitle, setWatchlistTitle] = useState("");

  const handleWatchlistSelect = useCallback((data, title) => {
    setTableData(data);
    setWatchlistTitle(title || "");
  }, []);

  const handleStockUpdate = useCallback((data, symbol) => {
    if (!data?.data) return;
    const d = data.data;

    setTableData((prevData) => {
      if (!prevData) return prevData;
      return prevData.map((stock) => {
        if (stock.symbol !== symbol) return stock;

        const newStock = { ...stock };
        const val = (v) => (v !== undefined ? parseFloat(v) : undefined);

        if (d.t40002 !== undefined) newStock.ref = val(d.t40002);
        if (d.t30221 !== undefined) newStock.ceiling = val(d.t30221);
        if (d.t30220 !== undefined) newStock.floor = val(d.t30220);

        if (!newStock.match) newStock.match = {};
        if (d.t30217 !== undefined) newStock.match.price = val(d.t30217);
        if (d.t40003 !== undefined) newStock.match.change = val(d.t40003);
        if (newStock.match.change !== undefined && newStock.ref) {
          newStock.match.percent = (
            (newStock.match.change / newStock.ref) *
            100
          ).toFixed(2);
        }
        if (d.t30218 !== undefined) newStock.match.vol = val(d.t30218);

        if (d.t387 !== undefined) newStock.totalVol = val(d.t387);

        if (!newStock.bid) newStock.bid = {};
        if (d.t30001 !== undefined) newStock.bid.p1 = val(d.t30001);
        if (d.t30002 !== undefined) newStock.bid.v1 = val(d.t30002);
        if (d.t30003 !== undefined) newStock.bid.p2 = val(d.t30003);
        if (d.t30004 !== undefined) newStock.bid.v2 = val(d.t30004);
        if (d.t30005 !== undefined) newStock.bid.p3 = val(d.t30005);
        if (d.t30006 !== undefined) newStock.bid.v3 = val(d.t30006);

        if (!newStock.ask) newStock.ask = {};
        if (d.t30011 !== undefined) newStock.ask.p1 = val(d.t30011);
        if (d.t30012 !== undefined) newStock.ask.v1 = val(d.t30012);
        if (d.t30013 !== undefined) newStock.ask.p2 = val(d.t30013);
        if (d.t30014 !== undefined) newStock.ask.v2 = val(d.t30014);
        if (d.t30015 !== undefined) newStock.ask.p3 = val(d.t30015);
        if (d.t30016 !== undefined) newStock.ask.v3 = val(d.t30016);

        if (!newStock.prices) newStock.prices = {};
        if (d.t30228 !== undefined) newStock.prices.high = val(d.t30228);
        if (d.t30229 !== undefined) newStock.prices.low = val(d.t30229);
        if (d.t30227 !== undefined) newStock.prices.open = val(d.t30227);

        return newStock;
      });
    });
  }, []);

  useEffect(() => {
    if (!tableData || tableData.length === 0) return;

    const symbols = tableData.map((s) => s.symbol);

    symbols.forEach((symbol) => {
      subscribeStream(symbol, (data) => handleStockUpdate(data, symbol));
    });

    return () => {
      symbols.forEach((symbol) => {
        unsubscribeStream(symbol);
      });
    };
  }, [tableData, handleStockUpdate]);

  const handleAddStock = useCallback((symbol) => {
    setTableData((prev) => {
      if (!prev) return prev;
      if (prev.find((s) => s.symbol === symbol)) return prev;

      const newStock = {
        symbol: symbol,
        ref: 0,
        ceiling: 0,
        floor: 0,
        bid: { p1: 0, v1: 0, p2: 0, v2: 0, p3: 0, v3: 0 },
        ask: { p1: 0, v1: 0, p2: 0, v2: 0, p3: 0, v3: 0 },
        match: { price: 0, vol: 0, change: 0, percent: 0 },
        totalVol: 0,
        prices: { avg: 0, high: 0, low: 0, open: 0 },
        foreign: { buy: 0, sell: 0 },
      };
      return [...prev, newStock];
    });
  }, []);

  return {
    tableData,
    watchlistTitle,
    handleWatchlistSelect,
    handleAddStock,
  };
};
