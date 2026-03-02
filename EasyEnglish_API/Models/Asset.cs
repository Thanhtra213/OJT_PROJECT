using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Asset
{
    public int AssetId { get; set; }

    public byte OwnerType { get; set; }

    public int OwnerId { get; set; }

    public byte AssetType { get; set; }

    public string? Url { get; set; }

    public string? ContentText { get; set; }

    public string? Caption { get; set; }

    public string? MimeType { get; set; }
}
