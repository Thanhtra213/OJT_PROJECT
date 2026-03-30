using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class UserVideoProgress
{
    public int UserId { get; set; }

    public int VideoId { get; set; }

    public DateTime WatchedAt { get; set; }

    public int? WatchDurationSec { get; set; }
    public int? LastPositionSec { get; set; }

    public bool IsCompleted { get; set; }

    public virtual Account User { get; set; } = null!;

    public virtual CourseVideo Video { get; set; } = null!;
}
