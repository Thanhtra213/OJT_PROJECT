namespace EasyEnglish_API.DTOs.Flashcard
{
    public class UpdateFlashcardSetRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
