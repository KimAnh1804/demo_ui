// functions for formatting numbers (KL, GT, ..)

export function formatVolume(volume) {
  if (volume === undefined || volume === null) return "0";
  return Number(volume).toLocaleString("vi-VN");
}

export function formatValueBillion(value) {
  if (value === undefined || value === null) return "0,00";
  return (Number(value) / 1_000_000_000).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
