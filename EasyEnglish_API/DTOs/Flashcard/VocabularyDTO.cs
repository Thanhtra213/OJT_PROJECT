namespace EasyEnglish_API.DTOs.Flashcard
{
    public class SaveWordRequest
    {
        public int ItemId { get; set; }
    }

    public class SavedWordDto
    {
        public int ItemId { get; set; }
        public string FrontText { get; set; }
        public string BackText { get; set; }
        public string Example { get; set; }
        public bool IsMastered { get; set; }
        public int ReviewCount { get; set; }
        public DateTime? LastReviewedAt { get; set; }
    }
}