import React, {useState, useEffect} from "react";
import {MdAddBox} from "react-icons/md";
import {FaCaretDown, FaPlusCircle} from "react-icons/fa";
import WatchlistModal from "../WatchlistModal/WatchlistModal";
import "./TopMenu.scss";
import {MOCK_DATA} from "../../data/mockStockData";
import {PiNotePencilLight} from "react-icons/pi";
import {AiOutlineDelete} from "react-icons/ai";
import {IoAlertCircle} from "react-icons/io5";
import {
  sendCreateWatchlist,
  sendUpdateWatchlist,
  sendDeleteWatchlist,
  subscribeTradingResponse,
  unsubscribeTradingResponse,
  sendRealtimeWatchlist,
  sendFinanceInfoRequest,
} from "../../services/socketTrading";

const normalizeResponse = (resp) => {
  try {
    if (resp && typeof resp.Data === "string") {
      return {...resp, Data: JSON.parse(resp.Data)};
    }
  } catch (e) { }
  return resp;
};

const extractSymbols = (resp) => {
  const data = resp?.Data || resp?.InVal || resp?.OutVal || resp;
  if (!Array.isArray(data)) return [];

  return data.map(it =>
    it?.SecCode || it?.code || it?.symbol || it?.c0 || it?.[0] || it
  ).filter(s => typeof s === 'string').map(s => s.trim());
};

const createEmptyStock = (sym) => ({
  symbol: sym,
  ref: 0, ceiling: 0, floor: 0,
  bid: {p1: 0, v1: 0, p2: 0, v2: 0, p3: 0, v3: 0},
  ask: {p1: 0, v1: 0, p2: 0, v2: 0, p3: 0, v3: 0},
  match: {price: 0, vol: 0, change: 0, percent: 0},
  totalVol: 0,
  prices: {avg: 0, high: 0, low: 0, open: 0},
  foreign: {buy: 0, sell: 0},
});

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

const TopMenu = ({user, onLogout, onWatchlistSelect, onAddStock}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [watchlists, setWatchlists] = useState(() => {
    // Load từ localStorage khi khởi tạo
    const saved = localStorage.getItem("watchlists");
    return saved ? JSON.parse(saved) : [];
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [currentSelectedWatchlistId, setCurrentSelectedWatchlistId] =
    useState(null);
  const [currentSelectedWatchlistName, setCurrentSelectedWatchlistName] =
    useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [selectedGroupTitle, setSelectedGroupTitle] = useState("");
  const lastGroupTableRef = React.useRef([]);
  const groupServiceUnsubRef = React.useRef(null);

  const handleFinanceGroupClick = (groupName) => {
    if (typeof sendFinanceInfoRequest !== "function") return;

    const clientSeq = sendFinanceInfoRequest();

    const seqHandler = (rawResp) => {
      try {
        const resp = normalizeResponse(rawResp);
        const symbols = extractSymbols(resp);
        const tableData = symbols.map(createEmptyStock);

        lastGroupTableRef.current = tableData;
        setCurrentSelectedWatchlistId(groupName);
        setCurrentSelectedWatchlistName(groupName);
        setSelectedGroupTitle(groupName);

        if (typeof onWatchlistSelect === "function")
          onWatchlistSelect(tableData, groupName);
      } catch (e) {
        console.error("Error handling finance info SEQ response", e);
      } finally {
        unsubscribeTradingResponse(`SEQ_${clientSeq}`, seqHandler);
      }
    };

    subscribeTradingResponse(`SEQ_${clientSeq}`, seqHandler);

    if (groupServiceUnsubRef.current) {
      groupServiceUnsubRef.current();
      groupServiceUnsubRef.current = null;
    }

    const serviceName = "FOSqMkt02Vs_FinanceInfo";
    const realtimeHandler = (data) => {
      try {
        const resp = normalizeResponse(data);
        const payloads = Array.isArray(resp?.Data) ? resp.Data : [resp];
        let updated = [...(lastGroupTableRef.current || [])];

        payloads.forEach((p) => {
          const sym = p.SecCode || p.code || p.symbol || p?.InVal?.[0] || p?.OutVal?.[0];
          if (!sym) return;

          const idx = updated.findIndex((r) => r.symbol === sym);
          const newValues = {};
          if (p.t30217 !== undefined) newValues.match = {...(updated[idx]?.match || {}), price: parseFloat(p.t30217)};
          if (p.t40003 !== undefined) newValues.match = {...(newValues.match || updated[idx]?.match || {}), change: parseFloat(p.t40003)};
          if (p.t387 !== undefined) newValues.totalVol = parseFloat(p.t387);

          if (idx > -1) {
            updated[idx] = {...updated[idx], ...newValues};
          } else {
            updated.push({symbol: sym, ...newValues});
          }
        });

        lastGroupTableRef.current = updated;
        if (typeof onWatchlistSelect === "function")
          onWatchlistSelect(updated, groupName);
      } catch (e) {
        console.error("Error handling finance realtime", e);
      }
    };

    groupServiceUnsubRef.current = subscribeTradingResponse(
      serviceName,
      realtimeHandler
    );
  };

  // Lưu vào localStorage mỗi khi watchlists thay đổi
  useEffect(() => {
    localStorage.setItem("watchlists", JSON.stringify(watchlists));
  }, [watchlists]);

  const handleCreateWatchlist = (watchlistData) => {
    const clientSeq = sendCreateWatchlist(
      watchlistData.name,
      watchlistData.type
    );

    // Lắng nghe RES_MSG
    subscribeTradingResponse(`SEQ_${clientSeq}`, (response) => {
      if (response.Result === "1") {
        // Thành công, thêm vào danh sách
        const newWatchlist = {
          id: Date.now(),
          name: watchlistData.name,
          type: watchlistData.type,
        };
        setWatchlists([...watchlists, newWatchlist]);
        setShowCreateModal(false);
      } else {
        alert(`Lỗi: ${response.Message || "Không thể tạo danh mục"}`);
      }

      unsubscribeTradingResponse(`SEQ_${clientSeq}`);
    });
  };

  const handleEditWatchlist = (watchlist) => {
    setSelectedWatchlist(watchlist);
    setShowEditModal(true);
  };

  const handleUpdateWatchlist = (updatedData) => {
    const clientSeq = sendUpdateWatchlist(
      selectedWatchlist.id,
      updatedData.name,
      updatedData.type
    );

    // Lắng nghe RES_MSG
    const unsubscribe = subscribeTradingResponse(
      `SEQ_${clientSeq}`,
      (response) => {
        response.Result === "1" || response.Result === 1;
        // Thành công, cập nhật danh sách
        setWatchlists(
          watchlists.map((w) =>
            w.id === selectedWatchlist.id
              ? {...w, name: updatedData.name, type: updatedData.type}
              : w
          )
        );
        setShowEditModal(false);
        setSelectedWatchlist(null);

        unsubscribe();
      }
    );
  };

  const handleDeleteWatchlist = (watchlist) => {
    setSelectedWatchlist(watchlist);
    setShowDeleteModal(true);
  };

  const selectWatchlist = (watchlist) => {
    let symbols = Array.isArray(watchlist.symbols) ? watchlist.symbols : [];

    if ((!symbols || symbols.length === 0) && watchlist.id !== undefined) {
      try {
        const saved = localStorage.getItem(`watchlist_items_${watchlist.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) symbols = parsed;
        }
      } catch (e) {
        console.error("Failed to parse watchlist items from localStorage", e);
      }
    }

    const tableData = symbols.map(createEmptyStock);

    if (typeof onWatchlistSelect === "function") {
      setCurrentSelectedWatchlistId(watchlist.id);
      setCurrentSelectedWatchlistName(watchlist.name || "");
      onWatchlistSelect(tableData, watchlist.name || "");
    }
  };

  const confirmDelete = () => {
    const clientSeq = sendDeleteWatchlist(selectedWatchlist.id);

    // Lắng nghe RES_MSG
    const unsubscribe = subscribeTradingResponse(
      `SEQ_${clientSeq}`,
      (response) => {
        if (response.Result === "1" || response.Result === 1)
          // Thành công, xóa khỏi danh sách
          setWatchlists(
            watchlists.filter((w) => w.id !== selectedWatchlist.id)
          );
        setShowDeleteModal(false);
        setSelectedWatchlist(null);

        unsubscribe();
      }
    );
  };

  const handleOwnedWatchlistClick = () => {
    if (typeof sendRealtimeWatchlist !== "function") return;

    const clientSeq = sendRealtimeWatchlist();
    setCurrentSelectedWatchlistId("owned");
    setCurrentSelectedWatchlistName("DM sở hữu");

    const handler = (rawResp) => {
      try {
        const resp = normalizeResponse(rawResp);
        const symbols = extractSymbols(resp);
        const tableData = symbols.map(createEmptyStock);

        if (typeof onWatchlistSelect === "function") {
          onWatchlistSelect(tableData, "DM sở hữu");
        }
      } catch (e) {
        console.error("Error parsing realtime watchlist response", e);
      } finally {
        unsubscribeTradingResponse(`SEQ_${clientSeq}`, handler);
      }
    };

    subscribeTradingResponse(`SEQ_${clientSeq}`, handler);
  };

  return (
    <div className="top-menu-container">
      <div className="top-menu-left">
        <div className="search-box">
          <input
            type="text"
            placeholder="Nhập mã CK"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value.toUpperCase());
              setSuggestionsVisible(true);
            }}
            onFocus={() => setSuggestionsVisible(true)}
            onBlur={() => setTimeout(() => setSuggestionsVisible(false), 150)}
          />
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

          {suggestionsVisible && searchQuery && (
            <div className="search-suggestions">
              {(MOCK_DATA || [])
                .map((m) => m.symbol)
                .filter((s) => s && s.includes(searchQuery))
                .slice(0, 10)
                .map((s) => (
                  <div
                    key={s}
                    className="suggestion-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      if (!currentSelectedWatchlistId) {
                        alert("Vui lòng chọn danh mục trước khi thêm mã");
                        return;
                      }

                      if (typeof onAddStock === "function") onAddStock(s);
                      setSearchQuery("");
                      setSuggestionsVisible(false);
                    }}
                  >
                    {s}
                  </div>
                ))}
            </div>
          )}
        </div>
        <button className="menu-btn primary">Giao dịch</button>
        <button className="menu-btn">Cơ bản</button>
      </div>

      <div className="top-menu-center">
        <div className="nav-links">
          {MENU_ITEMS.map((menu, index) => (
            <div key={index} className="nav-item-dropdown">
              <a className={`nav-link ${menu.active ? "active" : ""}`}>
                {menu.title === "DM theo dõi"
                  ? currentSelectedWatchlistName || menu.title
                  : menu.title === "Nhóm ngành"
                    ? selectedGroupTitle || menu.title
                    : menu.title}{" "}
                {menu.hasDropdown && <FaCaretDown />}
              </a>
              {menu.hasDropdown && (
                <div className="dropdown-menu">
                  {menu.title === "DM theo dõi" ? (
                    <>
                      {watchlists.map((watchlist) => (
                        <div
                          key={watchlist.id}
                          className="dropdown-item watchlist-item"
                          onClick={() => selectWatchlist(watchlist)}
                          style={{cursor: "pointer"}}
                        >
                          <span className="item-text">{watchlist.name}</span>
                          <div className="watchlist-actions">
                            <button
                              className="edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditWatchlist(watchlist);
                              }}
                            >
                              <PiNotePencilLight />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWatchlist(watchlist);
                              }}
                            >
                              <AiOutlineDelete />
                            </button>
                          </div>
                        </div>
                      ))}
                      <span
                        className="dropdown-item"
                        onClick={handleOwnedWatchlistClick}
                        style={{cursor: "pointer"}}
                      >
                        DM sở hữu
                      </span>
                      <div
                        className="dropdown-item"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <span className="item-icon">
                          <FaPlusCircle />
                        </span>
                        <span className="item-text">Tạo danh mục mới</span>
                      </div>
                    </>
                  ) : (
                    menu.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={`dropdown-item ${item.active ? "active" : ""
                          }`}
                        onClick={() => {
                          if (menu.title === "Nhóm ngành")
                            setSelectedGroupTitle(item.text);
                        }}
                        style={{
                          cursor:
                            menu.title === "Nhóm ngành" ? "pointer" : "auto",
                        }}
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
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateWatchlist}
      />

      {/* Modal sửa danh mục */}
      {showEditModal && selectedWatchlist && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Sửa tên danh mục</h2>
            <div className="modal-body">
              <label className="form-label">Tên muốn sửa</label>
              <input
                type="text"
                className="form-input-modal"
                defaultValue={selectedWatchlist.name}
                id="edit-watchlist-name"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-submit"
                onClick={() => {
                  const newName = document.getElementById(
                    "edit-watchlist-name"
                  ).value;
                  if (newName.trim()) {
                    handleUpdateWatchlist({
                      name: newName,
                      type: selectedWatchlist.type,
                    });
                  }
                }}
              >
                Đồng ý
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xóa danh mục */}
      {showDeleteModal && selectedWatchlist && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="warning-icon">
              <IoAlertCircle />
            </div>
            <h2 className="modal-title">Xóa danh mục theo dõi</h2>
            <p className="modal-message">
              Bạn thực sự muốn xóa DMQT: {selectedWatchlist.name}?
            </p>
            <div className="modal-footer">
              <button className="btn-submit-warning" onClick={confirmDelete}>
                Đồng ý
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopMenu;
