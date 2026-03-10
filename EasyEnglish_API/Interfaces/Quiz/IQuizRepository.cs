using EasyEnglish_API.DTOs.Quiz;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Quiz
{
    public interface IQuizRepository
    {
        // quiz
        Task<List<QuizDto>> GetQuizzesByCourseAsync(int courseId);
        Task<List<QuizDto>> GetGlobalQuizzesAsync();
        Task<List<QuizDto>> GetAllGlobalQuizzesAsync();
        Task<QuizDetailDto?> GetQuizDetailAsync(int quizId);

        Task<int> CreateQuizAsync(int? courseId, string title, string? description, byte quizType);
        Task<bool> UpdateQuizAsync(int quizId, string? title, string? description, int quizType, bool? isActive);
        Task<bool> DeleteQuizAsync(int quizId);

        // attempt
        Task<int> CreateAttemptAsync(int quizId, int userId);
        Task<Attempt?> GetAttemptAsync(int attemptId, int userId);
        Task UpdateAttemptAsync(Attempt attempt);

        // question
        Task<List<Question>> GetQuizQuestionsAsync(int quizId);

        // answers
        Task AddAnswersAsync(List<Answer> answers);

        // permission
        Task<bool> TeacherOwnsCourseAsync(int teacherId, int courseId);
        Task<bool> TeacherOwnsQuizAsync(int teacherId, int quizId);

        // history
        Task<List<object>> GetAttemptHistoryAsync(int userId);

        // attempts
        Task<List<object>> GetAttemptsAsync(string role, int userId);

        // GROUP
        Task<int> CreateGroupAsync(int quizId, CreateGroupRequest req);
        Task<bool> UpdateGroupAsync(int groupId, UpdateGroupRequest req);
        Task<bool> DeleteGroupAsync(int groupId);

        // QUESTION
        Task<int> CreateQuestionAsync(int groupId, CreateQuestionRequest req);
        Task<bool> UpdateQuestionAsync(int questionId, UpdateQuestionRequest req);
        Task<bool> DeleteQuestionAsync(int questionId);

        // OPTION
        Task<int> CreateOptionAsync(int questionId, CreateOptionRequest req);
        Task<bool> UpdateOptionAsync(int optionId, UpdateOptionRequest req);
        Task<bool> DeleteOptionAsync(int optionId);

        // ASSET
        Task<int> CreateAssetForGroupAsync(int groupId, CreateAssetRequest req);
        Task<int> CreateAssetForQuestionAsync(int questionId, CreateAssetRequest req);
        Task<bool> DeleteAssetAsync(int assetId);

        Task<int> CreateGlobalQuizAsync(string title, string? description, byte quizType);
        Task<bool> DeleteGlobalQuizAsync(int quizId);
        Task<bool> UpdateGlobalQuizAsync(int quizId, UpdateQuizRequest req);

    }
}
