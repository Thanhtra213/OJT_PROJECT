using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Feedback
{
    public int FeedbackId { get; set; }

    public int UserId { get; set; }

    public int CourseId { get; set; }

    public byte Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool IsVisible { get; set; }

    public virtual Course Course { get; set; } = null!;

    public virtual Account User { get; set; } = null!;
}
