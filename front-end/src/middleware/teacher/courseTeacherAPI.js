// src/middleware/teacher/courseTeacherAPI.js
import api from "../axiosInstance";

const TEACHER_COURSE_URL = "/teacher/course";

/* =====================
 * 📘 COURSE API
 * ===================== */

// ✅ Lấy tất cả khóa học của giáo viên
export const getTeacherCourses = async () => {
  try {
    const res = await api.get(TEACHER_COURSE_URL);
    return res.data?.EasyEnglish_API || res.data?.courses || res.data?.Courses || res.data || [];
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách khóa học:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể tải danh sách khóa học");
  }
};

// ✅ Lấy chi tiết 1 khóa học
export const getTeacherCourseDetail = async (courseId) => {
  try {
    const res = await api.get(`${TEACHER_COURSE_URL}/${courseId}`);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi lấy chi tiết khóa học:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể tải chi tiết khóa học");
  }
};

// ✅ Tạo mới khóa học
export const createTeacherCourse = async (courseData) => {
  try {
    const res = await api.post(TEACHER_COURSE_URL, courseData);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi tạo khóa học:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể tạo khóa học mới");
  }
};

// ✅ Cập nhật khóa học
export const updateTeacherCourse = async (courseId, courseData) => {
  try {
    const res = await api.put(`${TEACHER_COURSE_URL}/${courseId}`, courseData);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi cập nhật khóa học:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể cập nhật khóa học");
  }
};

// ✅ Xóa khóa học
export const deleteTeacherCourse = async (courseId) => {
  try {
    const res = await api.delete(`${TEACHER_COURSE_URL}/${courseId}`);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi xóa khóa học:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể xóa khóa học");
  }
};

/* =====================
 * 📚 CHAPTER API
 * ===================== */

// ✅ Tạo chương trong khóa học
export const createChapter = async (courseId, chapterData) => {
  try {
    const res = await api.post(
      `${TEACHER_COURSE_URL}/${courseId}/chapter`,
      chapterData
    );
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi tạo chương:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể tạo chương");
  }
};

// ✅ Cập nhật chương
export const updateChapter = async (chapterId, chapterData) => {
  try {
    const res = await api.put(
      `${TEACHER_COURSE_URL}/chapter/${chapterId}`,
      chapterData
    );
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi cập nhật chương:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể cập nhật chương");
  }
};

// ✅ Xóa chương
export const deleteChapter = async (chapterId) => {
  try {
    const res = await api.delete(
      `${TEACHER_COURSE_URL}/chapter/${chapterId}`
    );
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi xóa chương:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể xóa chương");
  }
};

/* =====================
 * 🎬 VIDEO API
 * ===================== */

// ✅ Tạo video trong chương
export const createVideo = async (chapterId, videoData) => {
  try {
    const res = await api.post(
      `${TEACHER_COURSE_URL}/${chapterId}/video`,
      videoData
    );
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi tạo video:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể tạo video");
  }
};

// ✅ Xóa video
export const deleteVideo = async (videoId) => {
  try {
    const res = await api.delete(
      `${TEACHER_COURSE_URL}/video/${videoId}`
    );
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi xóa video:", err.response || err);
    throw new Error(err.response?.data?.message || "Không thể xóa video");
  }
};

/**
 * ✅ Update video
 */
export const updateVideo = async (videoId, data) => {
  try {
    console.log(`🔄 Updating video ${videoId}...`, data);
    const res = await api.put(
      `${TEACHER_COURSE_URL}/teacher/video/${videoId}`, 
      data
    );
    console.log("✅ Video updated:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi update video:", error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.Message || 
      "Không thể cập nhật video"
    );
  }
};
