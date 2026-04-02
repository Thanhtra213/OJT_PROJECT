import React, { useState } from "react";
import BookLogoModern from "./BookLogoModern";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
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
              <div className="footer-logo d-flex align-items-center">
                <BookLogoModern size={64} style={{ marginRight: 20 }} />
                {/* Đã bỏ thuộc tính color: '#111' fix cứng để Dark Mode có thể tự đổi màu chữ */}
                <span className="logo-text" style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
                  EnglishMaster
                </span>
              </div>
              <p>
                Nền tảng học tiếng Anh với AI tiên tiến, giúp bạn chinh phục mọi
                mục tiêu học tập một cách hiệu quả nhất.
              </p>
              <div className="social-icons">
                <a href="#facebook"><i className="fab fa-facebook-f"></i></a>
                <a href="#twitter"><i className="fab fa-twitter"></i></a>
                <a href="#instagram"><i className="fab fa-instagram"></i></a>
                <a href="#linkedin"><i className="fab fa-linkedin-in"></i></a>
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