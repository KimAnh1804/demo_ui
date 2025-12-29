import React, {useState} from 'react';
import './QuickOrder.scss';

const QuickOrder = ({isOpen, onClose, selectedStock}) => {
    const [activeTab, setActiveTab] = useState('normal');
    const [rightTab, setRightTab] = useState('suc_mua');
    const [orderType, setOrderType] = useState('01');
    const [side, setSide] = useState('B');

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


                        <div className="input-section">
                            <input type="text" placeholder="Hãy nhập mã chứng khoán" className="input-field" defaultValue={selectedStock || ''} />
                            <input type="text" placeholder="Giá x 1 VND" className="input-field" />
                            <input type="text" placeholder="Khối lượng" className="input-field" />
                        </div>

                        <div className="price-info-section">
                            <div className="info-row">
                                <span>Trần</span>
                                <span>Sàn</span>
                                <span>TC</span>
                                <span>Khớp</span>
                                <span>Room NN</span>
                                <div className="info-row right">
                                    <span>Tổng giá trị</span>
                                </div>
                            </div>

                            <div className="total-value">0</div>
                        </div>


                        <div className="max-section">
                            <div className="max-item">
                                <span>Mua tối đa:</span>
                                <span className="max-value">0</span>
                            </div>
                            <div className="max-item">
                                <span>Bán tối đa:</span>
                                <span className="max-value">0</span>
                            </div>
                        </div>


                        <div className="action-buttons-container">
                            <button className={`group-btn ${side}`}>Nhóm lệnh/Chẻ lệnh</button>
                            <button className={`submit-btn ${side === 'B' ? 'buy' : 'sell'}`}>
                                {side === 'B' ? 'Đặt lệnh mua' : 'Đặt lệnh bán'}
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
