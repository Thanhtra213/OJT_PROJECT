// src/middleware/teacher/flashcardTeacherAPI.js
import api from "../axiosInstance";

const TEACHER_FLASHCARD_URL = "/teacher/flashcard";

// ===================== 🟢 FLASHCARD SETS =====================

// Lấy danh sách flashcard set public (không gắn với course)
export const getPublicFlashcardSets = async () => {
  try {
    const res = await api.get(`${TEACHER_FLASHCARD_URL}/sets/public`);
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
    const res = await api.get(`${TEACHER_FLASHCARD_URL}/sets/course/${courseId}`);
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
    const res = await api.get(`${TEACHER_FLASHCARD_URL}/set/${setId}`);
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
    const res = await api.post(`${TEACHER_FLASHCARD_URL}/set`, data);
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
    const res = await api.put(`${TEACHER_FLASHCARD_URL}/set/${setId}`, data);
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
    const res = await api.delete(`${TEACHER_FLASHCARD_URL}/set/${setId}`);
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
    const res = await api.post(`${TEACHER_FLASHCARD_URL}/item`, data);
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
    const res = await api.put(`${TEACHER_FLASHCARD_URL}/item/${itemId}`, data);
    console.log("📘 updateFlashcardItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ updateFlashcardItem error:", err.response?.data || err.message);
    throw err;
  }
};

// 🔴 Xóa flashcard item theo itemId
export const deleteFlashcardItem = async (setId, itemId) => {
  try {
    const res = await api.delete(`${TEACHER_FLASHCARD_URL}/item/${itemId}?setId=${setId}`);
    console.log("📘 deleteFlashcardItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ deleteFlashcardItem error:", err.response?.data || err.message);
    throw err;
  }
};
