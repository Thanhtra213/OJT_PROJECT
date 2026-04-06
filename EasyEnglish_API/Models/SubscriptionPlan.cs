using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class SubscriptionPlan
{
    public int PlanId { get; set; }

    public string PlanCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public decimal Price { get; set; }

    public int DurationDays { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<PaymentOrder> PaymentOrders { get; set; } = new List<PaymentOrder>();
    public virtual ICollection<Voucher> Vouchers { get; set; } = new List<Voucher>();
}
