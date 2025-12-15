import React, {useState, useEffect} from "react";
import "./WatchlistModal.scss";

export default function WatchlistModal({isOpen, onClose, mode = "create", initialData, onConfirm}) {
  const [watchlistType, setWatchlistType] = useState("0");
  const [watchlistName, setWatchlistName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setWatchlistName(initialData.name);
        setWatchlistType(initialData.type || "0");
      } else if (mode === "create") {
        setWatchlistName("");
        setWatchlistType("0");
      }
      setError("");
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (mode === "delete") {
      onConfirm(initialData);
      onClose();
      return;
    }

    if (!watchlistName.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }

    onConfirm({...initialData, name: watchlistName, type: watchlistType});
    onClose();
  };

  const titles = {
    create: "Thêm mới danh mục theo dõi",
    edit: "Sửa tên danh mục",
    delete: "Xóa danh mục theo dõi",
  };

  return (
    <div className="watchlist-modal-overlay">
      <div className="watchlist-modal">
        {mode === "delete" && <div className="warning-icon">⚠️</div>}
        <h2 className="modal-title">{titles[mode]}</h2>

        {mode !== "delete" ? (
          <div className="modal-body">
            {mode === "create" && (
              <div className="form-group">
                <label className="form-label">Phân loại danh mục theo dõi</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="watchlistType"
                      value="0"
                      checked={watchlistType === "0"}
                      onChange={(e) => setWatchlistType(e.target.value)}
                    />
                    <span className="radio-label">Lô thường</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="watchlistType"
                      value="1"
                      checked={watchlistType === "1"}
                      onChange={(e) => setWatchlistType(e.target.value)}
                    />
                    <span className="radio-label">Lô lẻ</span>
                  </label>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{mode === "edit" ? "Tên muốn sửa" : "Tên danh mục theo dõi"}</label>
              <input
                type="text"
                className="form-input"
                value={watchlistName}
                onChange={(e) => {
                  setWatchlistName(e.target.value);
                  setError("");
                }}
              />
              {error && <span style={{color: "red", fontSize: "12px", marginTop: "4px", display: "block"}}>{error}</span>}
            </div>
          </div>
        ) : (
          <p className="modal-message">
            Bạn thực sự muốn xóa DMQT: {initialData?.name}?
          </p>
        )}

        <div className="modal-footer">
          <button className={`btn-submit ${mode === "delete" ? "btn-submit-warning" : ""}`} onClick={handleConfirm}>
            Đồng ý
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

