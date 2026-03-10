using EasyEnglish_API.DTOs.Quiz;
using EasyEnglish_API.Interfaces.Quiz;
using EasyEnglish_API.Models;
using EasyEnglish_API.Interfaces.Membership;

namespace EasyEnglish_API.Services
{
    public class QuizService : IQuizService
    {
        private readonly IQuizRepository _repo;
        private readonly IMembershipRepository _membership;

        public QuizService(IQuizRepository repo, IMembershipRepository membership)
        {
            _repo = repo;
            _membership = membership;
        }

        // ================= USER =================

        public async Task<List<QuizDto>> GetQuizzesByCourseAsync(int userId, int courseId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");

            return await _repo.GetQuizzesByCourseAsync(courseId);
        }

        public async Task<List<QuizDto>> GetGlobalQuizzesAsync(int userId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");

            return await _repo.GetGlobalQuizzesAsync();
        }

        public async Task<QuizDetailDto?> GetQuizDetailAsync(int userId, int quizId)
        {
            var quiz = await _repo.GetQuizDetailAsync(quizId);

            if (quiz == null)
                throw new Exception("Quiz not found");

            return quiz;
        }

        public async Task<int> StartQuizAsync(int userId, int quizId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");

            return await _repo.CreateAttemptAsync(quizId, userId);
        }

        public async Task<decimal?> SubmitQuizAsync(int userId, int attemptId, SubmitQuizRequest req)
        {
            if (req.Answers == null || !req.Answers.Any())
                throw new Exception("Answers cannot be empty");

            var attempt = await _repo.GetAttemptAsync(attemptId, userId);

            if (attempt == null)
                return null;

            if (attempt.Status != "IN_PROGRESS")
                throw new Exception("Quiz already submitted");

            var questions = await _repo.GetQuizQuestionsAsync(attempt.QuizId);

            if (!questions.Any())
                throw new Exception("Quiz has no questions");

            decimal perQuestion = 100m / questions.Count;
            decimal totalScore = 0;

            var answers = new List<Answer>();

            foreach (var ans in req.Answers)
            {
                var q = questions.FirstOrDefault(x => x.QuestionId == ans.QuestionID);
                if (q == null) continue;

                bool correct = q.Options.Any(o =>
                    o.OptionId == ans.OptionID && o.IsCorrect);

                decimal score = correct ? perQuestion : 0;

                if (correct)
                    totalScore += perQuestion;

                answers.Add(new Answer
                {
                    AttemptId = attemptId,
                    QuestionId = q.QuestionId,
                    OptionId = ans.OptionID,
                    AnswerText = ans.AnswerText,
                    AnsweredAt = DateTime.UtcNow,
                    GradedScore = score
                });
            }

            totalScore = Math.Round(totalScore, 2);

            await _repo.AddAnswersAsync(answers);

            attempt.Status = "SUBMITTED";
            attempt.SubmittedAt = DateTime.UtcNow;
            attempt.AutoScore = totalScore;

            await _repo.UpdateAttemptAsync(attempt);

            return totalScore;
        }

        public Task<List<object>> GetAttemptHistoryAsync(int userId)
            => _repo.GetAttemptHistoryAsync(userId);

        // ================= TEACHER =================

        public async Task<List<QuizDto>> GetTeacherQuizzesByCourseAsync(int teacherId, int courseId)
        {
            if (!await _repo.TeacherOwnsCourseAsync(teacherId, courseId))
                throw new Exception("Forbidden");

            return await _repo.GetQuizzesByCourseAsync(courseId);
        }

        public async Task<int> CreateQuizAsync(int teacherId, int courseId, string title, string? description, byte quizType)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new Exception("Title cannot be empty");

            if (!await _repo.TeacherOwnsCourseAsync(teacherId, courseId))
                throw new Exception("Forbidden");

            return await _repo.CreateQuizAsync(courseId, title, description, quizType);
        }

        public async Task<bool> UpdateQuizAsync(int teacherId, int quizId, string? title, string? description, int quizType, bool? isActive)
        {
            if (!await _repo.TeacherOwnsQuizAsync(teacherId, quizId))
                throw new Exception("Forbidden");

            return await _repo.UpdateQuizAsync(quizId, title, description, quizType, isActive);
        }

        public async Task<bool> DeleteQuizAsync(int teacherId, int quizId)
        {
            if (!await _repo.TeacherOwnsQuizAsync(teacherId, quizId))
                throw new Exception("Forbidden");

            return await _repo.DeleteQuizAsync(quizId);
        }

        // GROUP

        public async Task<int> CreateGroupAsync(int teacherId, int quizId, CreateGroupRequest req)
        {
            if (teacherId != 0)
            {
                if (!await _repo.TeacherOwnsQuizAsync(teacherId, quizId))
                    throw new Exception("Forbidden");
            }

            return await _repo.CreateGroupAsync(quizId, req);
        }

        public Task<bool> UpdateGroupAsync(int teacherId, int groupId, UpdateGroupRequest req)
            => _repo.UpdateGroupAsync(groupId, req);

        public Task<bool> DeleteGroupAsync(int teacherId, int groupId)
            => _repo.DeleteGroupAsync(groupId);

        // QUESTION

        public async Task<int> CreateQuestionAsync(int teacherId, int groupId, CreateQuestionRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Question content required");

            return await _repo.CreateQuestionAsync(groupId, req);
        }

        public Task<bool> UpdateQuestionAsync(int teacherId, int questionId, UpdateQuestionRequest req)
            => _repo.UpdateQuestionAsync(questionId, req);

        public Task<bool> DeleteQuestionAsync(int teacherId, int questionId)
            => _repo.DeleteQuestionAsync(questionId);

        // OPTION

        public async Task<int> CreateOptionAsync(int teacherId, int questionId, CreateOptionRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Option content required");

            return await _repo.CreateOptionAsync(questionId, req);
        }

        public Task<bool> UpdateOptionAsync(int teacherId, int optionId, UpdateOptionRequest req)
            => _repo.UpdateOptionAsync(optionId, req);

        public Task<bool> DeleteOptionAsync(int teacherId, int optionId)
            => _repo.DeleteOptionAsync(optionId);

        // ASSET

        public Task<int> CreateAssetForGroupAsync(int teacherId, int groupId, CreateAssetRequest req)
            => _repo.CreateAssetForGroupAsync(groupId, req);

        public Task<int> CreateAssetForQuestionAsync(int teacherId, int questionId, CreateAssetRequest req)
            => _repo.CreateAssetForQuestionAsync(questionId, req);

        public Task<bool> DeleteAssetAsync(int teacherId, int assetId)
            => _repo.DeleteAssetAsync(assetId);

        // ================= ADMIN =================

        public Task<List<QuizDto>> GetAllGlobalQuizzesAsync()
            => _repo.GetAllGlobalQuizzesAsync();

        public async Task<QuizDetailDto?> GetGlobalQuizDetailAsync(int quizId)
        {
            var quiz = await _repo.GetQuizDetailAsync(quizId);

            if (quiz == null)
                throw new Exception("Quiz not found");

            return quiz;
        }

        public async Task<int> CreateGlobalQuizAsync(string title, string? description, byte quizType)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new Exception("Title cannot be empty");

            return await _repo.CreateQuizAsync(null, title, description, quizType);
        }

        public async Task<bool> UpdateGlobalQuizAsync(int quizId, UpdateQuizRequest req)
        {
            if (req == null)
                throw new Exception("Invalid data");

            return await _repo.UpdateQuizAsync(
                quizId,
                req.Title,
                req.Description,
                int.Parse(req.QuizType),
                req.IsActive
            );
        }

        public Task<bool> DeleteGlobalQuizAsync(int quizId)
            => _repo.DeleteQuizAsync(quizId);

        public async Task<int> CreateGroupAsync(int quizId, CreateGroupRequest req)
        {
            if (req == null)
                throw new Exception("Invalid group data");

            return await _repo.CreateGroupAsync(quizId, req);
        }

        public Task<bool> UpdateGroupAsync(int groupId, UpdateGroupRequest req)
        {
            if (req == null)
                throw new Exception("Invalid group data");

            return _repo.UpdateGroupAsync(groupId, req);
        }

        public Task<bool> DeleteGroupAsync(int groupId)
            => _repo.DeleteGroupAsync(groupId);


        // QUESTION

        public async Task<int> CreateQuestionAsync(int groupId, CreateQuestionRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Question content required");

            return await _repo.CreateQuestionAsync(groupId, req);
        }

        public Task<bool> UpdateQuestionAsync(int questionId, UpdateQuestionRequest req)
        {
            if (req == null)
                throw new Exception("Invalid question data");

            return _repo.UpdateQuestionAsync(questionId, req);
        }

        public Task<bool> DeleteQuestionAsync(int questionId)
            => _repo.DeleteQuestionAsync(questionId);


        // OPTION

        public async Task<int> CreateOptionAsync(int questionId, CreateOptionRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Option content required");

            return await _repo.CreateOptionAsync(questionId, req);
        }

        public Task<bool> UpdateOptionAsync(int optionId, UpdateOptionRequest req)
        {
            if (req == null)
                throw new Exception("Invalid option data");

            return _repo.UpdateOptionAsync(optionId, req);
        }

        public Task<bool> DeleteOptionAsync(int optionId)
            => _repo.DeleteOptionAsync(optionId);


        // ASSET

        public async Task<int> CreateAssetForGroupAsync(int groupId, CreateAssetRequest req)
        {
            if (req == null)
                throw new Exception("Invalid asset data");

            return await _repo.CreateAssetForGroupAsync(groupId, req);
        }

        public async Task<int> CreateAssetForQuestionAsync(int questionId, CreateAssetRequest req)
        {
            if (req == null)
                throw new Exception("Invalid asset data");

            return await _repo.CreateAssetForQuestionAsync(questionId, req);
        }

        public Task<bool> DeleteAssetAsync(int assetId)
            => _repo.DeleteAssetAsync(assetId);

        public Task<List<object>> GetAttemptsAsync(string role, int userId)
            => _repo.GetAttemptsAsync(role, userId);
    }
}