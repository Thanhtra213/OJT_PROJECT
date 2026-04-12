import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/user/ai-speaking`;

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return { Authorization: `Bearer ${token}` };
};

const parseError = (error) => {
  const data = error.response?.data;
  return (typeof data === "string" && data.trim())
    || data?.message
    || data?.error
    || error?.message
    || "Đã có lỗi xảy ra.";
};
// ✅ API gọi AI tạo đề speaking
export const generateSpeakingPrompt = async () => {
  try {
    const res = await api.post("/generate", {}, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    console.error("Error generating speaking prompt:", err);
    throw new Error(parseError(err));
  }
};

// ✅ API gửi file audio + prompt để chấm điểm
export const submitSpeakingAnswer = async (audioFile, promptId, sendToTeacher = false) => {
  const formData = new FormData();
  formData.append("File", audioFile);
  formData.append("PromptId", promptId);
  formData.append("SendToTeacher", sendToTeacher);
  try {
    const res = await axios.post(`${API_URL}/submit`, formData, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error submitting speaking answer:", err.response?.data);
    throw new Error(parseError(err));
  }
};
