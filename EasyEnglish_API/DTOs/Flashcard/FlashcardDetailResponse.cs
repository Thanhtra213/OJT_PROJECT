namespace EasyEnglish_API.DTOs.Flashcard
{
    public class FlashcardDetailResponse : FlashcardSetResponse
    {
        public List<FlashcardItemResponse> Items { get; set; } = new();
    }
}
