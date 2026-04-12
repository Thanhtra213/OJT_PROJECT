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
  try {
    const res = await fetch(`${BASE_URL}/user/video/progress`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        videoId, 
        watchDurationSec, 
        isCompleted, 
        lastPositionSec,
        totalDurationSec  
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("saveVideoProgress error:", err);
    throw new Error(parseError(err));
  }
};

export const getVideoProgressFromDB = async (videoId) => {
  try {
    const res = await fetch(`${BASE_URL}/user/video/progress/${videoId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("getVideoProgressFromDB error:", err);
    return null;
    
  }
};