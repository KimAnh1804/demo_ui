// Mapping dữ liệu socket sang object thân thiện cho UI
function mapSocketDataToRow(data) {
  // Xử lý TPBID (thông tin dư mua) - mảng có 3 level
  const bidData = data.TPBID || [];
  const bid1 = bidData.find(b => b.t83 === 1) || {};
  const bid2 = bidData.find(b => b.t83 === 2) || {};
  const bid3 = bidData.find(b => b.t83 === 3) || {};

  // Xử lý TPOFFER (thông tin dư bán) - mảng có 3 level
  const offerData = data.TPOFFER || [];
  const offer1 = offerData.find(o => o.t83 === 1) || {};
  const offer2 = offerData.find(o => o.t83 === 2) || {};
  const offer3 = offerData.find(o => o.t83 === 3) || {};

  // Tính toán % thay đổi
  const change = data.t40003 || 0;
  const ref = data.t40002 || 0;
  const percent = ref ? ((parseFloat(change) / parseFloat(ref)) * 100).toFixed(2) : 0;

  return {
    symbol: data.t55, // mã CK
    board: data.t20004 || 'G1', // sàn giao dịch (G1, G2, G3)
    ref: ref, // giá tham chiếu
    ceiling: data.t30221 || 0, // giá trần
    floor: data.t30220 || 0, // giá sàn
    
    // Thông tin dư mua (3 level)
    bid: {
      p1: bid1.t270 || 0, // giá mua 1
      v1: bid1.t271 || 0, // KL mua 1
      p2: bid2.t270 || 0, // giá mua 2
      v2: bid2.t271 || 0, // KL mua 2
      p3: bid3.t270 || 0, // giá mua 3
      v3: bid3.t271 || 0, // KL mua 3
    },
    
    // Thông tin dư bán (3 level)
    ask: {
      p1: offer1.t270 || 0, // giá bán 1
      v1: offer1.t271 || 0, // KL bán 1
      p2: offer2.t270 || 0, // giá bán 2
      v2: offer2.t271 || 0, // KL bán 2
      p3: offer3.t270 || 0, // giá bán 3
      v3: offer3.t271 || 0, // KL bán 3
    },
    
    // Thông tin khớp lệnh
    match: {
      price: data.t31 || 0, // giá khớp lệnh
      vol: data.t32 || 0, // khối lượng khớp lệnh
      change: change,
      percent: percent,
    },
    
    // Tổng khối lượng
    totalVol: data.t387 || 0, // tổng KL giao dịch
    
    // Thông tin giá
    prices: {
      avg: data.t30218 || 0, // giá trung bình
      high: data.t333 || 0, // giá cao nhất
      low: data.t332 || 0, // giá thấp nhất
      open: data.t30219 || 0, // giá mở cửa
    },
    
    // Thông tin ĐTNN
    foreign: {
      buy: data.t30223 || 0, // ĐTNN mua
      sell: data.t30224 || 0, // ĐTNN bán
    },
  };
}
import { useState, useEffect, useCallback, useRef } from "react";
import {
  subscribeStream,
  unsubscribeStream,
  emitSUB,
  emitUNSUB,
} from "../services/socketStream";

// Helper tạo object stock rỗng
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

  // Khởi tạo state từ localStorage nếu có
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
        return { ...stock, ...mapSocketDataToRow(d) };
      });
    });
  }, []);

  useEffect(() => {
    if (!tableData || tableData.length === 0) return;

    const symbols = tableData.map((s) => s.symbol);
    const board = tableData[0]?.board || 'G1';

    emitSUB(symbols, board);

    symbols.forEach((symbol) => {
      const topicTP = `KRXMDDS|TP|${board}|${symbol}`;
      const handler = (data) => handleStockUpdate(data, symbol);
      subscribeStream(topicTP, handler);
    });

    return () => {
      emitUNSUB(symbols, board);
      symbols.forEach((symbol) => {
        unsubscribeStream(`KRXMDDS|TP|${board}|${symbol}`);
      });
    };
  }, [tableData, handleStockUpdate]);

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
        board: s.board || 'G1'
      }));
      // Serialize để so sánh tránh ghi liên tục nếu không đổi
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
