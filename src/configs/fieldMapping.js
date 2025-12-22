

export const FIELD_MAPPING = {
  // Thông tin cơ bản
  t55: 'symbol', // Mã chứng khoán
  t20004: 'board', // Sàn giao dịch (G1, G2, G3)
  t30001: 'market', // Loại thị trường (STO)
  t30624: 'isin', // Mã ISIN

  // Giá tham chiếu và biên độ
  t40002: 'referencePrice', // Giá tham chiếu
  t40003: 'priceChange', // Thay đổi giá (+/-)
  t30221: 'ceilingPrice', // Giá trần
  t30220: 'floorPrice', // Giá sàn

  // Giá khớp lệnh
  t31: 'matchPrice', // Giá khớp lệnh hiện tại
  t32: 'matchVolume', // Khối lượng khớp lệnh hiện tại

  // Giá trong ngày
  t30219: 'openPrice', // Giá mở cửa
  t333: 'highPrice', // Giá cao nhất
  t332: 'lowPrice', // Giá thấp nhất
  t30218: 'avgPrice', // Giá trung bình

  // Khối lượng
  t387: 'totalVolume', // Tổng khối lượng giao dịch
  t381: 'totalValue', // Tổng giá trị giao dịch

  // Thông tin chỉ số
  t30217: 'indexValue', // Giá trị chỉ số
  t30590: 'advanceCount', // Số mã tăng
  t30591: 'noChangeCount', // Số mã đứng giá
  t30592: 'declineCount', // Số mã giảm
  t30589: 'ceilingCount', // Số mã trần
  t30593: 'floorCount', // Số mã sàn

  // Nhà đầu tư nước ngoài
  t30223: 'foreignBuyVolume', // Khối lượng ĐTNN mua
  t30224: 'foreignSellVolume', // Khối lượng ĐTNN bán

  // Phiên giao dịch
  t336: 'sessionCode', // Mã phiên giao dịch
};

//Cấu trúc TPBID và TPOFFER (Order Book)

export const ORDER_BOOK_FIELDS = {
  t83: 'level', // Level (1, 2, 3)
  t269: 'side', // Phía ("0" = bid/mua, "1" = offer/bán)
  t270: 'price', // Giá
  t271: 'volume', // Khối lượng
  t290: 'position', // Vị trí (1, 2, 3)
  t346: 'reserved1', // Dự trữ
  t30271: 'reserved2', // Dự trữ
};


export const SESSION_CODES = {
  'O': 'Mở cửa',
  'ATO': 'Khớp lệnh mở cửa',
  'I': 'Liên tục',
  'ATC': 'Khớp lệnh đóng cửa',
  'C': 'Đóng cửa',
  'P': 'Tạm dừng',
  'H': 'Nghỉ trưa',
};

export default {
  FIELD_MAPPING,
  ORDER_BOOK_FIELDS,
  SESSION_CODES,
};
