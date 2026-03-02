using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Teacher
{
    public int TeacherId { get; set; }

    public string? Description { get; set; }

    public DateTime JoinAt { get; set; }

    public string? CertJson { get; set; }

    public virtual ICollection<AnswerTeacherReview> AnswerTeacherReviews { get; set; } = new List<AnswerTeacherReview>();

    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();

    public virtual Account TeacherNavigation { get; set; } = null!;
}
