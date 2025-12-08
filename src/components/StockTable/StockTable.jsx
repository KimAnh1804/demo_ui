import React, {useState} from "react";
import "./StockTable.scss";
import {formatVolume, formatPrice} from "../../utils/format";
import {MOCK_DATA} from "../../data/mockStockData";

// Xác định màu sắc của giá
const getPriceClass = (price, ref, ceiling, floor) => {
    if (!price || !ref) return ""; // Kh có giá hoặc giá tham chiếu
    if (price === ceiling) return "text-ceiling"; // Giá bằng trần trả về màu cam
    if (price === floor) return "text-floor"; // Giá bằng sàn trả về màu cam
    if (price > ref) return "text-up"; // Giá tăng trả về màu xanh
    if (price < ref) return "text-down"; // Giá giảm trả về màu đỏ
    return "text-ref";
};


const StockRow = React.memo(({stock}) => {
    const matchClass = getPriceClass(stock.match.price, stock.ref, stock.ceiling, stock.floor);

    return (
        <tr>
            <td className={`symbol-cell ${matchClass}`}>{stock.symbol}</td>
            <td className="text-ceiling">{formatPrice(stock.ceiling)}</td>
            <td className="text-floor">{formatPrice(stock.floor)}</td>
            <td className="text-ref">{formatPrice(stock.ref)}</td>

            {/* Dư mua */}
            <td className={getPriceClass(stock.bid.p3, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.bid.p3)}</td>
            <td>{formatVolume(stock.bid.v3)}</td>
            <td className={getPriceClass(stock.bid.p2, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.bid.p2)}</td>
            <td>{formatVolume(stock.bid.v2)}</td>
            <td className={getPriceClass(stock.bid.p1, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.bid.p1)}</td>
            <td>{formatVolume(stock.bid.v1)}</td>

            {/* Khớp lệnh */}
            <td className={`match-cell ${matchClass}`}>{formatPrice(stock.match.price)}</td>
            <td className={`match-cell ${matchClass}`}>{formatVolume(stock.match.vol)}</td>
            <td className={`match-cell ${matchClass}`}>{formatPrice(stock.match.change)}</td>
            <td className={`match-cell ${matchClass}`}>{stock.match.percent}%</td>

            {/* Dư bán */}
            <td className={getPriceClass(stock.ask.p1, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.ask.p1)}</td>
            <td>{formatVolume(stock.ask.v1)}</td>
            <td className={getPriceClass(stock.ask.p2, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.ask.p2)}</td>
            <td>{formatVolume(stock.ask.v2)}</td>
            <td className={getPriceClass(stock.ask.p3, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.ask.p3)}</td>
            <td>{formatVolume(stock.ask.v3)}</td>

            {/* Tổng KL */}
            <td>{formatVolume(stock.totalVol)}</td>

            {/* Giá */}
            <td className={getPriceClass(stock.prices.avg, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.prices.avg)}</td>
            <td className={getPriceClass(stock.prices.low, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.prices.low)}</td>
            <td className={getPriceClass(stock.prices.high, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.prices.high)}</td>
            <td className={getPriceClass(stock.prices.open, stock.ref, stock.ceiling, stock.floor)}>{formatPrice(stock.prices.open)}</td>

            {/* ĐTNN */}
            <td>{formatVolume(stock.foreign.buy)}</td>
            <td>{formatVolume(stock.foreign.sell)}</td>
        </tr>
    );
});

export default function StockTable() {
    const [stocks, setStocks] = useState(MOCK_DATA);

    return (
        <div className="stock-table-container">
            <table className="stock-table">
                <thead>
                    <tr className="header-row-1">
                        <th rowSpan={2}>Mã CK</th>
                        <th rowSpan={2}>Trần</th>
                        <th rowSpan={2}>Sàn</th>
                        <th rowSpan={2}>TC</th>
                        <th colSpan={6}>Thông tin dư mua</th>
                        <th colSpan={4}>Khớp lệnh</th>
                        <th colSpan={6}>Thông tin dư bán</th>
                        <th rowSpan={2}>Tổng KL</th>
                        <th colSpan={4}>Giá</th>
                        <th colSpan={2}>Nhà ĐTNN</th>
                    </tr>
                    <tr className="header-row-2">
                        {/* Dư mua */}
                        <th>Giá 3</th>
                        <th>KL 3</th>
                        <th>Giá 2</th>
                        <th>KL 2</th>
                        <th>Giá 1</th>
                        <th>KL 1</th>

                        {/* Khớp lệnh */}
                        <th>Giá</th>
                        <th>KL</th>
                        <th>+/-</th>
                        <th>%</th>

                        {/* Dư bán */}
                        <th>Giá 1</th>
                        <th>KL 1</th>
                        <th>Giá 2</th>
                        <th>KL 2</th>
                        <th>Giá 3</th>
                        <th>KL 3</th>

                        {/* Giá */}
                        <th>TB</th>
                        <th>Thấp</th>
                        <th>Cao</th>
                        <th>Mở cửa</th>

                        {/* ĐTNN */}
                        <th>Mua</th>
                        <th>Bán</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.map((stock) => (
                        <StockRow key={stock.symbol} stock={stock} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
