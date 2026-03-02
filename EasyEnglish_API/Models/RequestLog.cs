using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class RequestLog
{
    public long LogId { get; set; }

    public int? ActorId { get; set; }

    public byte? ActorRole { get; set; }

    public string? Ip { get; set; }

    public string Path { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}
