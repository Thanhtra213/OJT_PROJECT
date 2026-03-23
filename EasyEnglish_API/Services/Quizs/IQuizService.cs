using EasyEnglish_API.DTOs.Quizs;

namespace EasyEnglish_API.Interfaces.Quizs
{
    public interface IQuizService
    {
        // ================= USER =================
        Task<List<QuizDto>> GetQuizzesByCourseAsync(int userId, int courseId);
        Task<List<QuizDto>> GetGlobalQuizzesAsync(int userId);
        Task<QuizDetailDto?> GetQuizDetailAsync(int userId, int quizId);

        Task<int> StartQuizAsync(int userId, int quizId);
        Task<SubmitQuizResponse> SubmitQuizAsync(int userId, int attemptId, SubmitQuizRequest req);

        Task<List<object>> GetAttemptHistoryAsync(int userId);

        // ================= TEACHER =================
        Task<List<QuizDto>> GetTeacherQuizzesByCourseAsync(int teacherId, int courseId);

        Task<int> CreateQuizAsync(int teacherId, int courseId, string title, string? description, byte quizType);
        Task<bool> UpdateQuizAsync(int teacherId, int quizId, string? title, string? description, int quizType, bool? isActive);
        Task<bool> DeleteQuizAsync(int teacherId, int quizId);

        Task<int> CreateGroupAsync(int teacherId, int quizId, CreateGroupRequest req);
        Task<bool> UpdateGroupAsync(int teacherId, int groupId, UpdateGroupRequest req);
        Task<bool> DeleteGroupAsync(int teacherId, int groupId);

        Task<int> CreateQuestionAsync(int teacherId, int groupId, CreateQuestionRequest req);
        Task<bool> UpdateQuestionAsync(int teacherId, int questionId, UpdateQuestionRequest req);
        Task<bool> DeleteQuestionAsync(int teacherId, int questionId);

        Task<int> CreateOptionAsync(int teacherId, int questionId, CreateOptionRequest req);
        Task<bool> UpdateOptionAsync(int teacherId, int optionId, UpdateOptionRequest req);
        Task<bool> DeleteOptionAsync(int teacherId, int optionId);

        Task<int> CreateAssetForGroupAsync(int teacherId, int groupId, CreateAssetRequest req);
        Task<int> CreateAssetForQuestionAsync(int teacherId, int questionId, CreateAssetRequest req);
        Task<bool> DeleteAssetAsync(int teacherId, int assetId);

        // ================= ADMIN =================
        Task<List<QuizDto>> GetAllGlobalQuizzesAsync();
        Task<QuizDetailDto?> GetGlobalQuizDetailAsync(int quizId);

        Task<int> CreateGlobalQuizAsync(string title, string? description, byte quizType);
        Task<bool> UpdateGlobalQuizAsync(int quizId, UpdateQuizRequest req);
        Task<bool> DeleteGlobalQuizAsync(int quizId);

        Task<int> CreateGroupAsync(int quizId, CreateGroupRequest req);
        Task<bool> UpdateGroupAsync(int groupId, UpdateGroupRequest req);
        Task<bool> DeleteGroupAsync(int groupId);

        Task<int> CreateQuestionAsync(int groupId, CreateQuestionRequest req);
        Task<bool> UpdateQuestionAsync(int questionId, UpdateQuestionRequest req);
        Task<bool> DeleteQuestionAsync(int questionId);

        Task<int> CreateOptionAsync(int questionId, CreateOptionRequest req);
        Task<bool> UpdateOptionAsync(int optionId, UpdateOptionRequest req);
        Task<bool> DeleteOptionAsync(int optionId);

        Task<int> CreateAssetForGroupAsync(int groupId, CreateAssetRequest req);
        Task<int> CreateAssetForQuestionAsync(int questionId, CreateAssetRequest req);
        Task<bool> DeleteAssetAsync(int assetId);

        Task<List<object>> GetAttemptsAsync(string role, int userId);
    }
}