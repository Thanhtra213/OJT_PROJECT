using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Flashcard
{
    public class FlashcardProgressService : IFlashcarProgressService
    {
        private readonly IFlashcardProgressRepository _progress;

        public FlashcardProgressService(IFlashcardProgressRepository progress)
        {
            _progress = progress;
        }

        public async Task<List<FlashcardProgressDto>> GetProgressBySetAsync(int userId, int setId)
        {
            return await _progress.GetProgressBySetAsync(userId, setId);
        }

        public async Task LearnAsync(int userId, LearnFlashcardRequest request)
        {
            var existing = await _progress.GetProgressByItemAsync(userId, request.ItemId);

            await _progress.UpsertProgressAsync(new FlashcardProgress
            {
                UserId = userId,
                ItemId = request.ItemId,
                IsMastered = request.ActionType == FlashcardActionType.Mastered,
                ReviewCount = (existing?.ReviewCount ?? 0) + 1,
                NextReviewAt = DateTime.UtcNow.AddDays(1),

                // Lần đầu học → ghi FirstLearnedAt, lần sau giữ nguyên
                FirstLearnedAt = existing?.FirstLearnedAt ?? DateTime.UtcNow,

                // Luôn cập nhật LastReviewedAt mỗi lần học
                LastReviewedAt = DateTime.UtcNow
            });

            await _progress.LogHistoryAsync(userId, request.ItemId, (byte)request.ActionType);
        }

        public async Task<List<FlashcardHistoryDto>> GetHistoryAsync(int userId, int? setId)
        {
            return await _progress.GetHistoryAsync(userId, setId);
        }
    }
}