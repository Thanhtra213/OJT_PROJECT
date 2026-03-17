namespace EasyEnglish_API.Interfaces.Streak
{
    public interface IStreakRepository
    {
        Task<List<DateOnly>> GetActivityDatesAsync(int userId);
    }
}
