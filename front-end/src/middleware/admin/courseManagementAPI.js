// src/middleware/courseManagementAPI.js
import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/admin/courses`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Lấy token từ localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
};

// 📘 Lấy tất cả khóa học
export const getAllCourses = async () => {
  const res = await api.get("/view", { headers: getAuthHeaders() });
  return res.data;
};

export const getCourseDetail = async (courseId) => {
  const res = await api.get(`/detail/${courseId}`, { headers: getAuthHeaders() });
  return res.data;
};
// 📗 Lấy khóa học theo teacherId
export const getCoursesByTeacher = async (teacherId) => {
  const res = await api.get(`/view/${teacherId}`, { headers: getAuthHeaders() });
  return res.data;
};

// ❌ Xóa khóa học theo courseId
export const deleteCourse = async (courseId) => {
  const res = await api.delete(`/delete/${courseId}`, { headers: getAuthHeaders() });
  return res.data;
};
