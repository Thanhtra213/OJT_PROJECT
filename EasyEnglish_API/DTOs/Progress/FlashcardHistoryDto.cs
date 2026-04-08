namespace EasyEnglish_API.DTOs.Progress
{
    public class FlashcardHistoryDto
    {
        public int ItemId { get; set; }
        public string FrontText { get; set; } = string.Empty;
        public byte ActionType { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
