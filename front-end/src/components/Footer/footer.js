import React, { useState } from "react";
import BookLogoModern from "./BookLogoModern";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { FaFacebookF } from "react-icons/fa";
import "./Footer.scss";

const Footer = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState({
    type: "info",
    title: "Thông báo",
    message: "Đây là nội dung popup ví dụ!",
  });

  const handleClosePopup = () => setShowPopup(false);

  const getPopupHeaderClass = (type) => {
    switch (type) {
      case "success":
        return "popup-header-success";
      case "error":
        return "popup-header-error";
      default:
        return "popup-header-info";
    }
  };

  return (
    <>
      <footer className="main-footer">
        <Container>
          <Row>
            <Col lg={4} md={6} className="footer-logo-col">
              <div className="footer-logo d-flex align-items-center" style={{ position: 'relative', width: 'fit-content' }}>
                <div style={{ position: 'absolute', top: '0', left: '-10px', zIndex: 1, transform: 'rotate(-10deg)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#FBBF24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>

                <div style={{ position: 'absolute', top: '-15px', left: '42px', zIndex: 2 }}>
                  <svg width="34" height="28" viewBox="0 0 34 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="34" height="20" rx="6" fill="#52C478" />
                    <path d="M10 20L12 26L16 20H10Z" fill="#52C478" />
                    <text x="17" y="14" fill="white" fontSize="12" fontWeight="bold" fontFamily="system-ui, sans-serif" textAnchor="middle">Hi!</text>
                  </svg>
                </div>

                <BookLogoModern size={80} style={{ marginRight: 12, position: 'relative', zIndex: 0 }} />

                <div className="logo-text-stacked">
                  <div className="text-easy">Easy</div>
                  <div className="text-english">English</div>
                </div>

                <div style={{ position: 'absolute', top: '10px', right: '-45px', display: 'flex', flexWrap: 'wrap', width: '30px', height: '30px' }}>
                  <div style={{ position: 'absolute', top: '0', left: '10px', width: '8px', height: '8px', backgroundColor: '#dbeafe', borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', top: '15px', left: '0', width: '5px', height: '5px', backgroundColor: '#fef08a', borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', top: '12px', left: '15px', width: '12px', height: '12px', backgroundColor: '#d1fae5', borderRadius: '50%' }}></div>
                </div>
              </div>
              <p>
                Nền tảng học tiếng Anh với AI tiên tiến, giúp bạn chinh phục mọi
                mục tiêu học tập một cách hiệu quả nhất.
              </p>
              <div className="social-icons">
                <a 
                  href="https://www.facebook.com/share/18HQycnDhy/?mibextid=wwXIfr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="facebook-link-custom"
                >
                  <div className="icon-circle">
                    <FaFacebookF />
                  </div>
                  <span className="link-text">Easy English</span>
                </a>
              </div>
            </Col>

            <Col lg={2} md={6} className="footer-links-col">
              <h4>Liên kết nhanh</h4>
              <ul>
                <li><a href="#about">Về chúng tôi</a></li>
                <li><a href="#courses">Khóa học</a></li>
                <li><a href="#teachers">Giáo viên</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Liên hệ</a></li>
              </ul>
            </Col>

            <Col lg={3} md={6} className="footer-links-col">
              <h4>Hỗ trợ</h4>
              <ul>
                <li><a href="#help-center">Trung tâm trợ giúp</a></li>
                <li><a href="#terms">Điều khoản dịch vụ</a></li>
                <li><a href="#policy">Chính sách bảo mật</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#payment">Thanh toán</a></li>
              </ul>
            </Col>

            <Col lg={3} md={6} className="footer-contact-col">
              <h4>Liên hệ</h4>
              <address>
                <p><span className="icon">📍</span> 123 Đường AI, Quận Học Tập, Thành phố Thông Minh</p>
                <p><span className="icon">📞</span> +84 123 456 789</p>
                <p><span className="icon">✉️</span> support@englishmaster.com</p>
              </address>
            </Col>
          </Row>

          <div className="footer-divider"></div>
          <div className="footer-bottom">
            <p>© 2025 EnglishMaster. All rights reserved.</p>
            <div className="policy-links">
              <a href="#privacy">Chính sách bảo mật</a> |
              <a href="#terms-of-service">Điều khoản dịch vụ</a> |
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </Container>
      </footer>

      {/* Popup Modal */}
      <Modal
        show={showPopup}
        onHide={handleClosePopup}
        centered
        className="custom-homepage-popup-modal"
      >
        <Modal.Header closeButton className={getPopupHeaderClass(popupContent.type)}>
          <Modal.Title>{popupContent.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="homepage-popup-body">
          <p>{popupContent.message}</p>
        </Modal.Body>
        <Modal.Footer className="homepage-popup-footer">
          <Button variant="primary" onClick={handleClosePopup} className="homepage-popup-close-button">
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Footer;