using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Answer
{
    public int AnswerId { get; set; }

    public int AttemptId { get; set; }

    public int QuestionId { get; set; }

    public int? OptionId { get; set; }

    public string? AnswerText { get; set; }

    public string? AnswerUrl { get; set; }

    public decimal? GradedScore { get; set; }

    public string? Feedback { get; set; }

    public DateTime AnsweredAt { get; set; }

    public virtual Attempt Attempt { get; set; } = null!;

    public virtual Option? Option { get; set; }

    public virtual Question Question { get; set; } = null!;
}
