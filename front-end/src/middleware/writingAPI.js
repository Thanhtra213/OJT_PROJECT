import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/user/ai-writing`;

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

// ✅ Gọi AI để generate đề Writing ngẫu nhiên
export const generateWriting = async () => {
  try {
    const res = await api.post("/generate", {}, { headers: getAuthHeaders() });
    return res.data; // { title, content }
  } catch (err) {
    console.error("Generate writing error:", err);
    throw new Error(parseError(err));
  }
};

// ✅ Nộp bài để AI chấm điểm
export const submitWriting = async (promptId, answerText, sendToTeacher = false) => {
  try {
    const body = { 
      PromptId: promptId, 
      AnswerText: answerText, 
      SendToTeacher: sendToTeacher,
      Category: "Writing"
    };
    const res = await api.post("/submit", body, { headers: getAuthHeaders() });
    return res.data; // { score, taskResponse, coherence, lexicalResource, grammar, feedback, attemptId }
  } catch (err) {
    console.error("Submit writing error:", err);
    throw new Error(parseError(err));
  }
};
