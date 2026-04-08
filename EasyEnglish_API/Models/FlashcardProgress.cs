using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class FlashcardProgress
{
    public int UserId { get; set; }

    public int ItemId { get; set; }

    public DateTime? FirstLearnedAt { get; set; }

    public DateTime? LastReviewedAt { get; set; }

    public int ReviewCount { get; set; }
    public bool IsSaved { get; set; } = false;

    public bool IsMastered { get; set; } = false;

    public DateTime? NextReviewAt { get; set; }

    public decimal? EaseFactor { get; set; }

    public int? IntervalDays { get; set; }

    public virtual FlashcardItem Item { get; set; } = null!;

    public virtual Account User { get; set; } = null!;
}
