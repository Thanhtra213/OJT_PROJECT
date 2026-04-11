import React, { useState, useEffect, forwardRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import "./PaymentForm.scss";
import { getPlans } from "../../middleware/planAPI";
import { createPayment } from "../../middleware/paymentAPI";
import { validateVoucher } from "../../middleware/paymentAPI";
//import Footer from "../Footer/footer";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ className, ...props }) {
  return <div className={cn("card", className)} {...props} />;
}
function CardHeader({ className, ...props }) {
  return <div className={cn("card-header", className)} {...props} />;
}
function CardTitle({ className, ...props }) {
  return <h4 className={cn("card-title", className)} {...props} />;
}
function CardContent({ className, ...props }) {
  return <div className={cn("card-content", className)} {...props} />;
}
const Button = forwardRef(({ className, variant = "default", ...props }, ref) => {
  return <button ref={ref} className={cn("bu-btn", variant, className)} {...props} />;
});
Button.displayName = "Button";
const Input = forwardRef(({ className, type = "text", ...props }, ref) => {
  return <input ref={ref} type={type} className={cn("input", className)} {...props} />;
});
Input.displayName = "Input";
function Label({ className, ...props }) {
  return <label className={cn("label", className)} {...props} />;
}

function PaymentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discount, setDiscount] = useState(0);

  const [plan, setPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [finalPrice, setFinalPrice] = useState(null);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const data = await getPlans();
        const selected = data.find((p) => p.planID === parseInt(id));
        setPlan(selected);
      } catch (error) {
        console.error("Lỗi khi lấy plan:", error);
        toast.error("Không thể tải thông tin gói học");
      }
    };
    loadPlan();
  }, [id]);

  useEffect(() => {
    if (voucher.trim() === "") {
      setDiscount(0);
      setFinalPrice(null);
    }
  }, [voucher]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsProcessing(true);

    try {
      const paymentUrl = await createPayment(
        plan.planID,
        voucher?.trim() || null   // 🔥 QUAN TRỌNG
      );

      toast.success("Đang chuyển đến trang thanh toán...");

      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 500);

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        toast.error("Bạn cần đăng nhập");
        navigate("/login");
        return;
      }

      toast.error(err.response?.data || "Lỗi thanh toán");
      setIsProcessing(false);
    }
  };

  const handleApplyVoucher = async () => {
    try {
      const data = await validateVoucher(plan.planID, voucher);

      setDiscount(data.discountAmount);
      setFinalPrice(data.finalPrice);

      toast.success("Áp dụng mã giảm giá thành công! 🎉");
    } catch (err) {
      setDiscount(0);
      setFinalPrice(null);
      toast.error(err.message || "Mã voucher không hợp lệ");
    }
  };

  if (!plan) return <div className="loading">Đang tải gói...</div>;

  return (
    <div className="payment-container">
      <div className="payment-wrapper">
        <div className="payment-header">
          <Button variant="ghost" onClick={() => navigate("/membership")} className="back-btn">
            <ArrowLeft className="icon" />
            Quay lại
          </Button>
          <h1 className="title">Thanh toán</h1>
          <p className="subtitle">Hoàn tất đăng ký {plan.name}</p>
        </div>

        <div className="payment-grid">
          {/* FORM */}
          <div className="payment-form">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="form">

                  <Label>Mã voucher</Label>
                  <Input
                    value={voucher}
                    onChange={(e) => setVoucher(e.target.value)}
                    placeholder="T4VJP271204"
                  />

                  <Button type="button" onClick={handleApplyVoucher}>
                    Áp dụng
                  </Button>

                  <Button type="submit" disabled={isProcessing} className="submit-btn">
                    {isProcessing ? "Đang xử lý..." : "Thanh toán ngay"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ORDER SUMMARY */}
          <div className="order-summary">
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="plan-name">Gói: {plan.name}</p>
                <p className="plan-duration">
                  Thời hạn: {plan.durationDays} ngày
                </p>

                <p>
                  Giá gốc:{" "}
                  <strong>{plan.price.toLocaleString("vi-VN")}đ</strong>
                </p>

                <p>
                  Giảm giá:{" "}
                  <strong>
                    -{discount.toLocaleString("vi-VN")}đ
                  </strong>
                </p>

                <p className="price-total">
                  Thanh toán:{" "}
                  <strong>
                    {(plan.price - discount).toLocaleString("vi-VN")}đ
                  </strong>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentForm;