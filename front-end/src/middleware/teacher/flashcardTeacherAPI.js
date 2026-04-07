import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/teacher/flashcard`;

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

// ===================== 🟢 FLASHCARD SETS =====================

// Lấy danh sách flashcard set public (không gắn với course)

export const getPublicFlashcardSets = async () => {
  try {
    const res = await api.get(`/sets/public`, {
      headers: getAuthHeaders(),
    });
    console.log("📘 getPublicFlashcardSets response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ getPublicFlashcardSets error:", err.response?.data || err.message);
    throw err;
  }
};

// Lấy danh sách flashcard set theo courseId
export const getFlashcardSetsByCourse = async (courseId) => {
  try {
    const res = await api.get(`/sets/course/${courseId}`, {
      headers: getAuthHeaders(),
    });
    console.log("📘 getFlashcardSetsByCourse response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ getFlashcardSetsByCourse error:", err.response?.data || err.message);
    throw err;
  }
};

// Lấy chi tiết 1 flashcard set (bao gồm items)
export const getFlashcardSetById = async (setId) => {
  try {
    const res = await api.get(`/set/${setId}`, {
      headers: getAuthHeaders(),
    });
    console.log("📘 getFlashcardSetById response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ getFlashcardSetById error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟢 Tạo mới flashcard set
export const createFlashcardSet = async (data) => {
  try {
    const res = await api.post(`/set`, data, {
      headers: getAuthHeaders(),
    });
    console.log("📘 createFlashcardSet response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ createFlashcardSet error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟡 Cập nhật flashcard set theo setId
export const updateFlashcardSet = async (setId, data) => {
  try {
    const res = await api.put(`/set/${setId}`, data, {
      headers: getAuthHeaders(),
    });
    console.log("📘 updateFlashcardSet response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ updateFlashcardSet error:", err.response?.data || err.message);
    throw err;
  }
};

// 🔴 Xóa flashcard set theo setId
export const deleteFlashcardSet = async (setId) => {
  try {
    const res = await api.delete(`/set/${setId}`, {
      headers: getAuthHeaders(),
    });
    console.log("📘 deleteFlashcardSet response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ deleteFlashcardSet error:", err.response?.data || err.message);
    throw err;
  }
};

// ===================== 🟢 FLASHCARD ITEMS =====================

// 🟢 Tạo flashcard item (thẻ)
export const createFlashcardItem = async (data) => {
  try {
    const res = await api.post(`/item`, data, {
      headers: getAuthHeaders(),
    });
    console.log("📘 createFlashcardItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ createFlashcardItem error:", err.response?.data || err.message);
    throw err;
  }
};

// 🟡 Cập nhật flashcard item theo itemId
export const updateFlashcardItem = async (itemId, data) => {
  try {
    const res = await api.put(`/item/${itemId}`, data, {
      headers: getAuthHeaders(),
    });
    console.log("📘 updateFlashcardItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ updateFlashcardItem error:", err.response?.data || err.message);
    throw err;
  }
};

// 🔴 Xóa flashcard item theo itemId
export const deleteFlashcardItem = async (itemId) => {
  try {
    const res = await api.delete(`/item/${itemId}`, {
      headers: getAuthHeaders(),
    });
    console.log("📘 deleteFlashcardItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ deleteFlashcardItem error:", err.response?.data || err.message);
    throw err;
  }
};
