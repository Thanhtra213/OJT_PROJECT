using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Interfaces.Streak;

namespace EasyEnglish_API.Services.Streak
{
    public class StreakService : IStreakService
    {
        private readonly IStreakRepository _repo;

        public StreakService(IStreakRepository repo)
        {
            _repo = repo;
        }

        private static string BuildMessage(int streak, bool needsToday, DateOnly lastActivity, DateOnly today)
        {
            // Hôm nay chưa học nhưng hôm qua có → streak đang nguy hiểm
            if (needsToday && lastActivity == today.AddDays(-1))
                return $"Streak {streak} ngày — hãy học hôm nay để không bị mất!";

            return $"Streak {streak} ngày — tiếp tục phát huy!";
        }
        public async Task<StreakResponse> GetStreakAsync(int userId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var activityDates = await _repo.GetActivityDatesAsync(userId);

            if (activityDates.Count == 0)
                return new StreakResponse
                {
                    CurrentStreak = 0,
                    LastActivityDate = null,
                    NeedsActivityToday = true,
                    Message = "Bắt đầu học ngay để bắt đầu streak của bạn!"
                };

            var lastActivity = activityDates.First(); // ngày gần nhất

            // Nếu ngày gần nhất quá hôm qua → streak đã bị reset
            if (lastActivity < today.AddDays(-1))
                return new StreakResponse
                {
                    CurrentStreak = 0,
                    LastActivityDate = lastActivity,
                    NeedsActivityToday = true,
                    Message = "Streak của bạn đã bị reset. Hãy bắt đầu lại hôm nay!"
                };

            // Tính streak: đếm ngược từ ngày gần nhất, mỗi ngày phải liên tiếp
            int streak = 1;
            var checking = lastActivity;

            for (int i = 1; i < activityDates.Count; i++)
            {
                if (activityDates[i] == checking.AddDays(-1))
                {
                    streak++;
                    checking = activityDates[i];
                }
                else
                {
                    break; // chuỗi bị gián đoạn
                }
            }

            bool needsToday = lastActivity != today;
            string message = BuildMessage(streak, needsToday, lastActivity, today);

            return new StreakResponse
            {
                CurrentStreak = streak,
                LastActivityDate = lastActivity,
                NeedsActivityToday = needsToday,
                Message = message
            };
        }
    }
}