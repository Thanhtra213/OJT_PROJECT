// src/middleware/paymentAPI.js
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL}/api/payment`;

export async function createPayment(planID, voucherCode) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Chưa đăng nhập");

    // 🔹 Build query string
    let url = `${API_BASE}/create?planId=${planID}`;

    if (voucherCode && voucherCode.trim() !== "") {
      url += `&voucherCode=${encodeURIComponent(voucherCode)}`;
    }

    const res = await axios.post(
      url,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
      }
    );

    console.log("✅ Payment response:", res.data);

    const paymentUrl = res.data.paymentUrl || res.data.url;

    if (!paymentUrl) {
      throw new Error("Không nhận được URL thanh toán từ server");
    }

    return paymentUrl;
  } catch (error) {
    console.error("❌ Lỗi khi tạo thanh toán:", error.response?.data || error.message);
    throw error;
  }
}
export async function validateVoucher(planID, voucherCode) {
  try {
    const token = localStorage.getItem("accessToken");

    const res = await axios.post(
      `${API_BASE}/validate-voucher`,
      {
        code: voucherCode,
        planId: planID
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
      }
    );

    console.log("✅ Voucher response:", res.data);
    return res.data;

  } catch (error) {
    console.error("❌ Voucher error FULL:", error.response?.data);

    // ✅ API trả về plain string, không phải object
    throw new Error(
      typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.message || "Voucher không hợp lệ"
    );
  }
}