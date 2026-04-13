using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Models;
using Microsoft.AspNetCore.Http;

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
                IPA = req.IPA,
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
                    IPA = i.IPA,
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

        public async Task<ImportFlashcardResponse> ImportItemsFromFileAsync(int setId, IFormFile file)
        {
            var result = new ImportFlashcardResponse();
            var items = new List<FlashcardItem>();
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            using var stream = file.OpenReadStream();

            if (ext == ".xlsx")
            {
                // --- Đọc file Excel ---
                using var workbook = new ClosedXML.Excel.XLWorkbook(stream);
                var ws = workbook.Worksheet(1);
                var rows = ws.RangeUsed()?.RowsUsed().Skip(1); // Bỏ header row

                if (rows == null)
                {
                    result.Errors.Add("File Excel rỗng hoặc không có dữ liệu.");
                    return result;
                }

                int rowNum = 2;
                foreach (var row in rows)
                {
                    var front = row.Cell(1).GetString().Trim();
                    var back = row.Cell(2).GetString().Trim();
                    var ipa = row.Cell(3).GetString().Trim();
                    var example = row.Cell(4).GetString().Trim();

                    if (string.IsNullOrEmpty(front) || string.IsNullOrEmpty(back))
                    {
                        result.Errors.Add($"Dòng {rowNum}: Thiếu FrontText hoặc BackText — bỏ qua.");
                        result.SkippedCount++;
                        rowNum++;
                        continue;
                    }

                    items.Add(new FlashcardItem
                    {
                        SetId = setId,
                        FrontText = front,
                        BackText = back,
                        IPA = string.IsNullOrEmpty(ipa) ? null : ipa,
                        Example = string.IsNullOrEmpty(example) ? null : example,
                        CreatedAt = DateTime.UtcNow
                    });
                    rowNum++;
                }
            }
            else if (ext == ".csv")
            {
                // --- Đọc file CSV ---
                using var reader = new StreamReader(stream, System.Text.Encoding.UTF8);
                using var csv = new CsvHelper.CsvReader(reader, new CsvHelper.Configuration.CsvConfiguration(System.Globalization.CultureInfo.InvariantCulture)
                {
                    HasHeaderRecord = true,
                    MissingFieldFound = null,
                    HeaderValidated = null
                });

                await csv.ReadAsync();
                csv.ReadHeader();

                int rowNum = 2;
                while (await csv.ReadAsync())
                {
                    var front = csv.TryGetField<string>(0, out var f) ? f?.Trim() : null;
                    var back = csv.TryGetField<string>(1, out var b) ? b?.Trim() : null;
                    var ipa = csv.TryGetField<string>(2, out var i) ? i?.Trim() : null;
                    var example = csv.TryGetField<string>(3, out var e) ? e?.Trim() : null;

                    if (string.IsNullOrEmpty(front) || string.IsNullOrEmpty(back))
                    {
                        result.Errors.Add($"Dòng {rowNum}: Thiếu FrontText hoặc BackText — bỏ qua.");
                        result.SkippedCount++;
                        rowNum++;
                        continue;
                    }

                    items.Add(new FlashcardItem
                    {
                        SetId = setId,
                        FrontText = front,
                        BackText = back!,
                        IPA = string.IsNullOrEmpty(ipa) ? null : ipa,
                        Example = string.IsNullOrEmpty(example) ? null : example,
                        CreatedAt = DateTime.UtcNow
                    });
                    rowNum++;
                }
            }
            else
            {
                throw new InvalidOperationException("Chỉ hỗ trợ file .xlsx hoặc .csv");
            }

            if (items.Count > 0)
                result.ImportedCount = await _flashcardRepository.BulkCreateItemsAsync(items);

            return result;
        }

        public async Task<bool> UpdateItemAsync(int itemId, CreateFlashcardItemRequest req)
        {
            var item = new FlashcardItem
            {
                SetId = req.SetID,
                ItemId = itemId,
                FrontText = req.FrontText,
                BackText = req.BackText,
                IPA = req.IPA,
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