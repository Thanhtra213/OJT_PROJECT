using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Request
{
    public int RequestId { get; set; }

    public int UserId { get; set; }

    public int? CourseId { get; set; }

    public byte RequestType { get; set; }

    public string? Description { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public int? ProcessedBy { get; set; }

    public virtual Course? Course { get; set; }

    public virtual Account? ProcessedByNavigation { get; set; }

    public virtual Account User { get; set; } = null!;
}
