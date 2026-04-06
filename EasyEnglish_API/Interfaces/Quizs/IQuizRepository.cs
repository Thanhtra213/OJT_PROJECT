using EasyEnglish_API.Models;
using EasyEnglish_API.DTOs.Quizs;

namespace EasyEnglish_API.Interfaces.Quizs
{
    public interface IQuizRepository
    {
        Task<List<Quiz>> GetQuizzesByCourseAsync(int courseId);
        Task<List<Quiz>> GetAllQuizzesByCourseAsync(int courseId);
        Task<List<Quiz>> GetGlobalQuizzesAsync();
        Task<List<Quiz>> GetAllGlobalQuizzesAsync();
        Task<Quiz?> GetQuizDetailAsync(int quizId);
        Task<Quiz?> CreateQuizAsync(int? courseId, string title, string? description, byte quizType);
        Task<bool> UpdateQuizAsync(int quizId, string? title, string? description, int quizType, bool? isActive);
        Task<bool> DeleteQuizAsync(int quizId);
        Task<Quiz?> CreateGlobalQuizAsync(string title, string? description, byte quizType);
        Task<bool> DeleteGlobalQuizAsync(int quizId);
        Task<bool> UpdateGlobalQuizAsync(int quizId, string? title, string? description, bool? isActive);

        Task<Attempt?> CreateAttemptAsync(int quizId, int userId);
        Task<Attempt?> GetAttemptAsync(int attemptId, int userId);
        Task UpdateAttemptAsync(Attempt attempt);
        Task<List<Attempt>> GetAttemptHistoryAsync(int userId);
        Task<List<Attempt>> GetAttemptsAsync(string role, int userId);

        Task<List<Question>> GetQuizQuestionsAsync(int quizId);

        Task AddAnswersAsync(List<Answer> answers);

        Task<bool> TeacherOwnsCourseAsync(int teacherId, int courseId);
        Task<bool> TeacherOwnsQuizAsync(int teacherId, int quizId);

        Task<QuestionGroup?> CreateGroupAsync(int quizId, QuestionGroup group);
        Task<bool> UpdateGroupAsync(int groupId, QuestionGroup group);
        Task<bool> DeleteGroupAsync(int groupId);

        
        Task<Question?> CreateQuestionAsync(int groupId, Question question);
        Task<bool> UpdateQuestionAsync(int questionId, Question question);
        Task<bool> DeleteQuestionAsync(int questionId);

        Task<Option?> CreateOptionAsync(int questionId, Option option);
        Task<bool> UpdateOptionAsync(int optionId, Option option);
        Task<bool> DeleteOptionAsync(int optionId);

        Task<Asset?> CreateAssetForGroupAsync(int groupId, Asset asset);
        Task<Asset?> CreateAssetForQuestionAsync(int questionId, Asset asset);
        Task<bool> DeleteAssetAsync(int assetId);
    }
}
