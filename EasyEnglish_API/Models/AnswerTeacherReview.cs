using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class AnswerTeacherReview
{
    public long TeacherReviewId { get; set; }

    public long AireviewId { get; set; }

    public int TeacherId { get; set; }

    public decimal? ScoreOverall { get; set; }

    public string Feedback { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public decimal? ScoreTask { get; set; }

    public decimal? ScoreCoherence { get; set; }

    public decimal? ScoreLexial { get; set; }

    public decimal? ScoreGrammar { get; set; }

    public decimal? ScorePronunciation { get; set; }

    public decimal? ScoreFluency { get; set; }

    public virtual Teacher Teacher { get; set; } = null!;
}
