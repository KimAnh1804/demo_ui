// functions for formatting numbers (KL, GT, ..)

export function formatVolume(volume) {
  // Không có dữ liệu thì hiển thị rỗng
  if (volume === undefined || volume === null) return "";
  return Number(volume).toLocaleString("vi-VN");
}

export function formatValueBillion(value) {
  if (value === undefined || value === null) return ""; 

  return (Number(value) / 1_000_000_000).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPrice(price) {
  if (price === undefined || price === null) return "";
  return Number(price).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
