import React, {useState, useEffect} from "react";
import {MdAddBox} from "react-icons/md";
import {FaCaretDown, FaPlusCircle} from "react-icons/fa";
import WatchlistModal from "../WatchlistModal/WatchlistModal";
import "./TopMenu.scss";
import {PiNotePencilLight} from "react-icons/pi";
import {AiOutlineDelete} from "react-icons/ai";
import {
  sendCreateWatchlist,
  sendUpdateWatchlist,
  sendDeleteWatchlist,
  subscribeTradingResponse,
  unsubscribeTradingResponse,
} from "../../services/socketTrading";

const MENU_ITEMS = [
  {
    title: "DM theo dõi",
    hasDropdown: true,
    items: [],
  },
  {
    title: "VN30",
    active: true,
    hasDropdown: true,
    items: [
      {text: "HOSE"},
      {text: "VN30", active: true},
      {text: "Giao dịch thỏa thuận"},
      {text: "Lô lẻ HOSE"},
    ],
  },
  {
    title: "HNX",
    hasDropdown: true,
    items: [
      {text: "HNX"},
      {text: "HNX30"},
      {text: "Giao dịch thỏa thuận"},
      {text: "Lô lẻ HNX"},
    ],
  },
  {
    title: "UPCOM",
    hasDropdown: true,
    items: [
      {text: "UPCOM"},
      {text: "Giao dịch thỏa thuận"},
      {text: "Lô lẻ UPCOM"},
    ],
  },
  {
    title: "Nhóm ngành",
    hasDropdown: true,
    items: [
      {text: "Sản xuất Nông-Lâm-Ngư nghiệp"},
      {text: "Khai khoáng"},
      {text: "Tiện ích cộng đồng"},
      {text: "Xây dựng và bất động sản"},
      {text: "Sản xuất"},
      {text: "Vận tải và kho bãi"},
      {text: "Công nghệ-Truyền thông"},
      {text: "Tài chính và bảo hiểm"},
      {text: "Thuê và cho thuê"},
      {text: "Dịch vụ chuyên môn-Khoa học-Kỹ thuật"},
      {text: "Dịch vụ hỗ trợ-Dịch vụ xử lý và tái chế rác thải"},
      {text: "Giáo dục và đào tạo"},
      {text: "Dịch vụ chăm sóc sức khỏe"},
      {text: "Nghệ thuật và dịch vụ giải trí"},
      {text: "Dịch vụ lưu trú và ăn uống"},
      {text: "Hành chính công"},
      {text: "Dịch vụ khác"},
      {text: "Bán buôn"},
      {text: "Bán lẻ"},
    ],
  },
];

const TopMenu = ({onLogout}) => {
  const [modalMode, setModalMode] = useState("create");
  const [showModal, setShowModal] = useState(false);
  const [watchlists, setWatchlists] = useState(() => {
    // Load từ localStorage khi khởi tạo
    const saved = localStorage.getItem('watchlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);

  // Lưu vào localStorage mỗi khi watchlists thay đổi
  useEffect(() => {
    localStorage.setItem('watchlists', JSON.stringify(watchlists));
  }, [watchlists]);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedWatchlist(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (watchlist) => {
    setModalMode("edit");
    setSelectedWatchlist(watchlist);
    setShowModal(true);
  };

  const handleOpenDeleteModal = (watchlist) => {
    setModalMode("delete");
    setSelectedWatchlist(watchlist);
    setShowModal(true);
  };

  const handleConfirmAction = (data) => {
    if (modalMode === "create") {
      const clientSeq = sendCreateWatchlist(data.name, data.type);
      subscribeTradingResponse(`SEQ_${clientSeq}`, (response) => {
        if (response.Result === "1") {
          const newWatchlist = {
            id: Date.now(),
            name: data.name,
            type: data.type,
          };
          setWatchlists([...watchlists, newWatchlist]);
          setShowModal(false);
        } else {
          console.error(`Lỗi: ${response.Message || "Không thể tạo danh mục"}`);
        }
        unsubscribeTradingResponse(`SEQ_${clientSeq}`);
      });
    } else if (modalMode === "edit") {
      const clientSeq = sendUpdateWatchlist(selectedWatchlist.id, data.name, data.type);
      subscribeTradingResponse(`SEQ_${clientSeq}`, (response) => {
        if (response.Result === "1") {
          setWatchlists(watchlists.map((w) =>
            w.id === selectedWatchlist.id ? {...w, name: data.name, type: data.type} : w
          ));
          setShowModal(false);
        } else {
          console.error(`Lỗi: ${response.Message || "Không thể cập nhật danh mục"}`);
        }
        unsubscribeTradingResponse(`SEQ_${clientSeq}`);
      });
    } else if (modalMode === "delete") {
      const clientSeq = sendDeleteWatchlist(selectedWatchlist.id);
      subscribeTradingResponse(`SEQ_${clientSeq}`, (response) => {
        if (response.Result === "1") {
          setWatchlists(watchlists.filter((w) => w.id !== selectedWatchlist.id));
          setShowModal(false);
        } else {
          console.error(`Lỗi: ${response.Message || "Không thể xóa danh mục"}`);
        }
        unsubscribeTradingResponse(`SEQ_${clientSeq}`);
      });
    }
  };

  return (
    <div className="top-menu-container">
      <div className="top-menu-left">
        <div className="search-box">
          <input type="text" placeholder="Nhập mã CK" />
          <MdAddBox
            className="search-icon"
            style={{
              position: "absolute",
              right: "0px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#007bff",
              width: "40px",
              height: "40px",
            }}
          />
        </div>
        <button className="menu-btn primary">Giao dịch</button>
        <button className="menu-btn">Cơ bản</button>
      </div>

      <div className="top-menu-center">
        <div className="nav-links">
          {MENU_ITEMS.map((menu, index) => (
            <div key={index} className="nav-item-dropdown">
              <a className={`nav-link ${menu.active ? "active" : ""}`}>
                {menu.title} {menu.hasDropdown && <FaCaretDown />}
              </a>
              {menu.hasDropdown && (
                <div className="dropdown-menu">
                  {menu.title === "DM theo dõi" ? (
                    <>
                      <div
                        className="dropdown-item"
                        onClick={handleOpenCreateModal}
                      >
                        <span className="item-icon">
                          <FaPlusCircle />
                        </span>
                        <span className="item-text">Tạo danh mục mới</span>
                      </div>
                      {watchlists.map((watchlist) => (
                        <div
                          key={watchlist.id}
                          className="dropdown-item watchlist-item"
                        >
                          <span className="item-text">{watchlist.name}</span>
                          <div className="watchlist-actions">
                            <button
                              className="edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(watchlist);
                              }}
                            >
                              <PiNotePencilLight />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteModal(watchlist);
                              }}
                            >
                              <AiOutlineDelete />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    menu.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={`dropdown-item ${item.active ? "active" : ""
                          }`}
                      >
                        {item.icon && (
                          <span className="item-icon">{item.icon}</span>
                        )}
                        <span className="item-text">{item.text}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}

          <a className="nav-link">Phái sinh</a>
          <a className="nav-link">Chứng quyền</a>
          <a className="nav-link">ETF HOSE</a>
          <a className="nav-link">Trái phiếu doanh nghiệp</a>
        </div>
      </div>

      <div className="top-menu-right">
        <button className="logout-link" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>

      <WatchlistModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        mode={modalMode}
        initialData={selectedWatchlist}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default TopMenu;

