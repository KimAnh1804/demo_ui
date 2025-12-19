import React, { useState, useMemo } from "react";
import "./StockTable.scss";
import { formatVolume, formatPrice } from "../../utils/format";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ka from "../../assets/ka.svg";

const getPriceClass = (price, ref, ceiling, floor) => {
  if (!price || !ref) return "";
  if (price === ceiling) return "text-ceiling";
  if (price === floor) return "text-floor";
  if (price > ref) return "text-up";
  if (price < ref) return "text-down";
  return "text-ref";
};

const StockRow = React.memo(({ stock }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stock.symbol });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Khi đang drag thì làm mờ row đang được kéo đi một chút
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
    cursor: "auto",
  };

  const matchClass = getPriceClass(
    stock.match.price,
    stock.ref,
    stock.ceiling,
    stock.floor
  );

  return (
    <tr ref={setNodeRef} style={style}>
      {/* Drag Handle Column */}
      <td className="drag-handle-cell" {...attributes} {...listeners}>
        <img src={ka} alt="ka" />
      </td>

      <td className={`symbol-cell ${matchClass}`}>{stock.symbol}</td>
      <td className="text-ceiling">{formatPrice(stock.ceiling)}</td>
      <td className="text-floor">{formatPrice(stock.floor)}</td>
      <td className="text-ref">{formatPrice(stock.ref)}</td>

      {/* Dư mua */}
      <td
        className={getPriceClass(
          stock.bid?.p3,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.bid?.p3)}
      </td>
      <td>{formatVolume(stock.bid?.v3)}</td>
      <td
        className={getPriceClass(
          stock.bid?.p2,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.bid?.p2)}
      </td>
      <td>{formatVolume(stock.bid?.v2)}</td>
      <td
        className={getPriceClass(
          stock.bid?.p1,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.bid?.p1)}
      </td>
      <td>{formatVolume(stock.bid?.v1)}</td>

      {/* Khớp lệnh */}
      <td className={`match-cell ${matchClass}`}>
        {formatPrice(stock.match?.price)}
      </td>
      <td className={`match-cell ${matchClass}`}>
        {formatVolume(stock.match?.vol)}
      </td>
      <td className={`match-cell ${matchClass}`}>
        {formatPrice(stock.match?.change)}
      </td>
      <td className={`match-cell ${matchClass}`}>{stock.match?.percent}%</td>

      {/* Dư bán */}
      <td
        className={getPriceClass(
          stock.ask?.p1,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.ask?.p1)}
      </td>
      <td>{formatVolume(stock.ask?.v1)}</td>
      <td
        className={getPriceClass(
          stock.ask?.p2,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.ask?.p2)}
      </td>
      <td>{formatVolume(stock.ask?.v2)}</td>
      <td
        className={getPriceClass(
          stock.ask?.p3,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.ask?.p3)}
      </td>
      <td>{formatVolume(stock.ask?.v3)}</td>

      {/* Tổng KL */}
      <td>{formatVolume(stock.totalVol)}</td>

      {/* Giá */}
      <td
        className={getPriceClass(
          stock.prices?.avg,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.prices?.avg)}
      </td>
      <td
        className={getPriceClass(
          stock.prices?.low,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.prices?.low)}
      </td>
      <td
        className={getPriceClass(
          stock.prices?.high,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.prices?.high)}
      </td>
      <td
        className={getPriceClass(
          stock.prices?.open,
          stock.ref,
          stock.ceiling,
          stock.floor
        )}
      >
        {formatPrice(stock.prices?.open)}
      </td>

      {/* ĐTNN */}
      <td>{formatVolume(stock.foreign?.buy)}</td>
      <td>{formatVolume(stock.foreign?.sell)}</td>
    </tr>
  );
});

export default function StockTable({ data }) {
  const [stocks, setStocks] = useState([]);

  React.useEffect(() => {
    if (data) {
      setStocks(data);
    } else {
      setStocks([]);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stockIds = useMemo(() => stocks.map((s) => s.symbol), [stocks]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setStocks((items) => {
        const oldIndex = items.findIndex((item) => item.symbol === active.id);
        const newIndex = items.findIndex((item) => item.symbol === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="stock-table-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="stock-table">
          <thead>
            <tr className="header-row-1">
              <th rowSpan={2} style={{ width: "30px" }}></th>

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
              <th>Giá 3</th>
              <th>KL 3</th>
              <th>Giá 2</th>
              <th>KL 2</th>
              <th>Giá 1</th>
              <th>KL 1</th>

              <th>Giá</th>
              <th>KL</th>
              <th>+/-</th>
              <th>%</th>

              <th>Giá 1</th>
              <th>KL 1</th>
              <th>Giá 2</th>
              <th>KL 2</th>
              <th>Giá 3</th>
              <th>KL 3</th>

              <th>TB</th>
              <th>Thấp</th>
              <th>Cao</th>
              <th>Mở cửa</th>

              <th>Mua</th>
              <th>Bán</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={stockIds}
              strategy={verticalListSortingStrategy}
            >
              {stocks.map((stock) => (
                <StockRow key={stock.symbol} stock={stock} />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
