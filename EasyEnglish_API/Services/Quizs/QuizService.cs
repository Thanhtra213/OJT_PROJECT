using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces.Quizs;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Models;
using QuizAlias = EasyEnglish_API.Models.Quiz;

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

        // ── MAPPERS ───────────────────────────────────────────────────────────

        private static QuizDto ToDto(QuizAlias q) => new()
        {
            QuizID = q.QuizId,
            Title = q.Title,
            Description = q.Description,
            QuizType = q.QuizType
        };

        private static QuizDetailDto ToDetailDto(QuizAlias q) => new()
        {
            QuizID = q.QuizId,
            Title = q.Title,
            Description = q.Description,
            QuizType = q.QuizType,
            Groups = q.QuestionGroups.Select(g => new QuestionGroupDto
            {
                GroupID = g.GroupId,
                Instruction = g.Instruction,
                Questions = g.Questions.Select(qs => new QuestionDto
                {
                    QuestionID = qs.QuestionId,
                    Content = qs.Content,
                    QuestionType = qs.QuestionType,
                    Options = qs.Options.Select(o => new OptionDto
                    {
                        OptionID = o.OptionId,
                        Content = o.Content
                    }).ToList()
                }).ToList()
            }).ToList()
        };

        // ── USER ─────────────────────────────────────────────────────────────

        public async Task<List<QuizDto>> GetQuizzesByCourseAsync(int userId, int courseId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");

            var list = await _repo.GetQuizzesByCourseAsync(courseId);
            return list.Select(ToDto).ToList();
        }

        public async Task<List<QuizDto>> GetGlobalQuizzesAsync(int userId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");

            var list = await _repo.GetGlobalQuizzesAsync();
            return list.Select(ToDto).ToList();
        }

        public async Task<QuizDetailDto?> GetQuizDetailAsync(int userId, int quizId)
        {
            var quiz = await _repo.GetQuizDetailAsync(quizId)
                ?? throw new Exception("Quiz not found");

            return ToDetailDto(quiz);
        }

        public async Task<int> StartQuizAsync(int userId, int quizId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");

            var attempt = await _repo.CreateAttemptAsync(quizId, userId);
            return attempt!.AttemptId;
        }

        public async Task<decimal?> SubmitQuizAsync(int userId, int attemptId, SubmitQuizRequest req)
        {
            if (req.Answers == null || !req.Answers.Any())
                throw new Exception("Answers cannot be empty");

            var attempt = await _repo.GetAttemptAsync(attemptId, userId);
            if (attempt == null) return null;

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

                bool correct = q.Options.Any(o => o.OptionId == ans.OptionID && o.IsCorrect);
                decimal score = correct ? perQuestion : 0;
                if (correct) totalScore += perQuestion;

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

        public async Task<List<object>> GetAttemptHistoryAsync(int userId)
        {
            var list = await _repo.GetAttemptHistoryAsync(userId);
            return list.Select(a => (object)new
            {
                a.AttemptId,
                a.QuizId,
                a.StartedAt,
                a.SubmittedAt,
                a.Status,
                a.AutoScore
            }).ToList();
        }

        public async Task<List<object>> GetAttemptsAsync(string role, int userId)
        {
            var list = await _repo.GetAttemptsAsync(role, userId);
            return list.Select(a => (object)new
            {
                a.AttemptId,
                a.QuizId,
                QuizTitle = a.Quiz?.Title,
                a.SubmittedAt,
                a.AutoScore,
                a.Status,
                StudentID = a.UserId
            }).ToList();
        }

        // ── TEACHER ──────────────────────────────────────────────────────────

        public async Task<List<QuizDto>> GetTeacherQuizzesByCourseAsync(int teacherId, int courseId)
        {
            if (!await _repo.TeacherOwnsCourseAsync(teacherId, courseId))
                throw new Exception("Forbidden");

            var list = await _repo.GetQuizzesByCourseAsync(courseId);
            return list.Select(ToDto).ToList();
        }

        public async Task<int> CreateQuizAsync(int teacherId, int courseId, string title, string? description, byte quizType)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new Exception("Title cannot be empty");

            if (!await _repo.TeacherOwnsCourseAsync(teacherId, courseId))
                throw new Exception("Forbidden");

            var quiz = await _repo.CreateQuizAsync(courseId, title, description, quizType);
            return quiz!.QuizId;
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

        // GROUP (Teacher)
        public async Task<int> CreateGroupAsync(int teacherId, int quizId, CreateGroupRequest req)
        {
            if (teacherId != 0 && !await _repo.TeacherOwnsQuizAsync(teacherId, quizId))
                throw new Exception("Forbidden");

            var group = new QuestionGroup
            {
                Instruction = req.Instruction,
                GroupType = req.GroupType,
                GroupOrder = req.GroupOrder
            };

            var created = await _repo.CreateGroupAsync(quizId, group);
            return created!.GroupId;
        }

        public async Task<bool> UpdateGroupAsync(int teacherId, int groupId, UpdateGroupRequest req)
        {
            var group = new QuestionGroup
            {
                Instruction = req.Instruction,
                GroupType = req.GroupType ?? 0,
                GroupOrder = req.GroupOrder ?? 0
            };
            return await _repo.UpdateGroupAsync(groupId, group);
        }

        public Task<bool> DeleteGroupAsync(int teacherId, int groupId)
            => _repo.DeleteGroupAsync(groupId);

        // QUESTION (Teacher)
        public async Task<int> CreateQuestionAsync(int teacherId, int groupId, CreateQuestionRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Question content required");

            var question = new Question
            {
                Content = req.Content,
                QuestionType = req.QuestionType,
                QuestionOrder = req.QuestionOrder,
                ScoreWeight = req.ScoreWeight,
                MetaJson = req.MetaJson
            };

            var created = await _repo.CreateQuestionAsync(groupId, question);
            return created!.QuestionId;
        }

        public async Task<bool> UpdateQuestionAsync(int teacherId, int questionId, UpdateQuestionRequest req)
        {
            var question = new Question
            {
                Content = req.Content,
                QuestionType = req.QuestionType ?? 0,
                QuestionOrder = req.QuestionOrder ?? 0,
                ScoreWeight = req.ScoreWeight ?? 0,
                MetaJson = req.MetaJson
            };
            return await _repo.UpdateQuestionAsync(questionId, question);
        }

        public Task<bool> DeleteQuestionAsync(int teacherId, int questionId)
            => _repo.DeleteQuestionAsync(questionId);

        // OPTION (Teacher)
        public async Task<int> CreateOptionAsync(int teacherId, int questionId, CreateOptionRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Option content required");

            var option = new Option { Content = req.Content, IsCorrect = req.IsCorrect };
            var created = await _repo.CreateOptionAsync(questionId, option);
            return created!.OptionId;
        }

        public async Task<bool> UpdateOptionAsync(int teacherId, int optionId, UpdateOptionRequest req)
        {
            var option = new Option { Content = req.Content, IsCorrect = req.IsCorrect ?? false };
            return await _repo.UpdateOptionAsync(optionId, option);
        }

        public Task<bool> DeleteOptionAsync(int teacherId, int optionId)
            => _repo.DeleteOptionAsync(optionId);

        // ASSET (Teacher)
        public async Task<int> CreateAssetForGroupAsync(int teacherId, int groupId, CreateAssetRequest req)
        {
            var asset = new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType };
            var created = await _repo.CreateAssetForGroupAsync(groupId, asset);
            return created!.AssetId;
        }

        public async Task<int> CreateAssetForQuestionAsync(int teacherId, int questionId, CreateAssetRequest req)
        {
            var asset = new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType };
            var created = await _repo.CreateAssetForQuestionAsync(questionId, asset);
            return created!.AssetId;
        }

        public Task<bool> DeleteAssetAsync(int teacherId, int assetId)
            => _repo.DeleteAssetAsync(assetId);

        // ── ADMIN ─────────────────────────────────────────────────────────────

        public async Task<List<QuizDto>> GetAllGlobalQuizzesAsync()
        {
            var list = await _repo.GetAllGlobalQuizzesAsync();
            return list.Select(ToDto).ToList();
        }

        public async Task<QuizDetailDto?> GetGlobalQuizDetailAsync(int quizId)
        {
            var quiz = await _repo.GetQuizDetailAsync(quizId)
                ?? throw new Exception("Quiz not found");

            return ToDetailDto(quiz);
        }

        public async Task<int> CreateGlobalQuizAsync(string title, string? description, byte quizType)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new Exception("Title cannot be empty");

            var quiz = await _repo.CreateGlobalQuizAsync(title, description, quizType);
            return quiz!.QuizId;
        }

        public async Task<bool> UpdateGlobalQuizAsync(int quizId, UpdateQuizRequest req)
        {
            if (req == null) throw new Exception("Invalid data");

            return await _repo.UpdateGlobalQuizAsync(quizId, req.Title, req.Description, req.IsActive);
        }

        public Task<bool> DeleteGlobalQuizAsync(int quizId)
            => _repo.DeleteQuizAsync(quizId);

        // GROUP (Admin)
        public async Task<int> CreateGroupAsync(int quizId, CreateGroupRequest req)
        {
            if (req == null) throw new Exception("Invalid group data");

            var group = new QuestionGroup { Instruction = req.Instruction, GroupType = req.GroupType, GroupOrder = req.GroupOrder };
            var created = await _repo.CreateGroupAsync(quizId, group);
            return created!.GroupId;
        }

        public async Task<bool> UpdateGroupAsync(int groupId, UpdateGroupRequest req)
        {
            if (req == null) throw new Exception("Invalid group data");

            var group = new QuestionGroup { Instruction = req.Instruction, GroupType = req.GroupType ?? 0, GroupOrder = req.GroupOrder ?? 0 };
            return await _repo.UpdateGroupAsync(groupId, group);
        }

        public Task<bool> DeleteGroupAsync(int groupId)
            => _repo.DeleteGroupAsync(groupId);

        // QUESTION (Admin)
        public async Task<int> CreateQuestionAsync(int groupId, CreateQuestionRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Question content required");

            var question = new Question { Content = req.Content, QuestionType = req.QuestionType, QuestionOrder = req.QuestionOrder, ScoreWeight = req.ScoreWeight, MetaJson = req.MetaJson };
            var created = await _repo.CreateQuestionAsync(groupId, question);
            return created!.QuestionId;
        }

        public async Task<bool> UpdateQuestionAsync(int questionId, UpdateQuestionRequest req)
        {
            if (req == null) throw new Exception("Invalid question data");

            var question = new Question { Content = req.Content, QuestionType = req.QuestionType ?? 0, QuestionOrder = req.QuestionOrder ?? 0, ScoreWeight = req.ScoreWeight ?? 0, MetaJson = req.MetaJson };
            return await _repo.UpdateQuestionAsync(questionId, question);
        }

        public Task<bool> DeleteQuestionAsync(int questionId)
            => _repo.DeleteQuestionAsync(questionId);

        // OPTION (Admin)
        public async Task<int> CreateOptionAsync(int questionId, CreateOptionRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Option content required");

            var option = new Option { Content = req.Content, IsCorrect = req.IsCorrect };
            var created = await _repo.CreateOptionAsync(questionId, option);
            return created!.OptionId;
        }

        public async Task<bool> UpdateOptionAsync(int optionId, UpdateOptionRequest req)
        {
            if (req == null) throw new Exception("Invalid option data");

            var option = new Option { Content = req.Content, IsCorrect = req.IsCorrect ?? false };
            return await _repo.UpdateOptionAsync(optionId, option);
        }

        public Task<bool> DeleteOptionAsync(int optionId)
            => _repo.DeleteOptionAsync(optionId);

        // ASSET (Admin)
        public async Task<int> CreateAssetForGroupAsync(int groupId, CreateAssetRequest req)
        {
            if (req == null) throw new Exception("Invalid asset data");

            var asset = new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType };
            var created = await _repo.CreateAssetForGroupAsync(groupId, asset);
            return created!.AssetId;
        }

        public async Task<int> CreateAssetForQuestionAsync(int questionId, CreateAssetRequest req)
        {
            if (req == null) throw new Exception("Invalid asset data");

            var asset = new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType };
            var created = await _repo.CreateAssetForQuestionAsync(questionId, asset);
            return created!.AssetId;
        }

        public Task<bool> DeleteAssetAsync(int assetId)
            => _repo.DeleteAssetAsync(assetId);
    }
}