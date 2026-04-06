namespace EasyEnglish_API.DTOs.Flashcard
{
    public class FlashcardItemResponse
    {
        public int ItemID { get; set; }
        public string FrontText { get; set; } = string.Empty;
        public string BackText { get; set; } = string.Empty;
        public string IPA { get; set; } = string.Empty;
        public string? Example { get; set; }
    }
}
