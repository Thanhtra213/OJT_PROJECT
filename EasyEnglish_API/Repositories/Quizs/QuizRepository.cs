using EasyEnglish_API.Data;
using EasyEnglish_API.DTOs.Quiz;
using EasyEnglish_API.Interfaces.Quiz;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Quizs
{
    public class QuizRepository : IQuizRepository
    {
        private readonly EasyEnglishDbContext _db;

        public QuizRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<List<QuizDto>> GetQuizzesByCourseAsync(int courseId)
        {
            return await _db.Quizzes
                .Where(q => q.CourseId == courseId && q.IsActive)
                .Select(q => new QuizDto
                {
                    QuizID = q.QuizId,
                    Title = q.Title,
                    Description = q.Description,
                    QuizType = q.QuizType
                }).ToListAsync();
        }

        public async Task<List<QuizDto>> GetGlobalQuizzesAsync()
        {
            return await _db.Quizzes
                .Where(q => q.CourseId == null && q.IsActive)
                .Select(q => new QuizDto
                {
                    QuizID = q.QuizId,
                    Title = q.Title,
                    Description = q.Description,
                    QuizType = q.QuizType
                }).ToListAsync();
        }

        public async Task<List<QuizDto>> GetAllGlobalQuizzesAsync()
        {
            return await _db.Quizzes
                .Where(q => q.CourseId == null)
                .Select(q => new QuizDto
                {
                    QuizID = q.QuizId,
                    Title = q.Title,
                    Description = q.Description,
                    QuizType = q.QuizType
                }).ToListAsync();
        }

        public async Task<QuizDetailDto?> GetQuizDetailAsync(int quizId)
        {
            var quiz = await _db.Quizzes
                .FirstOrDefaultAsync(q => q.QuizId == quizId);

            if (quiz == null) return null;

            return new QuizDetailDto
            {
                QuizID = quiz.QuizId,
                Title = quiz.Title,
                Description = quiz.Description,
                QuizType = quiz.QuizType
            };
        }

        public async Task<int> CreateQuizAsync(int? courseId, string title, string? description, byte quizType)
        {
            var quiz = new Quiz
            {
                CourseId = courseId,
                Title = title,
                Description = description,
                QuizType = quizType,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _db.Quizzes.Add(quiz);
            await _db.SaveChangesAsync();

            return quiz.QuizId;
        }

        public async Task<bool> UpdateQuizAsync(int quizId, string? title, string? description, int quizType, bool? isActive)
        {
            var quiz = await _db.Quizzes.FindAsync(quizId);
            if (quiz == null) return false;

            if (title != null) quiz.Title = title;
            if (description != null) quiz.Description = description;
            if (quizType > 0) quiz.QuizType = (byte)quizType;
            if (isActive.HasValue) quiz.IsActive = isActive.Value;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteQuizAsync(int quizId)
        {
            var quiz = await _db.Quizzes.FindAsync(quizId);
            if (quiz == null) return false;

            _db.Quizzes.Remove(quiz);
            await _db.SaveChangesAsync();

            return true;
        }

        public async Task<int> CreateAttemptAsync(int quizId, int userId)
        {
            var attempt = new Attempt
            {
                QuizId = quizId,
                UserId = userId,
                Status = "IN_PROGRESS",
                StartedAt = DateTime.UtcNow
            };

            _db.Attempts.Add(attempt);
            await _db.SaveChangesAsync();

            return attempt.AttemptId;
        }

        public Task<Attempt?> GetAttemptAsync(int attemptId, int userId)
        {
            return _db.Attempts
                .FirstOrDefaultAsync(a => a.AttemptId == attemptId && a.UserId == userId);
        }

        public async Task UpdateAttemptAsync(Attempt attempt)
        {
            _db.Attempts.Update(attempt);
            await _db.SaveChangesAsync();
        }

        public async Task<List<Question>> GetQuizQuestionsAsync(int quizId)
        {
            return await _db.Questions
                .Where(q => q.QuizId == quizId)
                .Include(q => q.Options)
                .ToListAsync();
        }

        public async Task AddAnswersAsync(List<Answer> answers)
        {
            _db.Answers.AddRange(answers);
            await _db.SaveChangesAsync();
        }

        public Task<bool> TeacherOwnsCourseAsync(int teacherId, int courseId)
        {
            return _db.Courses
                .AnyAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
        }

        public Task<bool> TeacherOwnsQuizAsync(int teacherId, int quizId)
        {
            return _db.Quizzes
                .Include(q => q.Course)
                .AnyAsync(q => q.QuizId == quizId && q.Course.TeacherId == teacherId);
        }

        public async Task<List<object>> GetAttemptHistoryAsync(int userId)
        {
            return await _db.Attempts
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.StartedAt)
                .Select(a => new
                {
                    a.AttemptId,
                    a.QuizId,
                    a.StartedAt,
                    a.SubmittedAt,
                    a.Status,
                    a.AutoScore
                } as object)
                .ToListAsync();
        }

        public async Task<List<object>> GetAttemptsAsync(string role, int userId)
        {
            return await _db.Attempts
                .Include(a => a.Quiz)
                .OrderByDescending(a => a.SubmittedAt)
                .Select(a => new
                {
                    a.AttemptId,
                    a.QuizId,
                    QuizTitle = a.Quiz.Title,
                    a.SubmittedAt,
                    a.AutoScore,
                    a.Status,
                    StudentID = a.UserId
                } as object)
                .ToListAsync();
        }

        // GROUP CRUD
        // =====================================================
        public async Task<int> CreateGroupAsync(int quizId, CreateGroupRequest req)
        {
            var group = new QuestionGroup
            {
                QuizId = quizId,
                Instruction = req.Instruction,
                GroupType = req.GroupType,
                GroupOrder = req.GroupOrder
            };

            _db.QuestionGroups.Add(group);
            await _db.SaveChangesAsync();
            return group.GroupId;
        }

        public async Task<bool> UpdateGroupAsync(int groupId, UpdateGroupRequest req)
        {
            var group = await _db.QuestionGroups.FindAsync(groupId);
            if (group == null) return false;

            if (req.Instruction != null)
                group.Instruction = req.Instruction;

            if (req.GroupType.HasValue)
                group.GroupType = req.GroupType.Value;

            if (req.GroupOrder.HasValue)
                group.GroupOrder = req.GroupOrder.Value;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteGroupAsync(int groupId)
        {
            // tìm group
            var group = await _db.QuestionGroups.FindAsync(groupId);
            if (group == null) return false;

            // 1) lấy question của group
            var questionIds = await _db.Questions
                .Where(q => q.GroupId == groupId)
                .Select(q => q.QuestionId)
                .ToListAsync();

            // 2) xoá option
            if (questionIds.Any())
            {
                _db.Options.RemoveRange(
                    _db.Options.Where(o => questionIds.Contains(o.QuestionId))
                );
            }

            // 3) xoá assets (của question)
            if (questionIds.Any())
            {
                _db.Assets.RemoveRange(
                    _db.Assets.Where(a => a.OwnerType == 2 && questionIds.Contains(a.OwnerId))
                );
            }

            // 4) xoá question
            if (questionIds.Any())
            {
                _db.Questions.RemoveRange(
                    _db.Questions.Where(q => questionIds.Contains(q.QuestionId))
                );
            }

            // 5) xoá assets của group
            _db.Assets.RemoveRange(
                _db.Assets.Where(a => a.OwnerType == 1 && a.OwnerId == groupId)
            );

            // 6) xoá group
            _db.QuestionGroups.Remove(group);

            await _db.SaveChangesAsync();
            return true;
        }

        // =====================================================
        // QUESTION CRUD
        // =====================================================
        public async Task<int> CreateQuestionAsync(int groupId, CreateQuestionRequest req)
        {
            // Lấy QuizID từ Group
            var quizId = await _db.QuestionGroups
                .Where(g => g.GroupId == groupId)
                .Select(g => g.QuizId)
                .FirstOrDefaultAsync();

            if (quizId == 0)
                throw new Exception("Group not found");

            var question = new Question
            {
                QuizId = quizId,
                GroupId = groupId,
                Content = req.Content,
                QuestionType = req.QuestionType,
                QuestionOrder = req.QuestionOrder,
                ScoreWeight = req.ScoreWeight,
                MetaJson = req.MetaJson
            };

            _db.Questions.Add(question);
            await _db.SaveChangesAsync();
            return question.QuestionId;
        }

        public async Task<bool> UpdateQuestionAsync(int questionId, UpdateQuestionRequest req)
        {
            var question = await _db.Questions.FindAsync(questionId);
            if (question == null) return false;

            if (req.Content != null)
                question.Content = req.Content;

            if (req.QuestionType.HasValue)
                question.QuestionType = req.QuestionType.Value;

            if (req.QuestionOrder.HasValue)
                question.QuestionOrder = req.QuestionOrder.Value;

            if (req.ScoreWeight.HasValue)
                question.ScoreWeight = req.ScoreWeight.Value;

            if (req.MetaJson != null)
                question.MetaJson = req.MetaJson;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteQuestionAsync(int questionId)
        {
            var question = await _db.Questions.FindAsync(questionId);
            if (question == null) return false;

            // 1) xoá options
            _db.Options.RemoveRange(
                _db.Options.Where(o => o.QuestionId == questionId)
            );

            // 2) xoá assets của question
            _db.Assets.RemoveRange(
                _db.Assets.Where(a => a.OwnerType == 2 && a.OwnerId == questionId)
            );

            // 3) xoá chính câu hỏi
            _db.Questions.Remove(question);

            await _db.SaveChangesAsync();
            return true;
        }
        // =====================================================
        // OPTION CRUD
        // =====================================================

        public async Task<int> CreateOptionAsync(int questionId, CreateOptionRequest req)
        {
            // Kiểm tra question có tồn tại không
            var exists = await _db.Questions.AnyAsync(q => q.QuestionId == questionId);
            if (!exists)
                throw new Exception("Question not found");

            var option = new Option
            {
                QuestionId = questionId,
                Content = req.Content,
                IsCorrect = req.IsCorrect
            };

            _db.Options.Add(option);
            await _db.SaveChangesAsync();
            return option.OptionId;
        }

        public async Task<bool> UpdateOptionAsync(int optionId, UpdateOptionRequest req)
        {
            var option = await _db.Options.FindAsync(optionId);
            if (option == null) return false;

            if (req.Content != null)
                option.Content = req.Content;

            if (req.IsCorrect.HasValue)
                option.IsCorrect = req.IsCorrect.Value;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteOptionAsync(int optionId)
        {
            var option = await _db.Options.FindAsync(optionId);
            if (option == null) return false;

            _db.Options.Remove(option);
            await _db.SaveChangesAsync();
            return true;
        }
        // =====================================================
        // ASSET CRUD
        // =====================================================

        public async Task<int> CreateAssetForGroupAsync(int groupId, CreateAssetRequest req)
        {
            var exists = await _db.QuestionGroups.AnyAsync(g => g.GroupId == groupId);
            if (!exists)
                throw new Exception("Group not found");

            var asset = new Asset
            {
                OwnerType = 1,
                OwnerId = groupId,
                AssetType = req.AssetType,
                Url = req.Url,
                ContentText = req.ContentText,
                Caption = req.Caption,
                MimeType = req.MimeType
            };

            _db.Assets.Add(asset);
            await _db.SaveChangesAsync();
            return asset.AssetId;
        }

        public async Task<int> CreateAssetForQuestionAsync(int questionId, CreateAssetRequest req)
        {
            var exists = await _db.Questions.AnyAsync(q => q.QuestionId == questionId);
            if (!exists)
                throw new Exception("Question not found");

            var asset = new Asset
            {
                OwnerType = 2,
                OwnerId = questionId,
                AssetType = req.AssetType,
                Url = req.Url,
                ContentText = req.ContentText,
                Caption = req.Caption,
                MimeType = req.MimeType
            };

            _db.Assets.Add(asset);
            await _db.SaveChangesAsync();
            return asset.AssetId;
        }

        public async Task<bool> DeleteAssetAsync(int assetId)
        {
            var asset = await _db.Assets.FindAsync(assetId);
            if (asset == null) return false;

            _db.Assets.Remove(asset);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> CreateGlobalQuizAsync(string title, string? description, byte quizType)
        {
            var quiz = new Quiz
            {
                CourseId = null,
                Title = title,
                Description = description,
                QuizType = quizType,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Quizzes.Add(quiz);
            await _db.SaveChangesAsync();
            return quiz.QuizId;
        }

        public async Task<bool> DeleteGlobalQuizAsync(int quizId)
        {
            return await DeleteQuizAsync(quizId);
        }

        public async Task<bool> UpdateGlobalQuizAsync(int quizId, UpdateQuizRequest req)
        {
            var quiz = await _db.Quizzes.FindAsync(quizId);
            if (quiz == null) return false;

            if (req.Title != null)
                quiz.Title = req.Title;

            if (req.Description != null)
                quiz.Description = req.Description;

            if (!string.IsNullOrWhiteSpace(req.QuizType) &&
                byte.TryParse(req.QuizType, out var qt))
                quiz.QuizType = qt;

            if (req.IsActive.HasValue)
                quiz.IsActive = req.IsActive.Value;

            await _db.SaveChangesAsync();
            return true;
        }
    }
}

