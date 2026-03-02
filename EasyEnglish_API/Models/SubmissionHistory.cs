using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class SubmissionHistory
{
    public long SubmissionId { get; set; }

    public int AttemptId { get; set; }

    public int UserId { get; set; }

    public DateTime SubmittedAt { get; set; }

    public decimal? AutoScore { get; set; }

    public decimal? ManualScore { get; set; }

    public virtual Attempt Attempt { get; set; } = null!;

    public virtual Account User { get; set; } = null!;
}
