import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL}/api/teacher/review`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
};

/**
 * Lấy danh sách bài tập của học viên cần review
 * GET /api/teacher/review
 */
export const getTeacherReviews = async () => {
  try {
    const res = await axios.get(API_BASE, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách review:", error);
    throw error;
  }
};

/**
 * Cập nhật điểm và feedback cho bài tập học viên
 * POST /api/teacher/review/updateScore
 */
export const updateReviewScore = async (reviewData) => {
  try {
    const res = await axios.post(`${API_BASE}/updateScore`, reviewData, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật điểm bài tập:", error);
    throw error;
  }
};
