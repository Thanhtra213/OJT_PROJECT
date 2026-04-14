import axios from "axios";

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

const unwrapData = (res) => {
  let data = res.data;
  if (data && typeof data === "object" && data.data !== undefined) {
    data = data.data; 
  }
  return data;
};

export const getAllVouchers = async () => {
  try {
    const res = await api.get("/", { headers: getAuthHeaders() });
    const finalData = unwrapData(res);
    return Array.isArray(finalData) ? finalData : [];
  } catch (err) {
    console.error("❌ getAllVouchers error:", err);
    throw err;
  }
};

export const createVoucher = async (voucherData) => {
  try {
    const res = await api.post("/", voucherData, { headers: getAuthHeaders() });
    return unwrapData(res);
  } catch (err) {
    console.error("❌ createVoucher error:", err);
    throw err;
  }
};

// ĐÃ SỬA: Gọi đúng hàm ToggleVoucher của C# thông qua QueryString
export const toggleVoucher = async (voucherId) => {
  try {
    // Backend C#: ToggleVoucher(int voucherId) -> Bắt buộc phải truyền dạng ?voucherId=
    const res = await api.patch(`?voucherId=${voucherId}`, {}, { headers: getAuthHeaders() });
    return unwrapData(res);
  } catch (err) {
    console.error("❌ toggleVoucher error:", err);
    throw err;
  }
};