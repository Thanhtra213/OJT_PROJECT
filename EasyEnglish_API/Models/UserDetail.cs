using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class UserDetail
{
    public int AccountId { get; set; }

    public string? FullName { get; set; }

    public DateOnly? Dob { get; set; }

    public string? Address { get; set; }

    public string? Phone { get; set; }

    public string? AvatarUrl { get; set; }

    public virtual Account Account { get; set; } = null!;
}
