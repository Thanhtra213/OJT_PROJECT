// src/middleware/userAPI.js
import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

// 🧩 Hàm hiển thị thông báo lỗi rõ ràng
const showErrorPopup = (error) => {
  let message = "Đã xảy ra lỗi không xác định!";

  if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.response?.data?.error) {
    message = error.response.data.error;
  } else if (error.message) {
    message = error.message;
  }

  alert(`❌ Lỗi: ${message}`);
};

// 🟢 Xử lý lỗi chung
const handleApiError = (error) => {
  console.error("API Error:", error.response?.data || error.message);

  // Nếu token hết hạn hoặc chưa đăng nhập
  if (error.response?.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    alert("🔒 Phiên đăng nhập của bạn đã hết hạn, vui lòng đăng nhập lại!");
    window.location.href = "/";
    throw new Error("Token hết hạn");
  }

  // Hiển thị popup lỗi
  showErrorPopup(error);

  throw error;
};

// 🟢 Lấy thông tin chi tiết profile
export const getUser = async (accessToken) => {
  try {
    console.log("🔍 GET /user/profile/detail");
    const res = await axios.get(`${API_URL}/user/profile/detail`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("✅ Response:", res.data);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// 🟢 Cập nhật thông tin profile (PUT JSON)
export const updateUser = async (userData, accessToken) => {
  try {
    console.log("PUT /user/profile/detail", userData);

    const res = await axios.put(`${API_URL}/user/profile/detail`, userData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("✅ Update success:", res.data);
    alert("✅ Cập nhật thông tin thành công!");
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// 🟢 Cập nhật ảnh đại diện (PUT multipart/form-data)
export const updateAvatar = async (file, token) => {
  try {
    console.log("📤 PUT /user/profile/avatar", file);

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.put(`${API_URL}/user/profile/avatar`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// 🟢 Đổi mật khẩu
export const changePassword = async (
  currentPassword,
  newPassword,
  confirmNewPassword,
  token
) => {
  try {
    console.log("📤 PUT /user/profile/password");

    const res = await axios.put(
      `${API_URL}/user/profile/password`,
      { currentPassword, newPassword, confirmNewPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Password changed:", res.data);
    alert("✅ Mật khẩu đã được thay đổi thành công!");
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAvatar = async (accessToken) => {
  try {
    console.log("🔍 GET /user/profile/avatar");
    const res = await axios.get(`${API_URL}/user/profile/avatar`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("✅ Avatar response:", res.data);
    return res.data; // { avatarUrl: "..." }
  } catch (error) {
    handleApiError(error);
  }
};
