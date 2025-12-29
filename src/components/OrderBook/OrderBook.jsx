import React, {useState} from 'react';
import './OrderBook.scss';
import {PiNotebookFill} from "react-icons/pi";

const OrderBook = ({isOpen, onClose}) => {

    if (!isOpen) return null;

    return (
        <div className="order-book-overlay" onClick={onClose}>
            <div className="order-book-container" onClick={(e) => e.stopPropagation()}>
                <div className="ob-header">
                    <h2>SỔ LỆNH</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="ob-body">

                    <div className="ob-filter-bar">
                        <div className="filter-left">
                            <button className="ob-btn cancel-selected">Hủy lệnh chọn</button>
                            <input type="text" className="ob-input stock-input" placeholder="Nhập mã CK" />

                            <label className="ob-checkbox-wrapper">
                                <input type="checkbox" />
                                <span>Lệnh chờ khớp (0)</span>
                            </label>
                            <label className="ob-checkbox-wrapper">
                                <input type="checkbox" />
                                <span>Khớp toàn bộ (0)</span>
                            </label>
                            <label className="ob-checkbox-wrapper">
                                <input type="checkbox" />
                                <span>Khớp một phần (0)</span>
                            </label>

                            <label className="ob-checkbox-wrapper highlight">
                                <input type="checkbox" defaultChecked />
                                <span>Tất cả tiểu khoản</span>
                            </label>

                            <a href="#" className="history-link">
                                <span className="icon"><PiNotebookFill /></span>
                                Lịch sử lệnh
                            </a>
                        </div>

                        <div className="filter-right">
                            <span className="stats-text">
                                GT khớp MUA: <span className="val">0</span> GT khớp BÁN: <span className="val">0</span>
                            </span>
                        </div>
                    </div>


                    <div className="ob-table-container">
                        <table className="ob-table">
                            <thead>
                                <tr>
                                    <th className="th-checkbox"><input type="checkbox" /></th>
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

                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderBook;
