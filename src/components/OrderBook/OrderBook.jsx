import React, {useState} from 'react';
import './OrderBook.scss';

const OrderBook = ({isOpen, onClose}) => {
    const [activeTab, setActiveTab] = useState('pending'); // pending, matched, canceled


    const pendingOrders = [
        {id: '001', symbol: 'VNM', side: 'B', price: 83500, quantity: 1000, matched: 0, time: '10:24:15', status: 'Chờ khớp'},
        {id: '002', symbol: 'VCB', side: 'S', price: 96500, quantity: 500, matched: 0, time: '10:23:42', status: 'Chờ khớp'},
    ];

    const matchedOrders = [
        {id: '003', symbol: 'HPG', side: 'B', price: 26450, quantity: 2000, matched: 2000, time: '10:20:33', status: 'Đã khớp'},
        {id: '004', symbol: 'VIC', side: 'B', price: 41200, quantity: 1500, matched: 1500, time: '10:18:21', status: 'Đã khớp'},
    ];

    const canceledOrders = [
        {id: '005', symbol: 'MSN', side: 'S', price: 76200, quantity: 800, matched: 0, time: '10:15:44', status: 'Đã hủy'},
    ];

    const getOrdersByTab = () => {
        switch (activeTab) {
            case 'pending':
                return pendingOrders;
            case 'matched':
                return matchedOrders;
            case 'canceled':
                return canceledOrders;
            default:
                return [];
        }
    };

    const handleCancelOrder = (orderId) => {

        console.log('Cancel order:', orderId);
    };

    if (!isOpen) return null;


};

export default OrderBook;
