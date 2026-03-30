namespace EasyEnglish_API.DTOs.Progress
{
    public class CreateFlashcardHistory
    { public int ItemId { get; set; }

        // 1 = View, 2 = Correct, 3 = Wrong, 4 = Mastered
        public byte ActionType { get; set; }
    }
}
