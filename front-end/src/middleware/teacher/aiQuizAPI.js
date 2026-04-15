import api from "../axiosInstance";

const AI_QUIZ_URL = "/teacher/ai-quiz";

export const generateAIQuiz = async (prompt) => {
  try {
    if (!prompt || !prompt.trim()) {
      throw new Error("Prompt không được để trống");
    }

    console.log("Generating AI quiz with prompt:", prompt);

    // Sử dụng instance 'api' đã có interceptor xử lý Authorization và refresh token
    const response = await api.post(
      `${AI_QUIZ_URL}/generate`,
      { prompt: prompt.trim() },
      { 
        timeout: 60000, // 60 seconds timeout for AI generation
      }
    );

    console.log("✅ AI quiz generated:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Generate AI quiz error:", error);
    
    if (error.code === "ECONNABORTED") {
      throw new Error("AI generation timeout - Vui lòng thử lại");
    }
    
    // axiosInstance đã xử lý 401 redirect, nhưng ta vẫn ném lỗi để UI nhận biết
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Phiên đăng nhập hết hạn hoặc không có quyền. Vui lòng đăng nhập lại.");
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      "Không thể tạo quiz bằng AI"
    );
  }
};

export const parseAIQuizResponse = (aiResponse) => {
  try {
    // Nếu có json field, parse nó
    if (aiResponse.json) {
      const parsed = typeof aiResponse.json === 'string' 
        ? JSON.parse(aiResponse.json) 
        : aiResponse.json;
      
      return {
        title: parsed.Title || parsed.title || "AI Generated Quiz",
        description: parsed.Description || parsed.description || "",
        questions: parsed.Questions || parsed.questions || []
      };
    }
    
    // Fallback: parse rawText nếu có
    if (aiResponse.rawText) {
      const parsed = JSON.parse(aiResponse.rawText);
      return {
        title: parsed.Title || parsed.title || "AI Generated Quiz",
        description: parsed.Description || parsed.description || "",
        questions: parsed.Questions || parsed.questions || []
      };
    }
    
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("❌ Parse AI quiz error:", error);
    throw new Error("Không thể parse dữ liệu từ AI");
  }
};

export const convertAIQuestionsToImportFormat = (questions) => {
  return questions.map((q) => {
    const qType = q.QuestionType || q.questionType || 1;
    const rawOptions = q.Options || q.options || [];

    // ✅ MCQ
    if (qType === 1) {
      const correctIndex = rawOptions.findIndex(
        (o) => o.IsCorrect === true || o.isCorrect === true
      );

      return {
        content: q.Content || q.content || "",
        questionType: 1,
        options: rawOptions.map((o) => ({
          content: o.Content || o.content || "",
          isCorrect: o.IsCorrect ?? o.isCorrect ?? false,
        })),
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        scoreWeight: q.ScoreWeight || q.scoreWeight || 1,
      };
    }

    // ✅ TYPE 2 & 3
    const answerOpt = rawOptions[0];
    const answerText =
      typeof answerOpt === "string"
        ? answerOpt
        : answerOpt?.Content || answerOpt?.content || "";

    return {
      content: q.Content || q.content || "",
      questionType: qType, // 🔥 GIỮ NGUYÊN
      options: [
        {
          content: answerText,
          isCorrect: true,
        },
      ],
      correctIndex: 0,
      scoreWeight: q.ScoreWeight || q.scoreWeight || 1,
    };
  });
};
export default {
  generateAIQuiz,
  parseAIQuizResponse,
  convertAIQuestionsToImportFormat,
};