using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Models;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Services.Flashcard
{
    public class FlashcardService : IFlashcardService
    {
        private readonly IFlashcardRepository _flashcardRepository;

        public FlashcardService(IFlashcardRepository flashcardRepository)
        {
            _flashcardRepository = flashcardRepository;
        }

        public async Task<FlashcardItem> CreateItemAsync(CreateFlashcardItemRequest req)
        {
            var item = new FlashcardItem
            {
                SetId = req.SetID,
                FrontText = req.FrontText,
                BackText = req.BackText,
                Example = req.Example,
                CreatedAt = DateTime.UtcNow
            };
            var created = await _flashcardRepository.CreateItemAsync(item);

            if (created == null)
                throw new Exception("Can not create this Item!");

            return item;
        }

        public async Task<FlashcardSet> CreateSetAsync(CreateFlashcardSetRequest req)
        {
            var set = new FlashcardSet
            {
                CourseId = req.CourseID,
                Title = req.Title,
                Description = req.Description,
                CreatedAt = DateTime.UtcNow
            };
            var created = await _flashcardRepository.CreateSetAsync(set);

            if (created == null)
                throw new Exception("Can not create this Set!");

            return created;
        }

        public async Task<bool> DeleteItemAsync(int itemId)
        {
            var deleted = await _flashcardRepository.DeleteItemAsync(itemId);

            if (!deleted)
                throw new Exception("Not found!");

            return deleted;
        }

        public async Task<bool> DeleteSetAsync(int setId)
        {
            var deleted = await _flashcardRepository.DeleteSetAsync(setId);

            if (!deleted)
                throw new Exception("Not found!");

            return deleted;
        }

        public async Task<bool> EnsureTeacherOwnsCourse(int courseId, int userId)
        {
            return await _flashcardRepository.EnsureTeacherOwnsCourseAsync(courseId, userId);
        }

        public async Task<bool> EnsureTeacherOwnsSet(int setId, int userId)
        {
            return await _flashcardRepository.EnsureTeacherOwnsSetAsync(setId, userId);
        }

        public async Task<List<FlashcardSetResponse>> GetAllPublicSetsAsync()
        {
            var sets = await _flashcardRepository.GetAllPublicSetsAsync();

            if (sets == null)
                throw new Exception("Kind of set is empty!");

            var result = sets.Select(s => new FlashcardSetResponse
            {
                SetID = s.SetId,
                CourseID = s.CourseId,
                Title = s.Title,
                Description = s.Description
            }).ToList();
            return result;
        }

        public async Task<FlashcardDetailResponse?> GetSetDetailAsync(int setId)
        {
            var set = await _flashcardRepository.GetSetDetailAsync(setId);

            if (set == null)
                throw new Exception("Flashcard set not found!");

            var result = new FlashcardDetailResponse
            {
                SetID = set.SetId,
                CourseID = set.CourseId,
                Title = set.Title,
                Description = set.Description,
                Items = set.FlashcardItems.Select(i => new FlashcardItemResponse
                {
                    ItemID = i.ItemId,
                    FrontText = i.FrontText,
                    BackText = i.BackText,
                    Example = i.Example
                }).ToList()
            };

            return result;
        }

        public async Task<List<FlashcardSetResponse>> GetSetsByCourseAsync(int courseId)
        {
            var sets = await _flashcardRepository.GetSetsByCourseAsync(courseId);

            if (sets == null)
                throw new Exception("Flashcard set not found!");

            var result = sets.Select(s => new FlashcardSetResponse
            {
                SetID = s.SetId,
                CourseID = s.CourseId,
                Title = s.Title,
                Description = s.Description
            }).ToList();

            return result;
        }

        public async Task<bool> UpdateItemAsync(int itemId, CreateFlashcardItemRequest req)
        {
            var item = new FlashcardItem
            {
                ItemId = itemId,
                FrontText = req.FrontText,
                BackText = req.BackText,
                Example = req.Example
            };
            var updatedItem = await _flashcardRepository.UpdateItemAsync(item);

            if (!updatedItem)
                throw new Exception("Update current item fail!");

            return updatedItem;
        }

        public async Task<bool> UpdateSetAsync(int setId, UpdateFlashcardSetRequest req)
        {
            var set = new FlashcardSet
            {
                SetId = setId,
                Title = req.Title,
                Description = req.Description
            };
            var updatedSet = await _flashcardRepository.UpdateSetAsync(set);

            if (!updatedSet)
                throw new Exception("Update current set fail!");

            return updatedSet;
        }
    }
}
