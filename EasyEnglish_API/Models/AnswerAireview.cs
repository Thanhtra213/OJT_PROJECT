using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class AnswerAireview
{
    public long AireviewId { get; set; }

    public long SubmissionId { get; set; }

    public string? ModelName { get; set; }

    public decimal ScoreOverall { get; set; }

    public decimal? ScoreTask { get; set; }

    public decimal? ScoreCoherence { get; set; }

    public decimal? ScoreLexical { get; set; }

    public decimal? ScoreGrammar { get; set; }

    public decimal? ScorePronunciation { get; set; }

    public string Feedback { get; set; } = null!;

    public bool IsSentToTeacher { get; set; }

    public DateTime CreatedAt { get; set; }

    public decimal? ScoreFluency { get; set; }

    public virtual Aisubmission Submission { get; set; } = null!;
}
