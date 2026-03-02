using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class PaymentOrder
{
    public int OrderId { get; set; }

    public int BuyerId { get; set; }

    public int PlanId { get; set; }

    public decimal Amount { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public virtual Account Buyer { get; set; } = null!;

    public virtual SubscriptionPlan Plan { get; set; } = null!;

    public virtual ICollection<WebhookEvent> WebhookEvents { get; set; } = new List<WebhookEvent>();
}
