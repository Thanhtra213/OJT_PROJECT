namespace EasyEnglish_API.DTOs.Progress
{
    public class FlashcardProgressDto
    {
        public int ItemId { get; set; }
        public bool IsMastered { get; set; }
        public bool IsSaved { get; set; }       
        public int ReviewCount { get; set; }
        public DateTime? FirstLearnedAt { get; set; }
        public DateTime? LastReviewedAt { get; set; }
        public DateTime? NextReviewAt { get; set; }
    }

}
