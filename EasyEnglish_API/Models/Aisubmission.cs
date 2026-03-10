using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class AISubmission
{
    public long SubmissionId { get; set; }

    public int PromptId { get; set; }

    public int UserId { get; set; }

    public string? AnswerText { get; set; }

    public string? AudioUrl { get; set; }

    public string? Transcript { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AnswerAIReview> AnswerAireviews { get; set; } = new List<AnswerAIReview>();

    public virtual AIPrompt Prompt { get; set; } = null!;

    public virtual Account User { get; set; } = null!;
}
