namespace EasyEnglish_API.DTOs.Progress
{
    public class LearnFlashcardRequest
    {
        public int ItemId { get; set; }
        public FlashcardActionType ActionType { get; set; }
        public bool? IsCorrect { get; set; }
    }

    public enum FlashcardActionType : byte
    {
        Learn = 1,     
        Mastered = 2  
    }
}

