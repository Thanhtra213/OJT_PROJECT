using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Quiz
{
    public int QuizId { get; set; }

    public int? CourseId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public byte QuizType { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();

    public virtual Course? Course { get; set; }

    public virtual ICollection<QuestionGroup> QuestionGroups { get; set; } = new List<QuestionGroup>();

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
}
