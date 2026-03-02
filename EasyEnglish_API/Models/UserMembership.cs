using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class UserMembership
{
    public long MembershipId { get; set; }

    public int UserId { get; set; }

    public DateTime StartsAt { get; set; }

    public DateTime EndsAt { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? CanceledAt { get; set; }

    public virtual Account User { get; set; } = null!;
}
