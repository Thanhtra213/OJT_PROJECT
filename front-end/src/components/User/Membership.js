import React, { useEffect, useState } from "react";
import "./membership.scss";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPlans } from "../../middleware/planAPI";

const Membership = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const data = await getPlans();
      setPlans(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) {
    return <div className="membership-page"><p>Đang tải gói đăng ký...</p></div>;
  }

  return (
    <div className="membership-page">
      <div className="header-section">
        <button className="back-btn" onClick={() => navigate("/home")}>← Quay lại</button>
        <h1>Chọn gói đăng ký</h1>
        <p>Truy cập tất cả khóa học với gói phù hợp cho bạn</p>
      </div>

      <div className="benefits-section">
        <div className="benefit-item"><p>📘</p><p><strong>10+ Khóa học</strong><br />Tất cả trình độ</p></div>
        <div className="benefit-item"><p>🏆</p><p><strong>Chứng chỉ</strong><br />Được công nhận</p></div>
        <div className="benefit-item"><p>👥</p><p><strong>Cộng đồng</strong><br />5000+ học viên</p></div>
        <div className="benefit-item"><p>🎧</p><p><strong>Hỗ trợ 24/7</strong><br />Luôn sẵn sàng</p></div>
      </div>

      <div className="plans-section">
        {Array.isArray(plans) && plans.length > 0 ? (
          plans.map((p) => (
            <div key={p.planID} className="plan-card">
              <h3>{p.name}</h3>
              <h2>{p.price.toLocaleString("vi-VN")} ₫</h2>
              <p>Thời hạn: {p.durationDays} ngày</p>
              <ul>
                <li><CheckCircle size={18} /> Truy cập tất cả khóa học</li>
                <li><CheckCircle size={18} /> Video HD & Flashcard</li>
                <li><CheckCircle size={18} /> Theo dõi tiến độ học</li>
              </ul>
              <button onClick={() => navigate(`/payment/${p.planID}`)}>
                Chọn gói này
              </button>
            </div>
          ))
        ) : (
          <p>Không có gói nào được tìm thấy.</p>
        )}
      </div>

      <div className="extra-section">
        <div className="extra-item"><p>💰</p><p><strong>Đảm bảo hoàn tiền</strong><br />Hoàn tiền 100% trong 7 ngày đầu nếu không hài lòng</p></div>
        <div className="extra-item"><p>📅</p><p><strong>Học linh hoạt</strong><br />Học mọi lúc, mọi nơi với ứng dụng di động và web</p></div>
        <div className="extra-item"><p>👨‍🏫</p><p><strong>Hỗ trợ chuyên gia</strong><br />Đội ngũ giảng viên sẵn sàng hỗ trợ 24/7</p></div>
      </div>

      <div className="faq-section">
        <h3>Câu hỏi thường gặp</h3>
        <div className="faq-item">
          <strong>Tôi có thể hủy đăng ký bất cứ lúc nào không?</strong>
          <p>Có, bạn có thể hủy đăng ký bất cứ lúc nào. Bạn vẫn có thể sử dụng dịch vụ đến hết thời hạn đã thanh toán.</p>
        </div>
        <div className="faq-item">
          <strong>Gói đăng ký có tự động gia hạn không?</strong>
          <p>Không, tất cả gói đăng ký đều không tự động gia hạn. Bạn sẽ nhận được thông báo trước khi hết hạn.</p>
        </div>
        <div className="faq-item">
          <strong>Tôi có thể chuyển đổi gói đăng ký không?</strong>
          <p>Có, bạn có thể nâng cấp lên gói cao hơn bất cứ lúc nào. Phí chênh lệch sẽ được tính theo tỷ lệ thời gian còn lại.</p>
        </div>
      </div>
    </div>
  );
};

export default Membership;
