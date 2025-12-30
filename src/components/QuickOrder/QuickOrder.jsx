import React, {useState} from 'react';
import './QuickOrder.scss';
import {MOCK_DATA} from '../../data/mockStockData';
import {useEffect, useRef} from 'react';
import {
    sendListStockIndustryRequest,
    sendGetListIndividualBondsSecuritiesRequest,
    sendGetBuyPowerRequest,
    sendGetSellAbleRequest,
    subscribeTradingResponse,
    unsubscribeTradingResponse
} from '../../services/socketTrading';
import {
    subscribeStream,
    unsubscribeStream,
    emitSUB,
    emitUNSUB
} from '../../services/socketStream';
import {TbCaretUpFilled} from "react-icons/tb";


const normalizeResponse = (resp) => {
    try {
        if (resp && typeof resp.Data === "string") {
            return {...resp, Data: JSON.parse(resp.Data)};
        }
    } catch (e) { }
    return resp;
};

const extractStockInfos = (resp) => {
    const data = resp?.Data || resp?.InVal || resp?.OutVal || resp;
    if (!Array.isArray(data)) {
        if (typeof data === 'string') {
            if (data.includes(';')) return extractStockInfos({Data: data.split(';')});
            if (data.includes('\n')) return extractStockInfos({Data: data.split('\n')});
            return extractStockInfos({Data: [data]});
        }
        if (typeof data === 'object' && data !== null) return extractStockInfos({Data: [data]});
        return [];
    }

    return data.map(it => {
        let symbol = null;
        let board = null;
        let name = "";

        if (typeof it === 'string') {
            if (it.includes('|')) {
                const parts = it.split('|');
                symbol = parts[0];
                board = parts[1];
                if (parts.length > 2 && isNaN(parts[2])) name = parts[2];
            } else {
                symbol = it;
            }
        } else if (Array.isArray(it)) {
            symbol = it[0];
            board = it[1];
            if (it.length > 2 && typeof it[2] === 'string') name = it[2];
        } else if (typeof it === 'object') {
            symbol = it?.SecCode || it?.code || it?.symbol || it?.c0 || it?.t55 || it?.[0];
            board = it?.board || it?.Board || it?.floor || it?.Floor || it?.t20004 || it?.c1 || it?.mk || it?.market;
            name = it?.SecName || it?.name || it?.Name || it?.t56 || "";
        }

        if (!symbol || typeof symbol !== 'string') return null;

        let normBoard = board || 'UNKNOWN';
        let ref = it?.t20013 ? parseFloat(it.t20013) : 0;

        return {symbol: symbol.trim(), board: normBoard, ref, name: name || ""};
    }).filter(x => x);
};

const QuickOrder = ({isOpen, onClose, selectedStock}) => {
    const [activeTab, setActiveTab] = useState('normal');
    const [rightTab, setRightTab] = useState('suc_mua');
    const [orderType, setOrderType] = useState('01');
    const [side, setSide] = useState('B');
    const [allStocks, setAllStocks] = useState([]);
    const [stockSearchQuery, setStockSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedStockValue, setSelectedStockValue] = useState(selectedStock || "");
    const [accountNo] = useState("004C000503");

    const [realtimeData, setRealtimeData] = useState({
        ceiling: 0,
        floor: 0,
        ref: 0,
        matchPrice: 0,
        matchVolume: 0,
        totalVolume: 0,
        foreignRoom: 0,
        avgPrice: 0,
        highPrice: 0,
        lowPrice: 0,
        openPrice: 0,
        foreignBuy: 0,
        foreignSell: 0
    });
    const [buyingPower, setBuyingPower] = useState(0);
    const [maxBuy, setMaxBuy] = useState(0);
    const [maxSell, setMaxSell] = useState(0);

    const fetchAccountData = (symbol) => {
        if (!symbol) return;

        sendGetBuyPowerRequest(accountNo, symbol);
        sendGetSellAbleRequest(accountNo);
    };

    useEffect(() => {
        const handleStockResponse = (resp) => {
            try {
                const norm = normalizeResponse(resp);
                const info = extractStockInfos(norm);
                if (info && info.length > 0) {
                    setAllStocks(prev => {
                        const existing = new Set(prev.map(s => s.symbol));
                        const newItems = info.filter(s => !existing.has(s.symbol));
                        return [...prev, ...newItems];
                    });
                }
            } catch (e) {
                console.error("Error processing stock list response", e);
            }
        };

        const req1 = sendListStockIndustryRequest();
        if (req1) {
            const handler1 = (resp) => {
                handleStockResponse(resp);
                unsubscribeTradingResponse(`SEQ_${req1}`, handler1);
            };
            subscribeTradingResponse(`SEQ_${req1}`, handler1);
        }

        const req2 = sendGetListIndividualBondsSecuritiesRequest();
        if (req2) {
            const handler2 = (resp) => {
                handleStockResponse(resp);
                unsubscribeTradingResponse(`SEQ_${req2}`, handler2);
            };
            subscribeTradingResponse(`SEQ_${req2}`, handler2);
        }
    }, []);

    useEffect(() => {
        if (selectedStock) {
            setSelectedStockValue(selectedStock);
            fetchAccountData(selectedStock);
        }
    }, [selectedStock]);


    useEffect(() => {
        if (!selectedStockValue) return;


        const stockInfo = allStocks.find(s => s.symbol === selectedStockValue);
        const board = stockInfo?.board || 'G1';


        emitSUB([selectedStockValue], board);


        const handleRealtimeUpdate = (data) => {
            if (!data?.data) return;
            const d = data.data;

            setRealtimeData(prev => {
                const updated = {...prev};

                if (d.t1149 !== undefined) updated.ceiling = parseFloat(d.t1149) || 0;
                if (d.t1148 !== undefined) updated.floor = parseFloat(d.t1148) || 0;
                if (d.t140 !== undefined) updated.ref = parseFloat(d.t140) || 0;
                if (d.t137 !== undefined) updated.ref = parseFloat(d.t137) || 0;
                if (d.t132 !== undefined) updated.ref = parseFloat(d.t132) || 0;
                if (d.t20013 !== undefined) updated.ref = parseFloat(d.t20013) || 0;


                if (d.t270 !== undefined) updated.matchPrice = parseFloat(d.t270) || 0;
                if (d.t271 !== undefined) updated.matchVolume = parseFloat(d.t271) || 0;


                if (d.t387 !== undefined) updated.totalVolume = parseFloat(d.t387) || 0;

                if (d.t40001 !== undefined) updated.avgPrice = parseFloat(d.t40001) || 0;
                if (d.t30562 !== undefined) updated.highPrice = parseFloat(d.t30562) || 0;
                if (d.t30563 !== undefined) updated.lowPrice = parseFloat(d.t30563) || 0;
                if (d.t30561 !== undefined) updated.openPrice = parseFloat(d.t30561) || 0;

                if (d.FRG) {
                    if (d.FRG.t30645 !== undefined) updated.foreignBuy = parseFloat(d.FRG.t30645) || 0;
                    if (d.FRG.t30643 !== undefined) updated.foreignSell = parseFloat(d.FRG.t30643) || 0;
                } else {
                    if (d.t30645 !== undefined) updated.foreignBuy = parseFloat(d.t30645) || 0;
                    if (d.t30643 !== undefined) updated.foreignSell = parseFloat(d.t30643) || 0;
                }

                if (d.t30558 !== undefined) updated.foreignRoom = parseFloat(d.t30558) || 0;

                return updated;
            });
        };


        const topicTypes = ['TP', 'SI', 'ST', 'MD'];
        topicTypes.forEach(type => {
            const topic = `KRXMDDS|${type}|${board}|${selectedStockValue}`;
            subscribeStream(topic, handleRealtimeUpdate);
        });

        return () => {
            emitUNSUB([selectedStockValue], board);
            topicTypes.forEach(type => {
                const topic = `KRXMDDS|${type}|${board}|${selectedStockValue}`;
                unsubscribeStream(topic);
            });
        };
    }, [selectedStockValue, allStocks]);


    useEffect(() => {
        const handleBuyPowerResponse = (resp) => {
            try {
                const data = resp?.Data || resp?.OutVal;
                if (data) {

                    let power = 0;
                    if (typeof data === 'string') {
                        const parsed = JSON.parse(data);
                        power = parseFloat(parsed?.BuyingPower || parsed?.buyingPower || 0);
                    } else if (typeof data === 'object') {
                        power = parseFloat(data?.BuyingPower || data?.buyingPower || 0);
                    }

                    setBuyingPower(power);

                    if (realtimeData.matchPrice > 0) {
                        const calculatedMaxBuy = Math.floor(power / realtimeData.matchPrice);
                        setMaxBuy(calculatedMaxBuy);
                    } else if (realtimeData.ref > 0) {
                        const calculatedMaxBuy = Math.floor(power / realtimeData.ref);
                        setMaxBuy(calculatedMaxBuy);
                    }
                }
            } catch (e) {
                console.error("Error parsing buy power response", e);
            }
        };

        const handleSellAbleResponse = (resp) => {
            try {
                const data = resp?.Data || resp?.OutVal;
                if (data && selectedStockValue) {

                    let sellable = 0;
                    if (typeof data === 'string') {
                        const parsed = JSON.parse(data);

                        if (Array.isArray(parsed)) {
                            const stockData = parsed.find(item =>
                                item?.Symbol === selectedStockValue ||
                                item?.symbol === selectedStockValue
                            );
                            sellable = parseFloat(stockData?.SellAble || stockData?.sellAble || 0);
                        }
                    } else if (Array.isArray(data)) {
                        const stockData = data.find(item =>
                            item?.Symbol === selectedStockValue ||
                            item?.symbol === selectedStockValue
                        );
                        sellable = parseFloat(stockData?.SellAble || stockData?.sellAble || 0);
                    }

                    setMaxSell(sellable);
                }
            } catch (e) {
                console.error("Error parsing sell able response", e);
            }
        };


        const buyPowerKey = `getBuyPower_${accountNo}`;
        const sellAbleKey = `getSellAble_${accountNo}`;

        subscribeTradingResponse(buyPowerKey, handleBuyPowerResponse);
        subscribeTradingResponse(sellAbleKey, handleSellAbleResponse);

        return () => {
            unsubscribeTradingResponse(buyPowerKey, handleBuyPowerResponse);
            unsubscribeTradingResponse(sellAbleKey, handleSellAbleResponse);
        };
    }, [accountNo, selectedStockValue, realtimeData.matchPrice, realtimeData.ref]);


    useEffect(() => {
        if (buyingPower > 0 && (realtimeData.matchPrice > 0 || realtimeData.ref > 0)) {
            const price = realtimeData.matchPrice > 0 ? realtimeData.matchPrice : realtimeData.ref;
            const calculatedMaxBuy = Math.floor(buyingPower / price);
            setMaxBuy(calculatedMaxBuy);
        }
    }, [buyingPower, realtimeData.matchPrice, realtimeData.ref]);

    const highlightText = (text, highlight) => {
        if (!text) return "";
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return parts.map((part, i) =>
            part.toUpperCase() === highlight.toUpperCase() ?
                <span key={i} style={{color: '#ff4d4f'}}>{part}</span> : part
        );
    };

    if (!isOpen) return null;

    return (
        <div className="quick-order-overlay" onClick={onClose}>
            <div className="quick-order-container" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn-x" onClick={onClose}>×</button>


                <div className="panel-left">

                    <div className="panel-header left-header">
                        <div className="tabs-group">
                            <button
                                className={`tab-btn ${activeTab === 'normal' ? 'active' : ''}`}
                                onClick={() => setActiveTab('normal')}
                            >
                                Lệnh thường
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'conditional' ? 'active' : ''}`}
                                onClick={() => setActiveTab('conditional')}
                            >
                                Lệnh điều kiện
                            </button>
                        </div>
                        <div className="actions-group">
                            <button
                                className={`action-btn buy-btn ${side === 'B' ? 'active' : ''}`}
                                onClick={() => setSide('B')}
                            >
                                MUA
                            </button>
                            <button
                                className={`action-btn sell-btn ${side === 'S' ? 'active' : ''}`}
                                onClick={() => setSide('S')}
                            >
                                BÁN
                            </button>
                        </div>
                    </div>


                    <div className="panel-body left-body">

                        <div className="account-section">
                            <div className="account-wrapper">
                                <select className="account-select">
                                    <option>004C000503</option>
                                </select>
                                <div className="account-code">YAWSMJTES2E6VM2ST0FT</div>
                            </div>

                            <div className="order-types">
                                <button
                                    className={`type-btn ${orderType === '01' ? 'active' : ''}`}
                                    onClick={() => setOrderType('01')}
                                >
                                    01
                                </button>
                                <button
                                    className={`type-btn ${orderType === '06' ? 'active' : ''}`}
                                    onClick={() => setOrderType('06')}
                                >
                                    06
                                </button>
                                <button
                                    className={`type-btn ${orderType === '67' ? 'active' : ''}`}
                                    onClick={() => setOrderType('67')}
                                >
                                    67
                                </button>
                            </div>

                            <div className="buying-power-mini">
                                Sức mua: <span>15,513,585</span>
                            </div>
                        </div>


                        <div className="input-section" style={{position: 'relative'}}>
                            <input
                                type="text"
                                placeholder="Hãy nhập mã chứng khoán"
                                className="input-field"
                                value={selectedStockValue}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    setSelectedStockValue(val);
                                    setStockSearchQuery(val);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            {showSuggestions && stockSearchQuery && (
                                <div className="quick-search-suggestions">
                                    {((allStocks && allStocks.length > 0) ? allStocks : (MOCK_DATA || []))
                                        .filter((s) => {
                                            if (!s) return false;
                                            const query = stockSearchQuery.toUpperCase();
                                            const symbol = s.symbol ? s.symbol.toUpperCase() : "";
                                            const name = s.name ? s.name.toUpperCase() : "";
                                            return symbol.includes(query) || name.includes(query);
                                        })
                                        .slice(0, 100)
                                        .map((item, idx) => {
                                            const symbol = item.symbol || "";
                                            const name = item.name || "";
                                            const board = item.board || "";
                                            const query = stockSearchQuery.toUpperCase();

                                            return (
                                                <div
                                                    key={`${symbol}-${idx}`}
                                                    className="suggestion-item"
                                                    onMouseDown={(ev) => {
                                                        ev.preventDefault();
                                                        setSelectedStockValue(symbol);
                                                        setStockSearchQuery("");
                                                        setShowSuggestions(false);
                                                        fetchAccountData(symbol);
                                                    }}
                                                >
                                                    <span style={{color: '#fff', minWidth: '40px'}}>{board}</span>
                                                    <span style={{color: '#666'}}> - </span>
                                                    <span style={{fontWeight: 'bold', minWidth: '50px'}}>{highlightText(symbol, query)}</span>
                                                    {name && (
                                                        <>
                                                            <span style={{color: '#666'}}> - </span>
                                                            <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                                                {highlightText(name, query)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                            <input type="text" placeholder="Giá x 1 VND" className="input-field" />
                            <input type="text" placeholder="Khối lượng" className="input-field" />
                        </div>

                        <div className="price-info-section">
                            <div className="info-row">
                                <div className="info-item">
                                    <span className="info-label">Trần</span>
                                    <span className="info-value ceiling">{realtimeData.ceiling > 0 ? realtimeData.ceiling.toLocaleString() : '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Sàn</span>
                                    <span className="info-value floor">{realtimeData.floor > 0 ? realtimeData.floor.toLocaleString() : '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">TC</span>
                                    <span className="info-value ref">{realtimeData.ref > 0 ? realtimeData.ref.toLocaleString() : '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Khớp</span>
                                    <span className="info-value match">{realtimeData.matchPrice > 0 ? realtimeData.matchPrice.toLocaleString() : '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Room NN</span>
                                    <span className="info-value foreign">{realtimeData.foreignRoom !== 0 ? realtimeData.foreignRoom.toLocaleString() : '-'}</span>
                                </div>
                                <div className="info-row right">
                                    <span>Tổng giá trị</span>
                                </div>
                            </div>

                            <div className="total-value">0</div>
                        </div>


                        <div className="max-section">
                            <div className="max-item">
                                <span>Mua tối đa:</span>
                                <span className="max-value">{maxBuy > 0 ? maxBuy.toLocaleString() : '0'}</span>
                            </div>
                            <div className="max-item">
                                <span>Bán tối đa:</span>
                                <span className="max-value">{maxSell > 0 ? maxSell.toLocaleString() : '0'}</span>
                            </div>
                        </div>


                        <div className="action-buttons-container">
                            <button className={`group-btn ${side}`}>
                                Nhóm lệnh/Chẻ lệnh{selectedStockValue ? `: ${selectedStockValue}` : ''}
                                <TbCaretUpFilled />
                            </button>
                            <button className={`submit-btn ${side === 'B' ? 'buy' : 'sell'}`}>
                                {side === 'B' ? 'Đặt lệnh mua' : 'Đặt lệnh bán'}{selectedStockValue ? `: ${selectedStockValue}` : ''}
                            </button>
                        </div>
                    </div>
                </div>


                <div className="panel-right">

                    <div className="panel-header right-header">
                        <div className="right-tabs-group">
                            <button
                                className={`right-tab-btn ${rightTab === 'so_lenh' ? 'active' : ''}`}
                                onClick={() => setRightTab('so_lenh')}
                            >
                                Số lệnh ⟳
                            </button>
                            <button
                                className={`right-tab-btn ${rightTab === 'suc_mua' ? 'active' : ''}`}
                                onClick={() => setRightTab('suc_mua')}
                            >
                                Sức mua ⟳
                            </button>
                            <button
                                className={`right-tab-btn ${rightTab === 'ck_so_huu' ? 'active' : ''}`}
                                onClick={() => setRightTab('ck_so_huu')}
                            >
                                CK sở hữu ⟳
                            </button>
                        </div>
                        <div className="header-stats">
                            GT khớp MUA: 0 &nbsp; GT khớp BÁN: 0
                        </div>
                    </div>


                    <div className="panel-body right-body">
                        {rightTab === 'suc_mua' && (
                            <div className="purchasing-power-table">
                                <div className="pp-row">
                                    <span className="pp-label">Sức mua</span>
                                    <span className="pp-value">15,513,585</span>
                                </div>
                                <div className="pp-row">
                                    <span className="pp-label">Tổng tiền mặt có thể rút</span>
                                    <span className="pp-value">15,513,585</span>
                                </div>
                                <div className="pp-row">
                                    <span className="pp-label">Tiền bán chờ về khả dụng</span>
                                    <span className="pp-value">0</span>
                                </div>
                                <div className="pp-row">
                                    <span className="pp-label">Tổng tiền phong tỏa</span>
                                    <span className="pp-value">0</span>
                                </div>
                                <div className="pp-row">
                                    <span className="pp-label">Tổng tiền tạm giữ</span>
                                    <span className="pp-value">7,840</span>
                                </div>
                            </div>
                        )}

                        {rightTab === 'so_lenh' && (
                            <div className="orders-tab-content">
                                <div className="filter-bar">
                                    <button className="cancel-btn">Hủy lệnh chọn</button>
                                    <input type="text" placeholder="Nhập mã CK" className="stock-filter-input" />

                                    <div className="filter-checkbox-group">
                                        <label><input type="checkbox" /> Lệnh chờ khớp (0)</label>
                                        <label><input type="checkbox" /> Khớp toàn bộ (0)</label>
                                        <label><input type="checkbox" /> Khớp một phần (0)</label>
                                    </div>

                                    <label className="sub-account-check">
                                        <input type="checkbox" defaultChecked /> Tất cả tiểu khoản
                                    </label>

                                    <div className="history-link">
                                        📄 Lịch sử lệnh
                                    </div>
                                </div>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th className="checkbox-col"><input type="checkbox" /></th>
                                                <th>Giao dịch</th>
                                                <th>TK</th>
                                                <th>CK</th>
                                                <th>Thời gian</th>
                                                <th>Giá đặt</th>
                                                <th>KL đặt</th>
                                                <th>KL khớp</th>
                                                <th>Giá khớp TB</th>
                                                <th>Giá trị khớp</th>
                                                <th>Trạng thái</th>
                                                <th>Loại lệnh</th>
                                            </tr>
                                        </thead>
                                        <tbody>

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {rightTab === 'ck_so_huu' && (
                            <div className="portfolio-tab-content">
                                <div className="table-container">
                                    <table className="data-table portfolio-table">
                                        <thead>
                                            <tr>
                                                <th>Mã CK</th>
                                                <th>Tổng SL</th>
                                                <th>SL khả dụng</th>
                                                <th>KL có thể bán</th>
                                                <th>Giá vốn</th>
                                                <th>Giá trị vốn</th>
                                                <th>Giá TT</th>
                                                <th>Giá trị TT</th>
                                                <th>Lãi/Lỗ</th>
                                                <th>% Lãi/lỗ</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="stock-code">FPT <span className="info-icon">i</span></td>
                                                <td className="text-right">526</td>
                                                <td className="text-right">400</td>
                                                <td className="text-right">400</td>
                                                <td className="text-right">96,376</td>
                                                <td className="text-right">50,693,776</td>
                                                <td className="text-right text-red">92,500</td>
                                                <td className="text-right">48,655,000</td>
                                                <td className="text-right text-red">-2,038,776</td>
                                                <td className="text-right text-red">-4.02%</td>
                                                <td className="text-center"><button className="sell-action-btn">Bán</button></td>
                                            </tr>
                                            <tr>
                                                <td className="stock-code">HPG <span className="info-icon">i</span></td>
                                                <td className="text-right">324</td>
                                                <td className="text-right">0</td>
                                                <td className="text-right">0</td>
                                                <td className="text-right">17,851</td>
                                                <td className="text-right">5,783,724</td>
                                                <td className="text-right text-green">26,900</td>
                                                <td className="text-right">8,715,600</td>
                                                <td className="text-right text-green">2,931,876</td>
                                                <td className="text-right text-green">50.69%</td>
                                                <td className="text-center"><button className="sell-action-btn disabled">Bán</button></td>
                                            </tr>
                                            <tr>
                                                <td className="stock-code">SSI <span className="info-icon">i</span></td>
                                                <td className="text-right">200</td>
                                                <td className="text-right">200</td>
                                                <td className="text-right">200</td>
                                                <td className="text-right">32,681</td>
                                                <td className="text-right">6,536,200</td>
                                                <td className="text-right text-green">30,750</td>
                                                <td className="text-right">6,150,000</td>
                                                <td className="text-right text-red">-386,200</td>
                                                <td className="text-right text-red">-5.91%</td>
                                                <td className="text-center"><button className="sell-action-btn">Bán</button></td>
                                            </tr>
                                            <tr>
                                                <td className="stock-code">VCB <span className="info-icon">i</span></td>
                                                <td className="text-right">237</td>
                                                <td className="text-right">237</td>
                                                <td className="text-right">237</td>
                                                <td className="text-right">48,998</td>
                                                <td className="text-right">11,612,526</td>
                                                <td className="text-right text-yellow">57,100</td>
                                                <td className="text-right">13,532,700</td>
                                                <td className="text-right text-green">1,920,174</td>
                                                <td className="text-right text-green">16.54%</td>
                                                <td className="text-center"><button className="sell-action-btn">Bán</button></td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="total-row">
                                                <td>Tổng SL</td>
                                                <td className="text-right">61,617</td>
                                                <td className="text-right">60,937</td>
                                                <td></td>
                                                <td></td>
                                                <td className="text-right">966,234,546</td>
                                                <td></td>
                                                <td className="text-right">1,071,701,300</td>
                                                <td className="text-right text-green">105,466,754</td>
                                                <td className="text-right text-green">10.92%</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickOrder;
