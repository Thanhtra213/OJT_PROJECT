// src/middleware/practiceReviewAPI.js
const BASE = `${process.env.REACT_APP_API_URL}/api`;

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

/**
 * Lấy danh sách tất cả bài đã nộp (Speaking + Writing) của user hiện tại.
 * GET /api/user/review/list
 * Returns: [{ submissionId, aireviewId, prompt: {title, content}, scoreOverall, createdAt, isTeacherReviewed }]
 */
export const getReviewList = async () => {
  const res = await fetch(`${BASE}/user/review/list`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Không thể tải danh sách review');
  return res.json();
};

/**
 * Lấy chi tiết một bài đã nộp.
 * GET /api/user/review/{submissionId}
 * Returns: { prompt, answer, aiReview, teacherReview }
 */
export const getReviewDetail = async (submissionId) => {
  const res = await fetch(`${BASE}/user/review/${submissionId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Không thể tải chi tiết review');
  return res.json();
};

/**
 * Lấy danh sách bài Placement Test (system exam, CourseID = null).
 * GET /api/admin/system-exams/view (public access needed – falls back to [])
 */
export const getPlacementTests = async () => {
  try {
    const res = await fetch(`${BASE}/admin/system-exams/view`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
};

/**
 * Helper: phân loại Speaking / Writing dựa vào title của prompt.
 */
export const isSpeakingSubmission = (item) => {
  const t = (item?.prompt?.title || '').toLowerCase();
  return t.includes('speaking') || t.includes('nói');
};
