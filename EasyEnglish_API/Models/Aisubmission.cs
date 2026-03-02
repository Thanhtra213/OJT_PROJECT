using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Aisubmission
{
    public long SubmissionId { get; set; }

    public int PromptId { get; set; }

    public int UserId { get; set; }

    public string? AnswerText { get; set; }

    public string? AudioUrl { get; set; }

    public string? Transcript { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AnswerAireview> AnswerAireviews { get; set; } = new List<AnswerAireview>();

    public virtual Aiprompt Prompt { get; set; } = null!;

    public virtual Account User { get; set; } = null!;
}
