using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Account
{
    public int AccountId { get; set; }

    public string Username { get; set; } = null!;

    public string? Hashpass { get; set; }

    public DateTime CreateAt { get; set; }

    public string Status { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Role { get; set; } = null!;

    public string? GoogleSub { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public string? RefreshTokenHash { get; set; }

    public DateTime? RefreshTokenExpiresAt { get; set; }

    public int RefreshTokenVersion { get; set; }

    public virtual ICollection<AIsubmission> AIsubmissions { get; set; } = new List<AIsubmission>();

    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();

    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

    public virtual ICollection<FlashcardHistory> FlashcardHistories { get; set; } = new List<FlashcardHistory>();

    public virtual ICollection<FlashcardProgress> FlashcardProgresses { get; set; } = new List<FlashcardProgress>();

    public virtual ICollection<PaymentOrder> PaymentOrders { get; set; } = new List<PaymentOrder>();

    public virtual ICollection<Request> RequestProcessedByNavigations { get; set; } = new List<Request>();

    public virtual ICollection<Request> RequestUsers { get; set; } = new List<Request>();

    public virtual ICollection<SubmissionHistory> SubmissionHistories { get; set; } = new List<SubmissionHistory>();

    public virtual Teacher? Teacher { get; set; }

    public virtual UserDetail? UserDetail { get; set; }

    public virtual ICollection<UserMembership> UserMemberships { get; set; } = new List<UserMembership>();

    public virtual ICollection<UserVideoProgress> UserVideoProgresses { get; set; } = new List<UserVideoProgress>();
}
