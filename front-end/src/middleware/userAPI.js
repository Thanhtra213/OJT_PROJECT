// src/middleware/userAPI.js
import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const parseError = (error) => {
  const data = error.response?.data;
  return (typeof data === "string" && data.trim())
    || data?.message
    || data?.error
    || error?.message
    || "Đã có lỗi xảy ra.";
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
    throw new Error(parseError(error));
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
    return res.data;
  } catch (error) {
    throw new Error(parseError(error));
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
    throw new Error(parseError(error));
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
    throw new Error(parseError(error));
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
   throw new Error(parseError(error));
  }
};
