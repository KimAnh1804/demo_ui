import React, {useState} from 'react';
import './QuickOrder.scss';

const QuickOrder = ({isOpen, onClose, selectedStock}) => {
    const [activeTab, setActiveTab] = useState('normal');
    const [orderType, setOrderType] = useState('01');
    const [side, setSide] = useState('B');

    if (!isOpen) return null;

    return (
        <div className="quick-order-overlay" onClick={onClose}>
            <div className="quick-order-container" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn-x" onClick={onClose}>×</button>

                {/* Header - Tabs and Buttons */}
                <div className="top-section">
                    <div className="tabs-and-actions">
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
                        <button className="extra-btn">Sổ lệnh ⟳</button>
                        <button className="extra-btn">Sức mua ⟳</button>
                        <button className="extra-btn">CK sở hữu ⟳</button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="order-content">
                    {/* Account & Order Types */}
                    <div className="account-section">
                        <div className="account-wrapper">
                            <select className="account-select">
                                <option>004C000503</option>
                            </select>
                            <div className="account-code">YAWSMJTES2E6VM2ST0FT</div>
                        </div>

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
                        <div className="buying-power-display">
                            Sức mua: <span>15,513,585</span>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="input-section">
                        <input type="text" placeholder="Hãy nhập mã chứng khoán" className="input-field" />
                        <input type="text" placeholder="Giá x 1 VND" className="input-field" />
                        <input type="text" placeholder="Khối lượng" className="input-field" />
                    </div>

                    {/* Price Info */}
                    <div className="price-info-section">
                        <div className="info-labels">
                            <span>Trần</span>
                            <span>Sàn</span>
                            <span>TC</span>
                            <span>Khớp</span>
                            <span>Room NN</span>
                            <span className="total-label">Tổng giá trị</span>
                        </div>
                        <div className="total-value">0</div>
                    </div>

                    {/* Max Section */}
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

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button className="group-btn">Nhóm lệnh/Chẻ lệnh</button>
                        <button className={`submit-btn ${side === 'B' ? 'buy' : 'sell'}`}>
                            {side === 'B' ? 'Đặt lệnh mua' : 'Đặt lệnh bán'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickOrder;
