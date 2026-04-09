using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Quizs;
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

        public async Task<List<Quiz>> GetQuizzesByCourseAsync(int courseId)
        {
            return await _db.Quizzes
                .Where(q => q.CourseId == courseId && q.IsActive)
                .ToListAsync();
        }

        public async Task<List<Quiz>> GetAllQuizzesByCourseAsync(int courseId)
        {
            return await _db.Quizzes
                .Where(q => q.CourseId == courseId)
                .ToListAsync();
        }

        public async Task<List<Quiz>> GetGlobalQuizzesAsync()
        {
            return await _db.Quizzes
                .Where(q => q.CourseId == null && q.IsActive)
                .ToListAsync();
        }

        public async Task<List<Quiz>> GetAllGlobalQuizzesAsync()
        {
            return await _db.Quizzes
                .Where(q => q.CourseId == null)
                .ToListAsync();
        }

        public async Task<Quiz?> GetQuizDetailAsync(int quizId)
        {
            return await _db.Quizzes
                .Include(q => q.QuestionGroups)
                    .ThenInclude(g => g.Questions)
                        .ThenInclude(q => q.Options)
                .Include(q => q.Questions)
                    .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(q => q.QuizId == quizId);
        }

        public async Task<Quiz?> CreateQuizAsync(int? courseId, string title, string? description, byte quizType)
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
            return quiz;
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

            // Check if attempt exists
            bool hasAttempts = await _db.Attempts.AnyAsync(a => a.QuizId == quizId);
            if (hasAttempts)
                throw new Exception("Không thể xóa Quiz vì đã có học viên làm bài.");

            var groupIds = await _db.QuestionGroups.Where(g => g.QuizId == quizId).Select(g => g.GroupId).ToListAsync();
            var questionIds = await _db.Questions.Where(q => q.QuizId == quizId).Select(q => q.QuestionId).ToListAsync();

            if (questionIds.Any())
            {
                var questionIdsStr = string.Join(",", questionIds);
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Answer] WHERE QuestionId IN ({questionIdsStr})");
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Option] WHERE QuestionId IN ({questionIdsStr})");
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Asset] WHERE OwnerType = 2 AND OwnerId IN ({questionIdsStr})");
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Question] WHERE QuestionId IN ({questionIdsStr})");
            }

            if (groupIds.Any())
            {
                var groupIdsStr = string.Join(",", groupIds);
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Asset] WHERE OwnerType = 1 AND OwnerId IN ({groupIdsStr})");
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [QuestionGroup] WHERE GroupId IN ({groupIdsStr})");
            }

            _db.Quizzes.Remove(quiz);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<Quiz?> CreateGlobalQuizAsync(string title, string? description, byte quizType)
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
            return quiz;
        }

        public async Task<bool> DeleteGlobalQuizAsync(int quizId)
        {
            return await DeleteQuizAsync(quizId);
        }

        public async Task<bool> UpdateGlobalQuizAsync(int quizId, string? title, string? description, bool? isActive)
        {
            var quiz = await _db.Quizzes.FindAsync(quizId);
            if (quiz == null) return false;

            if (title != null) quiz.Title = title;
            if (description != null) quiz.Description = description;
            if (isActive.HasValue) quiz.IsActive = isActive.Value;

            await _db.SaveChangesAsync();
            return true;
        }

        // ── ATTEMPT ──────────────────────────────────────────────────────────

        public async Task<Attempt?> CreateAttemptAsync(int quizId, int userId)
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
            return attempt;
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

        public async Task<List<Attempt>> GetAttemptHistoryAsync(int userId)
        {
            return await _db.Attempts
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.StartedAt)
                .ToListAsync();
        }

        public async Task<List<Attempt>> GetAttemptsAsync(string role, int userId)
        {
            return await _db.Attempts
                .Include(a => a.Quiz)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
        }

        // ── QUESTION ─────────────────────────────────────────────────────────

        public async Task<List<Question>> GetQuizQuestionsAsync(int quizId)
        {
            return await _db.Questions
                .Where(q => q.QuizId == quizId)
                .Include(q => q.Options)
                .ToListAsync();
        }

        // ── ANSWER ───────────────────────────────────────────────────────────

        public async Task AddAnswersAsync(List<Answer> answers)
        {
            _db.Answers.AddRange(answers);
            await _db.SaveChangesAsync();
        }

        // ── PERMISSION ───────────────────────────────────────────────────────

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

        // ── GROUP ────────────────────────────────────────────────────────────

        public async Task<QuestionGroup?> CreateGroupAsync(int quizId, QuestionGroup group)
        {
            group.QuizId = quizId;
            _db.QuestionGroups.Add(group);
            await _db.SaveChangesAsync();
            return group;
        }

        public async Task<bool> UpdateGroupAsync(int groupId, QuestionGroup updated)
        {
            var group = await _db.QuestionGroups.FindAsync(groupId);
            if (group == null) return false;

            if (updated.Instruction != null) group.Instruction = updated.Instruction;
            if (updated.GroupType > 0) group.GroupType = updated.GroupType;
            if (updated.GroupOrder > 0) group.GroupOrder = updated.GroupOrder;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteGroupAsync(int groupId)
        {
            var group = await _db.QuestionGroups.FindAsync(groupId);
            if (group == null) return false;

            var questionIds = await _db.Questions
                .Where(q => q.GroupId == groupId)
                .Select(q => q.QuestionId)
                .ToListAsync();

            if (questionIds.Any())
            {
                var questionIdsStr = string.Join(",", questionIds);
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Answer] WHERE QuestionId IN ({questionIdsStr})");
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Option] WHERE QuestionId IN ({questionIdsStr})");
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Asset] WHERE OwnerType = 2 AND OwnerId IN ({questionIdsStr})");
                await _db.Database.ExecuteSqlRawAsync(
                    $"DELETE FROM [Question] WHERE QuestionId IN ({questionIdsStr})");
            }

            await _db.Database.ExecuteSqlRawAsync(
                $"DELETE FROM [Asset] WHERE OwnerType = 1 AND OwnerId = {groupId}");
            _db.QuestionGroups.Remove(group);

            await _db.SaveChangesAsync();
            return true;
        }

        // ── QUESTION (CRUD) ──────────────────────────────────────────────────

        public async Task<Question?> CreateQuestionAsync(int groupId, Question question)
        {
            var quizId = await _db.QuestionGroups
                .Where(g => g.GroupId == groupId)
                .Select(g => g.QuizId)
                .FirstOrDefaultAsync();

            if (quizId == 0)
                throw new KeyNotFoundException("Group not found");

            question.QuizId = quizId;
            question.GroupId = groupId;

            _db.Questions.Add(question);
            await _db.SaveChangesAsync();
            return question;
        }

        public async Task<bool> UpdateQuestionAsync(int questionId, Question updated)
        {
            var question = await _db.Questions.FindAsync(questionId);
            if (question == null) return false;

            if (updated.Content != null) question.Content = updated.Content;
            if (updated.QuestionType > 0) question.QuestionType = updated.QuestionType;
            if (updated.QuestionOrder > 0) question.QuestionOrder = updated.QuestionOrder;
            if (updated.ScoreWeight > 0) question.ScoreWeight = updated.ScoreWeight;
            if (updated.MetaJson != null) question.MetaJson = updated.MetaJson;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteQuestionAsync(int questionId)
        {
            var question = await _db.Questions.FindAsync(questionId);
            if (question == null) return false;

            await _db.Database.ExecuteSqlRawAsync(
                $"DELETE FROM [Answer] WHERE QuestionId = {questionId}");

            await _db.Database.ExecuteSqlRawAsync(
                $"DELETE FROM [Option] WHERE QuestionId = {questionId}");
            await _db.Database.ExecuteSqlRawAsync(
                $"DELETE FROM [Asset] WHERE OwnerType = 2 AND OwnerId = {questionId}");
            _db.Questions.Remove(question);

            await _db.SaveChangesAsync();
            return true;
        }

        // ── OPTION ───────────────────────────────────────────────────────────

        public async Task<Option?> CreateOptionAsync(int questionId, Option option)
        {
            var exists = await _db.Questions.AnyAsync(q => q.QuestionId == questionId);
            if (!exists)
                throw new KeyNotFoundException("Question not found");

            option.QuestionId = questionId;
            _db.Options.Add(option);
            await _db.SaveChangesAsync();
            return option;
        }

        public async Task<bool> UpdateOptionAsync(int optionId, Option updated)
        {
            var option = await _db.Options.FindAsync(optionId);
            if (option == null) return false;

            if (updated.Content != null) option.Content = updated.Content;
            option.IsCorrect = updated.IsCorrect;

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

        // ── ASSET ────────────────────────────────────────────────────────────

        public async Task<Asset?> CreateAssetForGroupAsync(int groupId, Asset asset)
        {
            var exists = await _db.QuestionGroups.AnyAsync(g => g.GroupId == groupId);
            if (!exists)
                throw new KeyNotFoundException("Group not found");

            asset.OwnerType = 1;
            asset.OwnerId = groupId;
            _db.Assets.Add(asset);
            await _db.SaveChangesAsync();
            return asset;
        }

        public async Task<Asset?> CreateAssetForQuestionAsync(int questionId, Asset asset)
        {
            var exists = await _db.Questions.AnyAsync(q => q.QuestionId == questionId);
            if (!exists)
                throw new KeyNotFoundException("Question not found");

            asset.OwnerType = 2;
            asset.OwnerId = questionId;
            _db.Assets.Add(asset);
            await _db.SaveChangesAsync();
            return asset;
        }

        public async Task<bool> DeleteAssetAsync(int assetId)
        {
            var asset = await _db.Assets.FindAsync(assetId);
            if (asset == null) return false;

            _db.Assets.Remove(asset);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}