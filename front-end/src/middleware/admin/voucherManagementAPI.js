import axios from "axios";
import Swal from "sweetalert2"; 

// Đổi đường dẫn trỏ thẳng đến Controller Vouchers của Backend
const API_URL = `${process.env.REACT_APP_API_URL}/api/admin/vouchers`;

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
};

const showPopup = (message, type = "success") => {
  Swal.fire({
    icon: type,
    title: type === "success" ? "Thành công" : "Lỗi",
    text: message,
    confirmButtonColor: type === "success" ? "#3085d6" : "#d33",
    timer: 3000,
  });
};

export const getAllVouchers = async () => {
  try {
    const res = await api.get("/", { headers: getAuthHeaders() });
    return res.data || [];
  } catch (err) {
    console.error("❌ getAllVouchers error:", err.response?.data || err.message);
    throw err;
  }
};

export const createVoucher = async (voucherData) => {
  try {
    const res = await api.post("/", voucherData, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    console.error("❌ createVoucher error:", err.response?.data || err.message);
    throw err;
  }
};

export const updateVoucher = async (id, voucherData) => {
  try {
    const res = await api.put(`/${id}`, voucherData, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    console.error("❌ updateVoucher error:", err.response?.data || err.message);
    throw err;
  }
};

export const deleteVoucher = async (id) => {
  try {
    const res = await api.delete(`/${id}`, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    console.error("❌ deleteVoucher error:", err.response?.data || err.message);
    throw err;
  }
};