// src/middleware/paymentAPI.js
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL}/api/payment`;

/**
 * Tạo thanh toán - Backend trả về paymentUrl để redirect
 * @param {number} planID - ID của gói học
 * @returns {Promise<string>} URL thanh toán
 */
export async function createPayment(planID) {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Chưa đăng nhập");

    const res = await axios.post(
      `${API_BASE}/create`,
      { planId: planID }, // 🔹 Gửi object { planId: number } theo Swagger
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
      }
    );

    console.log("✅ Payment response:", res.data);
    
    // 🔹 Backend trả về { paymentUrl: "https://..." }
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
