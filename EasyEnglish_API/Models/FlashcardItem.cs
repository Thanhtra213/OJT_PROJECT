using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class FlashcardItem
{
    public int ItemId { get; set; }

    public int SetId { get; set; }

    public string FrontText { get; set; } = null!;

    public string BackText { get; set; } = null!;
    public string? IPA { get; set; }

    public string? Example { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<FlashcardHistory> FlashcardHistories { get; set; } = new List<FlashcardHistory>();

    public virtual ICollection<FlashcardProgress> FlashcardProgresses { get; set; } = new List<FlashcardProgress>();

    public virtual FlashcardSet Set { get; set; } = null!;
}
