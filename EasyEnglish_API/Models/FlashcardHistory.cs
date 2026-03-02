using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class FlashcardHistory
{
    public long HistoryId { get; set; }

    public int UserId { get; set; }

    public int ItemId { get; set; }

    public byte ActionType { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual FlashcardItem Item { get; set; } = null!;

    public virtual Account User { get; set; } = null!;
}
