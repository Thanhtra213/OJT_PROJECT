namespace EasyEnglish_API.DTOs.Progress
{
    public class FlashcardProgressDto
    {
        public int ItemId { get; set; }
        public string FrontText { get; set; }
        public bool IsMastered { get; set; }
        public int ReviewCount { get; set; }
        public DateTime? NextReviewAt { get; set; }
    }
}
