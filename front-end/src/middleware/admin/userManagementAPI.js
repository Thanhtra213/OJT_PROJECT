import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/admin`;

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

// 🟢 Lấy tất cả người dùng (ĐÃ SỬA LỖI MẤT DỮ LIỆU Ở ĐÂY 👇)
export const getAllUsers = async () => {
  try {
    const res = await api.get("/users", { headers: getAuthHeaders() });
    console.log("📘 getAllUsers response:", res.data);
    // Nếu res.data là mảng thì trả về luôn, nếu không thì tìm trong res.data.data
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  } catch (err) {
    console.error("❌ getAllUsers error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟢 Lấy danh sách học viên
export const getStudents = async () => {
  try {
    const res = await api.get("/users/students", { headers: getAuthHeaders() });
    console.log("📘 getStudents response:", res.data);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("❌ getStudents error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟢 Lấy danh sách giảng viên
export const getTeachers = async () => {
  try {
    const res = await api.get("/users/teachers", { headers: getAuthHeaders() });
    console.log("📘 getTeachers response:", res.data);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("❌ getTeachers error:", err.response?.data || err.message);
    throw err;
  }
};

// 🔴 Khóa tài khoản người dùng
export const lockUser = async (userId) => {
  try {
    const res = await api.put(`/users/${userId}/lock`, {}, { headers: getAuthHeaders() });
    console.log("📘 lockUser response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ lockUser error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟢 Mở khóa tài khoản người dùng
export const unlockUser = async (userId) => {
  try {
    const res = await api.put(`/users/${userId}/unlock`, {}, { headers: getAuthHeaders() });
    console.log("📘 unlockUser response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ unlockUser error:", err.response?.data || err.message);
    throw err;
  }
};

// 🔍 Tìm kiếm người dùng
export const searchUsers = async (query, role = null, status = null) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (role) params.append("role", role);
    if (status) params.append("status", status);

    const res = await api.get(`/users/search?${params.toString()}`, { 
      headers: getAuthHeaders() 
    });
    console.log("📘 searchUsers response:", res.data);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("❌ searchUsers error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟢 Tạo tài khoản người dùng mới
export const createUser = async (data) => {
  try {
    const res = await api.post("/users/create", data, { headers: getAuthHeaders() });
    console.log("📘 createUser response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ createUser error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟡 Gán role cho người dùng
export const assignRole = async (userId, role) => {
  try {
    const res = await api.post("/users/assign-role", 
      { userId, role }, 
      { headers: getAuthHeaders() }
    );
    console.log("📘 assignRole response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ assignRole error:", err.response?.data || err.message);
    throw err;
  }
};