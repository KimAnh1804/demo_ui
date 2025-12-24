

import { useState, useEffect, useCallback, useRef } from "react";
import {
  subscribeStream,
  unsubscribeStream,
  emitSUB,
  emitUNSUB,
} from "../services/socketStream";


function mergeSocketDataToRow(prevStock, data) {
  if (!data) return prevStock;
  
  const newStock = { ...prevStock };

 
  if (data.t55) newStock.symbol = data.t55;
  if (data.t20004) newStock.board = data.t20004;


  if (data.t140 !== undefined) newStock.ref = data.t140;
  if (data.t137 !== undefined) newStock.ref = data.t137; 
  if (data.t132 !== undefined) newStock.ref = data.t132; 
  if (data.t20013 !== undefined) newStock.ref = data.t20013; 
  if (data.t1149 !== undefined) newStock.ceiling = data.t1149;
  if (data.t1148 !== undefined) newStock.floor = data.t1148;

 
  if (data.TPBID && Array.isArray(data.TPBID)) {
    const newBid = { ...newStock.bid };
    data.TPBID.forEach(b => {
      const lvl = b.t83; 
      if (lvl >= 1 && lvl <= 3) {
        if (b.t270 !== undefined) newBid[`p${lvl}`] = b.t270;
        if (b.t271 !== undefined) newBid[`v${lvl}`] = b.t271;
      }
    });
    newStock.bid = newBid;
  }

  if (data.TPOFFER && Array.isArray(data.TPOFFER)) {
    const newAsk = { ...newStock.ask };
    data.TPOFFER.forEach(o => {
      const lvl = o.t83; // 1, 2, 3
      if (lvl >= 1 && lvl <= 3) {
        if (o.t270 !== undefined) newAsk[`p${lvl}`] = o.t270;
        if (o.t271 !== undefined) newAsk[`v${lvl}`] = o.t271;
      }
    });
    newStock.ask = newAsk;
  }

  const newMatch = { ...newStock.match };
  
  if (data.t270 !== undefined) newMatch.price = data.t270;
  if (data.t271 !== undefined) newMatch.vol = data.t271;
  
  if (data.t330 !== undefined) newMatch.change = data.t330;

  // Tính toán Change và Percent dựa trên Price và Ref
  // Change = Price - Ref
  const currentPrice = parseFloat(newMatch.price);
  const currentRef = parseFloat(newStock.ref);

  if (!isNaN(currentPrice) && !isNaN(currentRef) && currentRef > 0 && currentPrice > 0) {
    const change = currentPrice - currentRef;
    newMatch.change = change;
    newMatch.percent = ((change / currentRef) * 100).toFixed(2);
  }
  
  newStock.match = newMatch;

  
  if (data.t387 !== undefined) newStock.totalVol = data.t387;

  const newPrices = { ...newStock.prices };
  let pricesChanged = false;
  if (data.t40001 !== undefined) { newPrices.avg = data.t40001; pricesChanged = true; }
  if (data.t30562 !== undefined) { newPrices.high = data.t30562; pricesChanged = true; }
  if (data.t30563 !== undefined) { newPrices.low = data.t30563; pricesChanged = true; }
  if (data.t30561 !== undefined) { newPrices.open = data.t30561; pricesChanged = true; }
  if (pricesChanged) newStock.prices = newPrices;


  const newForeign = { ...newStock.foreign };
  let foreignChanged = false;

  if (data.FRG) {
    if (data.FRG.t30645 !== undefined) { 
      newForeign.buy = data.FRG.t30645; 
      foreignChanged = true; 
    }
    if (data.FRG.t30643 !== undefined) { 
      newForeign.sell = data.FRG.t30643; 
      foreignChanged = true; 
    }
  } 

  if (!foreignChanged) {
      if (data.t30645 !== undefined) { newForeign.buy = data.t30645; foreignChanged = true; }
      if (data.t30643 !== undefined) { newForeign.sell = data.t30643; foreignChanged = true; }
  }

  if (foreignChanged) newStock.foreign = newForeign;

  return newStock;
}

const createEmptyStock = (symbol, board = 'G1') => ({
  symbol: symbol,
  board: board,
  ref: 0,
  ceiling: 0,
  floor: 0,
  bid: { p1: 0, v1: 0, p2: 0, v2: 0, p3: 0, v3: 0 },
  ask: { p1: 0, v1: 0, p2: 0, v2: 0, p3: 0, v3: 0 },
  match: { price: 0, vol: 0, change: 0, percent: 0 },
  totalVol: 0,
  prices: { avg: 0, high: 0, low: 0, open: 0 },
  foreign: { buy: 0, sell: 0 },
});

export const useStockTableData = () => {
  const lastSavedSymbolsRef = useRef("");

  const [tableData, setTableData] = useState(() => {
    try {
      const saved = localStorage.getItem("saved_table_symbols");
      if (saved) {
        lastSavedSymbolsRef.current = saved;
        const items = JSON.parse(saved);
        if (Array.isArray(items) && items.length > 0) {
          return items.map(item => 
            typeof item === 'string' 
              ? createEmptyStock(item) 
              : createEmptyStock(item.symbol, item.board)
          );
        }
      }
    } catch (e) {
      console.error("Error loading saved symbols from localStorage", e);
    }
    return [];
  });
  
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
        return mergeSocketDataToRow(stock, d);
      });
    });
  }, []);

  const subRef = useRef("");

  useEffect(() => {
    if (!tableData || tableData.length === 0) return;

    const symbolsKey = tableData.map(s => `${s.symbol}|${s.board || 'G1'}`).sort().join(',');

    if (subRef.current === symbolsKey) return;
    
    subRef.current = symbolsKey;

    const stocksByBoard = tableData.reduce((acc, stock) => {
      const b = stock.board;
      const targetBoards = (b === 'UNKNOWN' || !b) ? ['G1'] : [b];
      
      targetBoards.forEach(board => {
        if (!acc[board]) acc[board] = [];
        acc[board].push(stock.symbol);
      });
      return acc;
    }, {});

    // 1. Gửi lệnh SUB request theo từng board
    Object.entries(stocksByBoard).forEach(([board, symbols]) => {
      emitSUB(symbols, board);
    });
    
    const topicTypes = ['TP', 'SI', 'ST', 'MD', 'MT'];

    tableData.forEach((stock) => {
      const b = stock.board;
      const targetBoards = (b === 'UNKNOWN' || !b) ? ['G1'] : [b];

      targetBoards.forEach(board => {
        topicTypes.forEach(type => {
          const topic = `KRXMDDS|${type}|${board}|${stock.symbol}`;
          const handler = (data) => handleStockUpdate(data, stock.symbol);
          subscribeStream(topic, handler);
        });
      });
    });

    return () => {
  
      
      Object.entries(stocksByBoard).forEach(([board, symbols]) => {
        emitUNSUB(symbols, board);
      });
      
      tableData.forEach((stock) => {
        const b = stock.board;
        const targetBoards = (b === 'UNKNOWN' || !b) ? ['G1'] : [b];

        targetBoards.forEach(board => {
          topicTypes.forEach(type => {
            unsubscribeStream(`KRXMDDS|${type}|${board}|${stock.symbol}`);
          });
        });
      });
      
    
    };
  }, [JSON.stringify(tableData.map(s => `${s.symbol}|${s.board || 'UNKNOWN'}`))]); 

  const handleAddStock = useCallback((symbol, board = 'G1') => {
    setTableData((prev) => {
      if (!prev) return [createEmptyStock(symbol, board)];
      if (prev.find((s) => s.symbol === symbol)) return prev;

      return [...prev, createEmptyStock(symbol, board)];
    });
  }, []);
  
  // Effect để lưu danh sách mã vào localStorage khi thay đổi
  useEffect(() => {
    if (tableData) {
      const symbolsToSave = tableData.map(s => ({
        symbol: s.symbol,
        symbol: s.symbol,
        board: s.board || 'UNKNOWN'
      }));
      
      const json = JSON.stringify(symbolsToSave);
      const currentSaved = localStorage.getItem("saved_table_symbols");
      
      if (json !== currentSaved) {
        localStorage.setItem("saved_table_symbols", json);
      }
    }
  }, [tableData]);

  return {
    tableData,
    watchlistTitle,
    handleWatchlistSelect,
    handleAddStock,
  
    
    
  };
};
