using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces.Quizs;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Models;
using System.Text.Json;
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


        private static QuizDto ToDto(QuizAlias q) => new()
        {
            QuizID = q.QuizId,
            Title = q.Title,
            Description = q.Description,
            QuizType = q.QuizType,
            IsActive = q.IsActive
        };

        private static QuizDetailDto ToDetailDto(QuizAlias q)
        {
            var groups = q.QuestionGroups.Select(g => new QuestionGroupDto
            {
                GroupID = g.GroupId,
                Instruction = g.Instruction,
                Questions = g.Questions.Select(qs => new QuestionDto
                {
                    QuestionID = qs.QuestionId,
                    Content = qs.Content,
                    QuestionType = qs.QuestionType,
                    Options = qs.QuestionType == 1
                        ? qs.Options.Select(o => new OptionDto
                        {
                            OptionID = o.OptionId,
                            Content = o.Content,
                            IsCorrect = o.IsCorrect
                        }).ToList()
                        : new List<OptionDto>()
                }).ToList()
            }).ToList();

            var noGroupQuestions = q.Questions
                .Where(x => x.GroupId == null)
                .ToList();

            if (noGroupQuestions.Any())
            {
                groups.Add(new QuestionGroupDto
                {
                    GroupID = 0,
                    Instruction = "(No group)",
                    Questions = noGroupQuestions.Select(qs => new QuestionDto
                    {
                        QuestionID = qs.QuestionId,
                        Content = qs.Content,
                        QuestionType = qs.QuestionType,
                        Options = qs.QuestionType == 1
                            ? qs.Options.Select(o => new OptionDto
                            {
                                OptionID = o.OptionId,
                                Content = o.Content,
                                IsCorrect = o.IsCorrect
                            }).ToList()
                            : new List<OptionDto>()
                    }).ToList()
                });
            }

            return new QuizDetailDto
            {
                QuizID = q.QuizId,
                Title = q.Title,
                Description = q.Description,
                QuizType = q.QuizType,
                IsActive = q.IsActive,
                Groups = groups
            };
        }


        public async Task<List<QuizDto>> GetQuizzesByCourseAsync(int userId, int courseId, string role = "USER")
        {
            if (role != "ADMIN" && !await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");
            return (await _repo.GetQuizzesByCourseAsync(courseId)).Select(ToDto).ToList();
        }

        public async Task<List<QuizDto>> GetGlobalQuizzesAsync(int userId, string role = "USER")
        {
            if (role != "ADMIN" && !await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership expired");
            return (await _repo.GetGlobalQuizzesAsync()).Select(ToDto).ToList();
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

        public async Task<SubmitQuizResponse> SubmitQuizAsync(int userId, int attemptId, SubmitQuizRequest req)
        {
            if (req.Answers == null || !req.Answers.Any())
                throw new Exception("Answers cannot be empty");

            var attempt = await _repo.GetAttemptAsync(attemptId, userId)
                          ?? throw new Exception("Attempt not found");
            Console.WriteLine($"[DEBUG] attempt.UserId={attempt.UserId}, attempt.Status={attempt.Status}");

            if (attempt.Status != "IN_PROGRESS")
                throw new Exception("Quiz already submitted");

            var questions = await _repo.GetQuizQuestionsAsync(attempt.QuizId);
            if (!questions.Any())
                throw new Exception("Quiz has no questions");

            var gradable = questions.Where(q => q.QuestionType != 3).ToList();
            decimal perQ = gradable.Any() ? 100m / gradable.Count : 0;
            decimal total = 0;
            var answers = new List<Answer>();
            var results = new List<QuestionResultDto>();

            foreach (var ans in req.Answers)
            {
                var q = questions.FirstOrDefault(x => x.QuestionId == ans.QuestionID);
                if (q == null) continue;

                bool? isCorrect;
                decimal? gradedScore;

                switch (q.QuestionType)
                {
                    case 1:
                        isCorrect = GradeMultipleChoice(q, ans.OptionID);
                        gradedScore = isCorrect.Value ? perQ : 0;
                        break;
                    case 2:
                        isCorrect = GradeFillInBlank(q, ans.AnswerText);
                        gradedScore = isCorrect.Value ? perQ : 0;
                        break;
                    case 3:
                        isCorrect = null;
                        gradedScore = null;
                        break;
                    default:
                        isCorrect = false;
                        gradedScore = 0;
                        break;
                }

                if (gradedScore.HasValue) total += gradedScore.Value;

                answers.Add(new Answer
                {
                    AttemptId = attemptId,
                    QuestionId = q.QuestionId,
                    OptionId = ans.OptionID,
                    AnswerText = ans.AnswerText,
                    AnsweredAt = DateTime.UtcNow,
                    GradedScore = gradedScore
                });

                var rd = new QuestionResultDto
                {
                    QuestionId = q.QuestionId,
                    Content = q.Content,
                    QuestionType = q.QuestionType,
                    IsCorrect = isCorrect,
                    SubmittedOptionId = ans.OptionID,
                    SubmittedAnswerText = ans.AnswerText
                };

                if (isCorrect == false)
                {
                    if (q.QuestionType == 1)
                        rd.CorrectOptions = q.Options
                            .Where(o => o.IsCorrect)
                            .Select(o => new CorrectOptionDto { OptionId = o.OptionId, Content = o.Content })
                            .ToList();
                    else if (q.QuestionType == 2 && !string.IsNullOrWhiteSpace(q.MetaJson))
                    {
                        try
                        {
                            using var doc = JsonDocument.Parse(q.MetaJson);
                            var root = doc.RootElement;
                            if (root.TryGetProperty("answer", out var s))
                                rd.CorrectAnswerText = s.GetString();
                            else if (root.TryGetProperty("answers", out var m) && m.ValueKind == JsonValueKind.Array)
                                rd.CorrectAnswerText = string.Join(" / ", m.EnumerateArray().Select(a => a.GetString()));
                        }
                        catch { }
                    }
                }

                results.Add(rd);
            }

            total = Math.Round(total, 2);
            await _repo.AddAnswersAsync(answers);

            bool hasEssay = questions.Any(q => q.QuestionType == 3);
            attempt.Status = hasEssay ? "PENDING_REVIEW" : "SUBMITTED";
            attempt.SubmittedAt = DateTime.UtcNow;
            attempt.AutoScore = total;
            await _repo.UpdateAttemptAsync(attempt);

            return new SubmitQuizResponse
            {
                AutoScore = total,
                TotalQuestions = questions.Count,
                CorrectCount = results.Count(r => r.IsCorrect == true),
                WrongCount = results.Count(r => r.IsCorrect == false),
                EssayCount = results.Count(r => r.IsCorrect == null),
                Status = attempt.Status,
                Results = results
            };
        }

    

        private static bool GradeMultipleChoice(Question q, int? optionId)
            => optionId.HasValue && q.Options.Any(o => o.OptionId == optionId && o.IsCorrect);

        private static bool GradeFillInBlank(Question q, string? answerText)
        {
            if (string.IsNullOrWhiteSpace(answerText) || string.IsNullOrWhiteSpace(q.MetaJson)) return false;
            try
            {
                using var doc = JsonDocument.Parse(q.MetaJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("answer", out var s))
                    return string.Equals(answerText.Trim(), s.GetString()?.Trim(), StringComparison.OrdinalIgnoreCase);
                if (root.TryGetProperty("answers", out var m) && m.ValueKind == JsonValueKind.Array)
                    return m.EnumerateArray().Any(a => string.Equals(answerText.Trim(), a.GetString()?.Trim(), StringComparison.OrdinalIgnoreCase));
            }
            catch { }
            return false;
        }

        private static void ValidateMetaJson(byte questionType, string? metaJson)
        {
            if (questionType != 2) return;
            if (string.IsNullOrWhiteSpace(metaJson))
                throw new Exception("Fill-in-blank (type 2) cần MetaJson. Format: {\"answer\":\"text\"} hoặc {\"answers\":[\"a\",\"b\"]}");
            try
            {
                using var doc = JsonDocument.Parse(metaJson);
                var root = doc.RootElement;
                if (!root.TryGetProperty("answer", out _) && !root.TryGetProperty("answers", out _))
                    throw new Exception("MetaJson phải có field \"answer\" hoặc \"answers\".");
            }
            catch (JsonException) { throw new Exception("MetaJson không phải JSON hợp lệ."); }
        }


        public async Task<List<object>> GetAttemptHistoryAsync(int userId)
        {
            var list = await _repo.GetAttemptHistoryAsync(userId);
            return list.Select(a => (object)new { a.AttemptId, a.QuizId, a.StartedAt, a.SubmittedAt, a.Status, a.AutoScore }).ToList();
        }

        public async Task<List<object>> GetAttemptsAsync(string role, int userId)
        {
            var list = await _repo.GetAttemptsAsync(role, userId);
            return list.Select(a => (object)new { a.AttemptId, a.QuizId, QuizTitle = a.Quiz?.Title, a.SubmittedAt, a.AutoScore, a.Status, StudentID = a.UserId }).ToList();
        }


        public async Task<List<QuizDto>> GetTeacherQuizzesByCourseAsync(int teacherId, int courseId)
        {
            if (!await _repo.TeacherOwnsCourseAsync(teacherId, courseId)) throw new Exception("Forbidden");
            return (await _repo.GetAllQuizzesByCourseAsync(courseId)).Select(ToDto).ToList();
        }

        public async Task<QuizDetailDto> GetTeacherQuizDetail(int teacherId, int quizId)
        {
            if (!await _repo.TeacherOwnsQuizAsync(teacherId, quizId))
                throw new Exception("Forbidden");

            var quiz = await _repo.GetQuizDetailAsync(quizId)
                ?? throw new Exception("Quiz not found");

            return ToDetailDto(quiz);
        }

        public async Task<int> CreateQuizAsync(int teacherId, int courseId, string title, string? description, byte quizType)
        {
            if (string.IsNullOrWhiteSpace(title)) throw new Exception("Title cannot be empty");
            if (!await _repo.TeacherOwnsCourseAsync(teacherId, courseId)) throw new Exception("Forbidden");
            return (await _repo.CreateQuizAsync(courseId, title, description, quizType))!.QuizId;
        }

        public async Task<bool> UpdateQuizAsync(int teacherId, int quizId, string? title, string? description, int quizType, bool? isActive)
        {
            if (!await _repo.TeacherOwnsQuizAsync(teacherId, quizId)) throw new Exception("Forbidden");
            return await _repo.UpdateQuizAsync(quizId, title, description, quizType, isActive);
        }

        public async Task<bool> DeleteQuizAsync(int teacherId, int quizId)
        {
            if (!await _repo.TeacherOwnsQuizAsync(teacherId, quizId)) throw new Exception("Forbidden");
            return await _repo.DeleteQuizAsync(quizId);
        }

        public async Task<int> CreateGroupAsync(int teacherId, int quizId, CreateGroupRequest req)
        {
            if (teacherId != 0 && !await _repo.TeacherOwnsQuizAsync(teacherId, quizId)) throw new Exception("Forbidden");
            var group = new QuestionGroup { Instruction = req.Instruction, GroupType = req.GroupType, GroupOrder = req.GroupOrder };
            return (await _repo.CreateGroupAsync(quizId, group))!.GroupId;
        }

        public async Task<bool> UpdateGroupAsync(int teacherId, int groupId, UpdateGroupRequest req)
        {
            var group = new QuestionGroup { Instruction = req.Instruction, GroupType = req.GroupType ?? 0, GroupOrder = req.GroupOrder ?? 0 };
            return await _repo.UpdateGroupAsync(groupId, group);
        }

        public Task<bool> DeleteGroupAsync(int teacherId, int groupId) => _repo.DeleteGroupAsync(groupId);

        public async Task<int> CreateQuestionAsync(int teacherId, int groupId, CreateQuestionRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content)) throw new Exception("Question content required");
            ValidateMetaJson(req.QuestionType, req.MetaJson);
            var q = new Question { Content = req.Content, QuestionType = req.QuestionType, QuestionOrder = req.QuestionOrder, ScoreWeight = req.ScoreWeight, MetaJson = req.MetaJson };
            return (await _repo.CreateQuestionAsync(groupId, q))!.QuestionId;
        }

        public async Task<bool> UpdateQuestionAsync(int teacherId, int questionId, UpdateQuestionRequest req)
        {
            ValidateMetaJson(req.QuestionType ?? 0, req.MetaJson);
            var q = new Question { Content = req.Content, QuestionType = req.QuestionType ?? 0, QuestionOrder = req.QuestionOrder ?? 0, ScoreWeight = req.ScoreWeight ?? 0, MetaJson = req.MetaJson };
            return await _repo.UpdateQuestionAsync(questionId, q);
        }

        public Task<bool> DeleteQuestionAsync(int teacherId, int questionId) => _repo.DeleteQuestionAsync(questionId);

        public async Task<int> CreateOptionAsync(int teacherId, int questionId, CreateOptionRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content)) throw new Exception("Option content required");
            return (await _repo.CreateOptionAsync(questionId, new Option { Content = req.Content, IsCorrect = req.IsCorrect }))!.OptionId;
        }

        public async Task<bool> UpdateOptionAsync(int teacherId, int optionId, UpdateOptionRequest req)
            => await _repo.UpdateOptionAsync(optionId, new Option { Content = req.Content, IsCorrect = req.IsCorrect ?? false });

        public Task<bool> DeleteOptionAsync(int teacherId, int optionId) => _repo.DeleteOptionAsync(optionId);

        public async Task<int> CreateAssetForGroupAsync(int teacherId, int groupId, CreateAssetRequest req)
            => (await _repo.CreateAssetForGroupAsync(groupId, new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType }))!.AssetId;

        public async Task<int> CreateAssetForQuestionAsync(int teacherId, int questionId, CreateAssetRequest req)
            => (await _repo.CreateAssetForQuestionAsync(questionId, new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType }))!.AssetId;

        public Task<bool> DeleteAssetAsync(int teacherId, int assetId) => _repo.DeleteAssetAsync(assetId);


        public async Task<List<QuizDto>> GetAllGlobalQuizzesAsync()
            => (await _repo.GetAllGlobalQuizzesAsync()).Select(ToDto).ToList();

        public async Task<QuizDetailDto?> GetGlobalQuizDetailAsync(int quizId)
            => ToDetailDto(await _repo.GetQuizDetailAsync(quizId) ?? throw new Exception("Quiz not found"));

        public async Task<int> CreateGlobalQuizAsync(string title, string? description, byte quizType)
        {
            if (string.IsNullOrWhiteSpace(title)) throw new Exception("Title cannot be empty");
            return (await _repo.CreateGlobalQuizAsync(title, description, quizType))!.QuizId;
        }

        public async Task<bool> UpdateGlobalQuizAsync(int quizId, UpdateQuizRequest req)
        {
            if (req == null) throw new Exception("Invalid data");
            return await _repo.UpdateGlobalQuizAsync(quizId, req.Title, req.Description, req.IsActive);
        }

        public Task<bool> DeleteGlobalQuizAsync(int quizId) => _repo.DeleteQuizAsync(quizId);

        public async Task<int> CreateGroupAsync(int quizId, CreateGroupRequest req)
        {
            if (req == null) throw new Exception("Invalid group data");
            return (await _repo.CreateGroupAsync(quizId, new QuestionGroup { Instruction = req.Instruction, GroupType = req.GroupType, GroupOrder = req.GroupOrder }))!.GroupId;
        }

        public async Task<bool> UpdateGroupAsync(int groupId, UpdateGroupRequest req)
        {
            if (req == null) throw new Exception("Invalid group data");
            return await _repo.UpdateGroupAsync(groupId, new QuestionGroup { Instruction = req.Instruction, GroupType = req.GroupType ?? 0, GroupOrder = req.GroupOrder ?? 0 });
        }

        public Task<bool> DeleteGroupAsync(int groupId) => _repo.DeleteGroupAsync(groupId);

        public async Task<int> CreateQuestionAsync(int groupId, CreateQuestionRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Content)) throw new Exception("Question content required");
            ValidateMetaJson(req.QuestionType, req.MetaJson);
            var q = new Question { Content = req.Content, QuestionType = req.QuestionType, QuestionOrder = req.QuestionOrder, ScoreWeight = req.ScoreWeight, MetaJson = req.MetaJson };
            return (await _repo.CreateQuestionAsync(groupId, q))!.QuestionId;
        }

        public async Task<bool> UpdateQuestionAsync(int questionId, UpdateQuestionRequest req)
        {
            if (req == null) throw new Exception("Invalid question data");
            ValidateMetaJson(req.QuestionType ?? 0, req.MetaJson);
            var q = new Question { Content = req.Content, QuestionType = req.QuestionType ?? 0, QuestionOrder = req.QuestionOrder ?? 0, ScoreWeight = req.ScoreWeight ?? 0, MetaJson = req.MetaJson };
            return await _repo.UpdateQuestionAsync(questionId, q);
        }

        public Task<bool> DeleteQuestionAsync(int questionId) => _repo.DeleteQuestionAsync(questionId);

        public async Task<int> CreateOptionAsync(int questionId, CreateOptionRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Content)) throw new Exception("Option content required");
            return (await _repo.CreateOptionAsync(questionId, new Option { Content = req.Content, IsCorrect = req.IsCorrect }))!.OptionId;
        }

        public async Task<bool> UpdateOptionAsync(int optionId, UpdateOptionRequest req)
        {
            if (req == null) throw new Exception("Invalid option data");
            return await _repo.UpdateOptionAsync(optionId, new Option { Content = req.Content, IsCorrect = req.IsCorrect ?? false });
        }

        public Task<bool> DeleteOptionAsync(int optionId) => _repo.DeleteOptionAsync(optionId);

        public async Task<int> CreateAssetForGroupAsync(int groupId, CreateAssetRequest req)
        {
            if (req == null) throw new Exception("Invalid asset data");
            return (await _repo.CreateAssetForGroupAsync(groupId, new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType }))!.AssetId;
        }

        public async Task<int> CreateAssetForQuestionAsync(int questionId, CreateAssetRequest req)
        {
            if (req == null) throw new Exception("Invalid asset data");
            return (await _repo.CreateAssetForQuestionAsync(questionId, new Asset { AssetType = req.AssetType, Url = req.Url, ContentText = req.ContentText, Caption = req.Caption, MimeType = req.MimeType }))!.AssetId;
        }

        public Task<bool> DeleteAssetAsync(int assetId) => _repo.DeleteAssetAsync(assetId);

       

        public async Task<List<QuizDto>> GetAdminQuizzesByCourseAsync(int courseId)
        {
            return (await _repo.GetAllQuizzesByCourseAsync(courseId)).Select(ToDto).ToList();
        }

        public async Task<List<QuizDto>> GetAdminGlobalQuizzesAsync()
        {
            return (await _repo.GetAllGlobalQuizzesAsync()).Select(ToDto).ToList();
        }
    }
}