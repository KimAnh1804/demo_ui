import React, {useState, useMemo} from "react";
import {
  IndexCard,
  IndexChart,
  MainTable,
  StockTable,
  TopMenu,
} from "./components";
import {useAuth} from "./contexts/AuthContext";
import websocket from "./services/socketStream";
import "./AppMain.scss";
import {
  INITIAL_INDEX_LIST,
  INITIAL_CARD_CONFIGS,
} from "./configs/marketConfig";
import {useIndexData} from "./hooks/useIndexData";
import {useIntradayData} from "./hooks/useIntradayData";
import {useStockTableData} from "./hooks/useStockTableData";

export function MainApp() {
  const {user, logout, isAuthenticated, isGuestMode} = useAuth();
  const [indexList, setIndexList] = useState(INITIAL_INDEX_LIST);

  const {
    cardConfigs,
    setCardConfigs,
    selectedSymbol,
    setSelectedSymbol,
    updateChartFromIntraday,
  } = useIndexData();

  const intradayData = useIntradayData(updateChartFromIntraday);

  const {tableData, handleWatchlistSelect, handleAddStock} =
    useStockTableData();

  const [cardSymbols, setCardSymbols] = useState(
    INITIAL_CARD_CONFIGS.map((config) => config.symbolCode)
  );

  React.useEffect(() => {
    setCardConfigs(INITIAL_CARD_CONFIGS);
  }, [setCardConfigs]);

  const connected = websocket.getStreamStatus();

  return (
    <div className="app-root">
      {/* Header with User Info and Logout */}
      <div className="app-header">
        <div className="header-content">
          <h1>Bảng Giá Chứng Khoán Realtime</h1>
          <div className="user-info">
            {isAuthenticated && !isGuestMode ? (
              <>
                <span className="user-name">{user?.username}</span>
                <button
                  className="btn-logout"
                  onClick={logout}
                  title="Đăng xuất"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                className="btn-login"
                onClick={() => window.location.reload()}
                title="Đăng nhập"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="app-layout">
        <div className="app-cards">
          {cardConfigs.map((config, idx) => {
            const currentCardSymbol = cardSymbols[idx];
            const isSelected = selectedSymbol === currentCardSymbol;

            // Lấy data theo symbol hiện tại của card này
            const cardData = intradayData[currentCardSymbol] || [];
            const displayLine =
              cardData.length > 0
                ? cardData.map((item) => item.data?.C || 0)
                : config.line;
            const displayVolume =
              cardData.length > 0
                ? cardData.map((item) => item.data?.V || 0)
                : config.volume;
            const displayTimeLabels =
              cardData.length > 0
                ? cardData.map((item) => item.data?.T || "")
                : config.timeLabels;

            return (
              <IndexCard
                key={idx}
                title={config.title}
                symbolCode={config.symbolCode}
                line={displayLine}
                volume={displayVolume}
                reference={config.reference}
                price={config.price}
                change={config.change}
                percent={config.percent}
                volumeText={config.volumeText}
                valueText={config.valueText}
                up={config.up}
                mid={config.mid}
                down={config.down}
                sessionText={config.sessionText}
                timeLabels={displayTimeLabels}
                onSymbolChange={(newSymbolCode) => {
                  // Update symbol của card này
                  setCardSymbols((prev) => {
                    const updated = [...prev];
                    updated[idx] = newSymbolCode;
                    return updated;
                  });
                  setSelectedSymbol(newSymbolCode);
                }}
                isSelected={isSelected}
              />
            );
          })}
        </div>
        <div className="app-table">
          <MainTable data={indexList} />
        </div>
      </div>

      <TopMenu
        onLogout={logout}
        onWatchlistSelect={handleWatchlistSelect}
        onAddStock={handleAddStock}
      />

      <div className="app-stock-table-section">
        <StockTable data={tableData} />
      </div>
    </div>
  );
}

export default MainApp;
