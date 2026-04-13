namespace EasyEnglish_API.DTOs.Flashcard
{
    public class ImportFlashcardResponse
    {
        public int ImportedCount { get; set; }
        public int SkippedCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
