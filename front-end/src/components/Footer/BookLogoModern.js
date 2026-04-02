// BookLogoModern.js
// Logo chính thức: sách mở + mũ tốt nghiệp (SVG gốc từ englishmaster_icon_logo.svg)
import React from "react";

const BookLogoModern = ({ size = 64, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="295 15 90 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    {/* 2 trang sách hình chữ nhật bo góc */}
    <rect x="295" y="40" width="38" height="52" rx="6" fill="#10B981" />
    <rect x="340" y="40" width="38" height="52" rx="6" fill="#059669" />

    {/* Gáy sách ở giữa */}
    <rect x="330" y="36" width="14" height="60" rx="4" fill="#065F46" />

    {/* Dòng kẻ trang trái */}
    <line x1="302" y1="54" x2="326" y2="54" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="302" y1="63" x2="326" y2="63" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="302" y1="72" x2="326" y2="72" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="302" y1="81" x2="322" y2="81" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

    {/* Dòng kẻ trang phải */}
    <line x1="347" y1="54" x2="371" y2="54" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="347" y1="63" x2="371" y2="63" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="347" y1="72" x2="371" y2="72" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="347" y1="81" x2="367" y2="81" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

    {/* Mũ tốt nghiệp - mặt mũ hình thoi */}
    <polygon points="337,18 362,28 337,38 312,28" fill="#1E293B" />
    {/* Thân mũ hình trụ nhỏ */}
    <rect x="330" y="28" width="14" height="10" rx="2" fill="#334155" />
    {/* Dây mũ */}
    <line x1="362" y1="28" x2="362" y2="44" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
    {/* Cục tassel vàng */}
    <circle cx="362" cy="47" r="4" fill="#FBBF24" />

    {/* Bóng nhẹ dưới sách */}
    <ellipse cx="337" cy="98" rx="38" ry="5" fill="#10B981" opacity="0.15" />
  </svg>
);

export default BookLogoModern;
