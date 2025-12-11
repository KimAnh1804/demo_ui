import React from "react";
//import {FaPlus} from 'react-icons/fa';
import { MdAddBox } from "react-icons/md";
import { FaCaretDown, FaPlusCircle } from "react-icons/fa";
import "./TopMenu.scss";

const MENU_ITEMS = [
  {
    title: "DM theo dõi",
    hasDropdown: true,
    items: [{ text: "Tạo danh mục mới", icon: <FaPlusCircle /> }],
  },
  {
    title: "VN30",
    active: true,
    hasDropdown: true,
    items: [
      { text: "HOSE" },
      { text: "VN30", active: true },
      { text: "Giao dịch thỏa thuận" },
      { text: "Lô lẻ HOSE" },
    ],
  },
  {
    title: "HNX",
    hasDropdown: true,
    items: [
      { text: "HNX" },
      { text: "HNX30" },
      { text: "Giao dịch thỏa thuận" },
      { text: "Lô lẻ HNX" },
    ],
  },
  {
    title: "UPCOM",
    hasDropdown: true,
    items: [
      { text: "UPCOM" },
      { text: "Giao dịch thỏa thuận" },
      { text: "Lô lẻ UPCOM" },
    ],
  },
  {
    title: "Nhóm ngành",
    hasDropdown: true,
    items: [
      { text: "Sản xuất Nông-Lâm-Ngư nghiệp" },
      { text: "Khai khoáng" },
      { text: "Tiện ích cộng đồng" },
      { text: "Xây dựng và bất động sản" },
      { text: "Sản xuất" },
      { text: "Vận tải và kho bãi" },
      { text: "Công nghệ-Truyền thông" },
      { text: "Tài chính và bảo hiểm" },
      { text: "Thuê và cho thuê" },
      { text: "Dịch vụ chuyên môn-Khoa học-Kỹ thuật" },
      { text: "Dịch vụ hỗ trợ-Dịch vụ xử lý và tái chế rác thải" },
      { text: "Giáo dục và đào tạo" },
      { text: "Dịch vụ chăm sóc sức khỏe" },
      { text: "Nghệ thuật và dịch vụ giải trí" },
      { text: "Dịch vụ lưu trú và ăn uống" },
      { text: "Hành chính công" },
      { text: "Dịch vụ khác" },
      { text: "Bán buôn" },
      { text: "Bán lẻ" },
    ],
  },
];

const TopMenu = ({ user, onLogout }) => {
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
                  {menu.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`dropdown-item ${item.active ? "active" : ""}`}
                    >
                      {item.icon && (
                        <span className="item-icon">{item.icon}</span>
                      )}
                      <span className="item-text">{item.text}</span>
                    </div>
                  ))}
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
    </div>
  );
};

export default TopMenu;
