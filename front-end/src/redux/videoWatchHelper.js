
const getUserHistoryKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.accountID || user.userId || user.id
      || localStorage.getItem("userID")
      || localStorage.getItem("accountID");
    return userId ? `videoWatchHistory_${userId}` : "videoWatchHistory";
  } catch {
    return "videoWatchHistory";
  }
};
export { getUserHistoryKey };


export const updateVideoHistory = (videoData, currentTimeSec = 0, durationSec = 0) => {
  try {
    if (!videoData || !videoData.lessonID || !videoData.courseID) {
      console.error("❌ Invalid videoData:", videoData);
      return null;
    }

    if (durationSec <= 0) {
      console.warn("⚠️ Invalid durationSec:", durationSec);
      return null;
    }

    const historyKey = getUserHistoryKey();
    const historyStr = localStorage.getItem(historyKey);
    let history = [];
    try {
      history = historyStr ? JSON.parse(historyStr) : [];
      if (!Array.isArray(history)) history = [];
    } catch { history = []; }

    // ✅ Lưu giây thực, KHÔNG convert sang phút ở đây
    // Home.js sẽ format khi hiển thị
    const progressPercent = Math.round((currentTimeSec / durationSec) * 100);
    const finalProgress = progressPercent >= 95 ? 100 : Math.min(progressPercent, 100);

    const videoEntry = {
      id: `${videoData.courseID}-${videoData.lessonID}`,
      courseID: videoData.courseID,
      courseName: videoData.courseName || "Course",
      lessonID: videoData.lessonID,
      lessonTitle: videoData.lessonTitle || videoData.title || "Video",
      durationSec: Math.round(durationSec),       // ✅ Lưu giây
      currentTimeSec: Math.round(currentTimeSec), // ✅ Lưu giây
      watchedSec: finalProgress >= 100            // ✅ Lưu giây
        ? Math.round(durationSec)
        : Math.round(currentTimeSec),
      progress: finalProgress,
      lastWatched: new Date().toISOString(),

      // Legacy fields - giữ để không break code cũ, nhưng tính đúng
      duration: Math.round(durationSec / 60),       // phút (cho code cũ)
      watchedMinutes: finalProgress >= 100           // phút (cho code cũ)
        ? Math.round(durationSec / 60)
        : Math.round(currentTimeSec / 60),
      currentTime: Math.round(currentTimeSec),
    };

    const existingIndex = history.findIndex(
      item => item.courseID === videoData.courseID &&
        (item.lessonID === videoData.lessonID || item.id === videoData.lessonID)
    );

    if (existingIndex >= 0) {
      const existing = history[existingIndex];
      if (finalProgress > (existing.progress || 0) || finalProgress >= 100) {
        history[existingIndex] = { ...existing, ...videoEntry };
        console.log(`✅ Updated progress: ${existing.progress}% → ${finalProgress}%`);
      } else {
        history[existingIndex].lastWatched = new Date().toISOString();
      }
    } else {
      history.unshift(videoEntry);
      console.log("✅ Added new video to history");
    }

    if (history.length > 100) history.length = 100;
    localStorage.setItem(historyKey, JSON.stringify(history));
    return videoEntry;
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật lịch sử:', error);
    return null;
  }
};

export const saveVideoHistory = (videoData, currentTimeSec, durationSec) => {
  return updateVideoHistory(videoData, currentTimeSec, durationSec);
};

export const getVideoHistory = () => {
  try {
    const historyKey = getUserHistoryKey();
    const historyStr = localStorage.getItem(historyKey);
    if (!historyStr) return [];
    const history = JSON.parse(historyStr);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('❌ Lỗi khi đọc lịch sử:', error);
    return [];
  }
};

export const getVideoProgress = (lessonID) => {
  try {
    const history = getVideoHistory();
    return history.find(
      item => item.lessonID === lessonID || item.id === lessonID
    ) || null;
  } catch (error) {
    console.error("❌ Error getting video progress:", error);
    return null;
  }
};

export const migrateVideoHistory = (accountId) => {
  if (!accountId) return;
  const newKey = `videoWatchHistory_${accountId}`;
  const oldKey = 'videoWatchHistory';

  // Nếu key mới chưa có data nhưng key cũ có → migrate
  const oldData = localStorage.getItem(oldKey);
  const newData = localStorage.getItem(newKey);

  if (oldData && !newData) {
    localStorage.setItem(newKey, oldData);
    console.log(`✅ Migrated history to ${newKey}`);
  }
  // Xóa key cũ để không bị share nữa
  localStorage.removeItem(oldKey);
};

export const markVideoAsCompleted = (lessonID) => {
  try {
    const history = getVideoHistory();
    const existingIndex = history.findIndex(
      item => item.lessonID === lessonID || item.id === lessonID
    );
    if (existingIndex !== -1) {
      const entry = history[existingIndex];
      const dur = entry.durationSec || (entry.duration * 60) || 0;
      history[existingIndex] = {
        ...entry,
        progress: 100,
        watchedSec: dur,
        watchedMinutes: Math.round(dur / 60),
        durationSec: dur,
        lastWatched: new Date().toISOString(),
      };
      const historyKey = getUserHistoryKey();
      localStorage.setItem(historyKey, JSON.stringify(history));
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error marking video as completed:", error);
    return false;
  }
};

export const clearVideoHistory = () => {
  try {
    localStorage.removeItem(getUserHistoryKey());
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi xóa lịch sử:', error);
    return false;
  }
};

export const removeVideoFromHistory = (courseID, lessonID) => {
  try {
    const history = getVideoHistory();
    const newHistory = history.filter(
      item => !(item.courseID === courseID &&
        (item.lessonID === lessonID || item.id === lessonID))
    );
    localStorage.setItem(getUserHistoryKey(), JSON.stringify(newHistory));
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi xóa video:', error);
    return false;
  }
};

export const cleanVideoHistoryData = () => {
  try {
    const history = getVideoHistory();
    if (history.length === 0) return [];
    const cleanedHistory = history.map(entry => {
      const durSec = Math.max(0, Math.round(Number(entry.durationSec || entry.duration * 60) || 0));
      const watchSec = Math.max(0, Math.round(Number(entry.watchedSec || entry.watchedMinutes * 60) || 0));
      const progress = Math.max(0, Math.min(100, Math.round(Number(entry.progress) || 0)));
      const finalWatchSec = Math.min(watchSec, durSec);
      const finalProgress = progress >= 95 ? 100 : progress;
      return {
        ...entry,
        durationSec: durSec,
        duration: Math.round(durSec / 60),
        watchedSec: finalProgress >= 100 ? durSec : finalWatchSec,
        watchedMinutes: Math.round((finalProgress >= 100 ? durSec : finalWatchSec) / 60),
        progress: finalProgress,
      };
    });
    localStorage.setItem(getUserHistoryKey(), JSON.stringify(cleanedHistory));
    return cleanedHistory;
  } catch (error) {
    console.error("❌ Error cleaning video history:", error);
    return [];
  }
};

export default {
  updateVideoHistory, saveVideoHistory, getVideoHistory,
  getVideoProgress, markVideoAsCompleted, clearVideoHistory,
  removeVideoFromHistory, cleanVideoHistoryData,
};