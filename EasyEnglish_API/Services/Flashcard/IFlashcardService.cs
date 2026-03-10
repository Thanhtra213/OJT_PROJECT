using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Models;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Services.Flashcard
{
    public interface IFlashcardService
    {
        // ---- READ ----
        Task<List<FlashcardSetResponse>> GetAllPublicSetsAsync();
        Task<List<FlashcardSetResponse>> GetSetsByCourseAsync(int courseId);
        Task<FlashcardDetailResponse?> GetSetDetailAsync(int setId);

        // ---- CREATE ----
        Task<FlashcardSet> CreateSetAsync(CreateFlashcardSetRequest req);
        Task<FlashcardItem> CreateItemAsync(CreateFlashcardItemRequest req);

        // ---- UPDATE ----
        Task<bool> UpdateSetAsync(int setId, UpdateFlashcardSetRequest req);
        Task<bool> UpdateItemAsync(int itemId, CreateFlashcardItemRequest req);

        // ---- DELETE ----
        Task<bool> DeleteSetAsync(int setId);
        Task<bool> DeleteItemAsync(int itemId);
    }
}
