using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class WebhookEvent
{
    public int WebhookId { get; set; }

    public int OrderId { get; set; }

    public string UniqueKey { get; set; } = null!;

    public string? Payload { get; set; }

    public string? Signature { get; set; }

    public DateTime ReceivedAt { get; set; }

    public virtual PaymentOrder Order { get; set; } = null!;
}
