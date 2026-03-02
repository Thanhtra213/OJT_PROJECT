using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Attempt
{
    public int AttemptId { get; set; }

    public int QuizId { get; set; }

    public int UserId { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public decimal? AutoScore { get; set; }

    public decimal? ManualScore { get; set; }

    public string Status { get; set; } = null!;

    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public virtual Quiz Quiz { get; set; } = null!;

    public virtual ICollection<SubmissionHistory> SubmissionHistories { get; set; } = new List<SubmissionHistory>();

    public virtual Account User { get; set; } = null!;
}
