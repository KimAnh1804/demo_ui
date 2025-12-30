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
  sendGetListIndividualBondsSecuritiesRequest,
  sendListStockIndustryRequest
} from "../../services/socketTrading";

const normalizeResponse = (resp) => {
  try {
    if (resp && typeof resp.Data === "string") {
      return {...resp, Data: JSON.parse(resp.Data)};
    }
  } catch (e) { }
  return resp;
};

const extractStockInfos = (resp) => {
  const data = resp?.Data || resp?.InVal || resp?.OutVal || resp;

  if (!Array.isArray(data)) {
    if (typeof data === 'string') {
      if (data.includes(';')) return extractStockInfos({Data: data.split(';')});
      if (data.includes('\n')) return extractStockInfos({Data: data.split('\n')});
      return extractStockInfos({Data: [data]});
    }
    if (typeof data === 'object' && data !== null) return extractStockInfos({Data: [data]});
    return [];
  }

  return data.map(it => {
    let symbol = null;
    let board = null;
    let name = "";

    if (typeof it === 'string') {
      if (it.includes('|')) {
        const parts = it.split('|');
        symbol = parts[0];
        board = parts[1];
        if (parts.length > 2 && isNaN(parts[2])) name = parts[2];
      } else {
        symbol = it;
      }
    } else if (Array.isArray(it)) {
      symbol = it[0];
      board = it[1];
      if (it.length > 2 && typeof it[2] === 'string') name = it[2];
    } else if (typeof it === 'object') {
      symbol = it?.SecCode || it?.code || it?.symbol || it?.c0 || it?.t55 || it?.[0];
      board = it?.board || it?.Board || it?.floor || it?.Floor || it?.t20004 || it?.c1 || it?.mk || it?.market;
      name = it?.SecName || it?.name || it?.Name || it?.t56 || "";
    }

    if (!symbol || typeof symbol !== 'string') return null;

    let normBoard = board || 'UNKNOWN';
    let ref = it?.t20013 ? parseFloat(it.t20013) : 0;

    return {symbol: symbol.trim(), board: normBoard, ref, name: name || ""};
  }).filter(x => x);
};

const createEmptyStock = (sym, board) => ({
  symbol: sym,
  board: board,
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
    hasDropdown: true,
    items: [
      {text: "HOSE"},
      {text: "VN30"},
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
  const [allStocks, setAllStocks] = useState([]);

  useEffect(() => {
    const handleStockResponse = (resp) => {
      try {
        const norm = normalizeResponse(resp);
        const info = extractStockInfos(norm);
        if (info && info.length > 0) {
          setAllStocks(prev => {
            const existing = new Set(prev.map(s => s.symbol));
            const newItems = info.filter(s => !existing.has(s.symbol));
            return [...prev, ...newItems];
          });
        }
      } catch (e) {
        console.error("Error processing stock list response", e);
      }
    };

    // Fetch Stock Industry
    const req1 = sendListStockIndustryRequest();
    if (req1) {
      const handler1 = (resp) => {
        handleStockResponse(resp);
        unsubscribeTradingResponse(`SEQ_${req1}`, handler1);
      };
      subscribeTradingResponse(`SEQ_${req1}`, handler1);
    }

    // Fetch Bonds/Securities
    const req2 = sendGetListIndividualBondsSecuritiesRequest();
    if (req2) {
      const handler2 = (resp) => {
        handleStockResponse(resp);
        unsubscribeTradingResponse(`SEQ_${req2}`, handler2);
      };
      subscribeTradingResponse(`SEQ_${req2}`, handler2);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [selectedGroupTitle, setSelectedGroupTitle] = useState("");
  const [activeMenuTitle, setActiveMenuTitle] = useState("VN30");
  const [activeSubItem, setActiveSubItem] = useState("VN30");
  const lastGroupTableRef = React.useRef([]);
  const groupServiceUnsubRef = React.useRef(null);

  const handleFinanceGroupClick = (groupName) => {
    if (typeof sendFinanceInfoRequest !== "function") return;

    const clientSeq = sendFinanceInfoRequest();

    const seqHandler = (rawResp) => {
      try {
        const resp = normalizeResponse(rawResp);
        const stockInfos = extractStockInfos(resp);
        const tableData = stockInfos.map(s => {
          const st = createEmptyStock(s.symbol, s.board);
          if (s.ref > 0) st.ref = s.ref;
          return st;
        });

        lastGroupTableRef.current = tableData;
        setCurrentSelectedWatchlistId(groupName);
        setCurrentSelectedWatchlistName("");
        setSelectedGroupTitle(groupName);
        setActiveMenuTitle("Nhóm ngành");

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

    const tableData = symbols.map(s => {
      if (typeof s === 'string') return createEmptyStock(s);
      return createEmptyStock(s.symbol, s.board);
    });

    if (typeof onWatchlistSelect === "function") {
      setCurrentSelectedWatchlistId(watchlist.id);
      setCurrentSelectedWatchlistName(watchlist.name || "");
      setSelectedGroupTitle("");
      setActiveMenuTitle("DM theo dõi");
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
    setSelectedGroupTitle("");
    setActiveMenuTitle("DM theo dõi");

    const handler = (rawResp) => {
      try {
        const resp = normalizeResponse(rawResp);
        const stockInfos = extractStockInfos(resp);
        const tableData = stockInfos.map(s => createEmptyStock(s.symbol, s.board));

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

  const handleFinanceInfoClick = () => {
    if (typeof sendFinanceInfoRequest !== "function") return;

    const clientSeq = sendFinanceInfoRequest();
    setCurrentSelectedWatchlistId("finance");
    setCurrentSelectedWatchlistName("DM theo dõi");
    setSelectedGroupTitle("");

    const handler = (rawResp) => {
      try {
        const resp = normalizeResponse(rawResp);
        const stockInfos = extractStockInfos(resp);
        const tableData = stockInfos.map(s => createEmptyStock(s.symbol, s.board));

        if (typeof onWatchlistSelect === "function") {
          onWatchlistSelect(tableData, "DM theo dõi");
        }
      } catch (e) {
        console.error("Error parsing finance info response", e);
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
            <div className="search-suggestions" style={{width: '400px'}}>
              {((allStocks && allStocks.length > 0) ? allStocks : (MOCK_DATA || []))
                .filter((s) => {
                  if (!s) return false;
                  const query = searchQuery.toUpperCase();
                  const symbol = s.symbol ? s.symbol.toUpperCase() : "";
                  const name = s.name ? s.name.toUpperCase() : "";
                  return symbol.includes(query) || name.includes(query);
                })
                .slice(0, 100)
                .map((item, idx) => {
                  const symbol = item.symbol || "";
                  const name = item.name || "";
                  const board = item.board || "";
                  const query = searchQuery.toUpperCase();

                  const highlightText = (text, highlight) => {
                    if (!text) return "";
                    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
                    return parts.map((part, i) =>
                      part.toUpperCase() === highlight.toUpperCase() ?
                        <span key={i} style={{color: '#ff4d4f'}}>{part}</span> : part
                    );
                  };

                  return (
                    <div
                      key={`${symbol}-${idx}`}
                      className="suggestion-item"
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        if (!currentSelectedWatchlistId) {
                          alert("Vui lòng chọn danh mục trước khi thêm mã");
                          return;
                        }

                        if (typeof onAddStock === "function") onAddStock(symbol);
                        setSearchQuery("");
                        setSuggestionsVisible(false);
                      }}
                      style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderBottom: '1px solid #333'}}
                    >
                      <span style={{color: '#fff', minWidth: '40px'}}>{board}</span>
                      <span style={{color: '#666'}}> - </span>
                      <span style={{fontWeight: 'bold', minWidth: '50px'}}>{highlightText(symbol, query)}</span>
                      {name && (
                        <>
                          <span style={{color: '#666'}}> - </span>
                          <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {highlightText(name, query)}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
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
              <a className={`nav-link ${activeMenuTitle === menu.title ? "active" : ""}`}>
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
                          className={`dropdown-item watchlist-item ${currentSelectedWatchlistId === watchlist.id ? "active" : ""
                            }`}
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
                        className={`dropdown-item ${currentSelectedWatchlistId === "owned" ? "active" : ""
                          }`}
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
                    menu.items.map((item, itemIndex) => {
                      const isActive =
                        menu.title === "Nhóm ngành"
                          ? selectedGroupTitle === item.text
                          : activeSubItem === item.text;
                      return (
                        <div
                          key={itemIndex}
                          className={`dropdown-item ${isActive ? "active" : ""}`}
                          onClick={() => {
                            if (menu.title === "Nhóm ngành") {
                              handleFinanceGroupClick(item.text);
                            } else {
                              handleFinanceInfoClick();
                              setActiveMenuTitle(menu.title);
                              setActiveSubItem(item.text);
                            }
                          }}
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          {item.icon && (
                            <span className="item-icon">{item.icon}</span>
                          )}
                          <span className="item-text">{item.text}</span>
                        </div>
                      );
                    })
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
