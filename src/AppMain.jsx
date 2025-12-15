import React, {useState, useEffect, useCallback} from "react";
import {
    IndexCard,
    IndexChart,
    MainTable,
    StockTable,
    TopMenu,
} from "./components";
import {useAuth} from "./contexts/AuthContext";
import websocket, {
    subscribeStream,
    unsubscribeStream,
    subscribeIntradayTopic,
    unsubscribeIntradayTopic,
} from "./services/socketStream";
import {formatVolume, formatValueBillion} from "./utils/format";
import "./AppMain.scss";
import {TOPIC_CONFIGS, SESSION_MAP, INITIAL_INDEX_LIST, INITIAL_CARD_CONFIGS} from "./configs/marketConfig";


export function MainApp() {
    const {user, logout, isAuthenticated, isGuestMode} = useAuth();

    function getSessionText(t336) {
        if (!t336) return "";
        return SESSION_MAP[String(t336)] || "";
    }

    function handleIndexUpdate(data, indexName) {
        if (!data.data || data.data.t30217 === undefined) return;
        const price = data.data.t30217;
        const change = data.data.t40003;
        const reference = data.data.t40002;
        const percent = reference ? ((change / reference) * 100).toFixed(2) : 0;
        const volume = data.data.t387;
        const value = data.data.t381;
        const up = data.data.t30590;
        const mid = data.data.t30591;
        const down = data.data.t30592;
        const t30589 = data.data.t30589;
        const t30593 = data.data.t30593;
        const t336 = data.data.t336;
        const sessionText = getSessionText(t336);

        // Cập nhật cardConfigs cho card bên trái - UPDATE TẤT CẢ CARDS
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
                        down: down !== undefined ? `${down}(${t30593})` : config.down,
                        sessionText: sessionText || config.sessionText,
                    }
                    : config
            )
        );

        // Cập nhật indexList cho bảng bên phải
        setIndexList((prev) =>
            prev.map((item) =>
                item.name === indexName
                    ? {
                        ...item,
                        price: price,
                        change: parseFloat(change),
                        percent: parseFloat(percent),
                        volume:
                            volume !== undefined
                                ? parseFloat((volume / 1000000).toFixed(2))
                                : item.volume,
                        value: value !== undefined ? value : item.value,
                        up: up !== undefined ? up : item.up,
                        mid: mid !== undefined ? mid : item.mid,
                        down: down !== undefined ? down : item.down,
                    }
                    : item
            )
        );
    }

    const [selectedSymbol, setSelectedSymbol] = useState("VNI");

    // State để lưu dữ liệu intraday chart theo symbol
    const [intradayData, setIntradayData] = useState({
        VNI: [],
        VN30: [],
        HNX: [],
        UPCOM: [],
        HNX30: [],
    });

    // Helper function để cập nhật chart từ dữ liệu intraday
    const updateChartFromIntraday = useCallback((dataArray, symbol) => {
        if (!dataArray || dataArray.length === 0) return;

        const lineData = dataArray.map((item) => item.data?.C || 0);
        const volumeData = dataArray.map((item) => item.data?.V || 0);
        const timeLabels = dataArray.map((item) => item.data?.T || ""); // Lấy timestamp T

        setCardConfigs((prev) => {
            const updated = prev.map((config) => {
                if (config.symbolCode === symbol) {
                    return {
                        ...config,
                        line: lineData, // Hiển thị tất cả dữ liệu
                        volume: volumeData, // Hiển thị tất cả dữ liệu
                        reference: dataArray[0]?.data?.O || config.reference,
                        timeLabels: timeLabels, // Hiển thị tất cả timestamps
                    };
                }
                return config;
            });
            return updated;
        });
    }, []);

    // Đăng ký tất cả intraday topics khi mount để cập nhật realtime chart cho tất cả symbol
    useEffect(() => {
        const subscribeAllIntradayTopics = () => {
            TOPIC_CONFIGS.forEach(({symbol, intraday}) => {
                subscribeIntradayTopic(intraday, {
                    onHistRes: (data, receivedTopic) => {
                        let responseData = data;
                        let dataArray = [];

                        // Nếu là array format ["HIST_RES", {...}]
                        if (Array.isArray(data) && data[0] === "HIST_RES" && data[1]) {
                            responseData = data[1];
                        }

                        // Extract symbol từ receivedTopic
                        let targetSymbol = symbol;
                        if (receivedTopic) {
                            const config = TOPIC_CONFIGS.find(
                                (c) => c.intraday === receivedTopic
                            );
                            if (config) {
                                targetSymbol = config.symbol;
                            }
                        }

                        // Kiểm tra xem dữ liệu có `Data` array hay không (HIST_RES lần đầu)
                        if (
                            responseData &&
                            responseData.Data &&
                            Array.isArray(responseData.Data) &&
                            responseData.Data.length > 0
                        ) {
                            // Đây là HIST_RES lần đầu với toàn bộ dữ liệu lịch sử
                            dataArray = responseData.Data;

                            // Lưu trữ toàn bộ dữ liệu
                            setIntradayData((prev) => {
                                const updated = {...prev, [targetSymbol]: dataArray};
                                return updated;
                            });

                            // Cập nhật chart
                            updateChartFromIntraday(dataArray, targetSymbol);
                        } else if (
                            responseData &&
                            (!responseData.Data ||
                                responseData.Data === "" ||
                                responseData.Data.length === 0) &&
                            responseData.Result === 0
                        ) {
                            // Dữ liệu rỗng - không làm gì, chờ realtime update
                        } else if (
                            responseData &&
                            responseData.data &&
                            typeof responseData.data === "object" &&
                            !responseData.Data
                        ) {
                            // Đây là realtime update - chỉ có 1 item với structure {topic, seq, type, data: {...}}

                            // Append vào dữ liệu existing
                            setIntradayData((prev) => {
                                const existing = prev[targetSymbol] || [];

                                // Kiểm tra xem item này đã có chưa (dùng seq để check)
                                const lastSeq =
                                    existing.length > 0 ? existing[existing.length - 1].seq : -1;

                                if (responseData.seq > lastSeq) {
                                    // Append item mới
                                    const updated = [...existing, responseData];

                                    // Cập nhật chart với dữ liệu mới
                                    updateChartFromIntraday(updated, targetSymbol);

                                    return {...prev, [targetSymbol]: updated};
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
            // Cleanup: unsubscribe tất cả
            unsubscribeIntradayTopic();
        };
    }, []);

    // Khi chọn symbol khác, gửi lại HIST_REQ cho symbol đó
    useEffect(() => {
        const selectedConfig = TOPIC_CONFIGS.find(
            (c) => c.symbol === selectedSymbol
        );
        if (!selectedConfig) return;

        // Chỉ gửi HIST_REQ, không register handler mới (handler cũ từ mount sẽ xử lý)
        subscribeIntradayTopic(selectedConfig.intraday);
    }, [selectedSymbol]);

    // Chọn chỉ số topic mới trong dropdown card sẽ sub realtime cho card đó, đồng thời các card khác vẫn sub bình thường
    // update: 2/12
    useEffect(() => {
        const config = TOPIC_CONFIGS.find((c) => c.symbol === selectedSymbol);
        if (!config) return;
        const handler = (data) => handleIndexUpdate(data, selectedSymbol);
        subscribeStream(config.topic, handler);
        return () => {
            unsubscribeStream(config.topic);
        };
    }, [selectedSymbol]);

    // Đăng ký tất cả realtime topics khi mount để cập nhật price/volume/up/down/mid realtime cho tất cả card
    useEffect(() => {
        const subscribeAllRealtimeTopics = () => {
            TOPIC_CONFIGS.forEach(({symbol, topic}) => {
                const handler = (data) => handleIndexUpdate(data, symbol);
                subscribeStream(topic, handler);
            });
        };

        subscribeAllRealtimeTopics();

        return () => {
            // Cleanup: unsubscribe tất cả
            TOPIC_CONFIGS.forEach(({topic}) => {
                unsubscribeStream(topic);
            });
        };
    }, []);

    const connected = websocket.getStreamStatus();

    // mook data realtime cho bảng phía bên phải
    const [indexList, setIndexList] = useState(INITIAL_INDEX_LIST);

    // mook data realtime cho 4 card biểu đồ phía bên trái
    const [cardConfigs, setCardConfigs] = useState(INITIAL_CARD_CONFIGS);

    // State để track symbol hiện tại của từng card (theo index)
    const [cardSymbols, setCardSymbols] = useState(
        cardConfigs.map((config) => config.symbolCode)
    );

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

            <TopMenu onLogout={logout} />

            <div className="app-stock-table-section">
                <StockTable />
            </div>
        </div>
    );
}

export default MainApp;
