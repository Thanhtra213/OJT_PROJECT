const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
};
const parseError = (error) => {
  const data = error.response?.data;
  return (typeof data === "string" && data.trim())
    || data?.message
    || data?.error
    || error?.message
    || "Đã có lỗi xảy ra.";
};

export const saveVideoProgress = async (videoId, watchDurationSec, isCompleted, lastPositionSec = null, totalDurationSec = null) => {
  // ✅ Chưa đăng nhập thì không gọi API
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/user/video/progress`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        videoId,
        watchDurationSec,
        isCompleted,
        lastPositionSec,
        totalDurationSec,
      }),
    });

    // ✅ 401 → không throw, chỉ return null im lặng
    if (res.status === 401) return null;

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("saveVideoProgress skipped:", err.message);
    return null;
  }
};

export const getVideoProgressFromDB = async (videoId) => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/user/video/progress/${videoId}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("getVideoProgressFromDB skipped:", err.message);
    return null;
  }
};

