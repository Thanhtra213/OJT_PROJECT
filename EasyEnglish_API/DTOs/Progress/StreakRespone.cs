namespace EasyEnglish_API.DTOs.Progress
{
    public class StreakResponse
    {
        public int CurrentStreak { get; set; }
        public DateOnly? LastActivityDate { get; set; }
        public bool NeedsActivityToday { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
