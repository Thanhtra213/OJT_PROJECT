namespace EasyEnglish_API.DTOs.Progress
{
    public class VideoProgressRequest
    {
        public int VideoId { get; set; }

        public int WatchDurationSec { get; set; }

        public bool IsCompleted { get; set; }
    }
}
