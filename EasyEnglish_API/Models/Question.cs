using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Question
{
    public int QuestionId { get; set; }

    public int QuizId { get; set; }

    public int? GroupId { get; set; }

    public byte QuestionType { get; set; }

    public string Content { get; set; } = null!;

    public int QuestionOrder { get; set; }

    public decimal ScoreWeight { get; set; }

    public string? MetaJson { get; set; }

    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public virtual QuestionGroup? Group { get; set; }

    public virtual ICollection<Option> Options { get; set; } = new List<Option>();

    public virtual Quiz Quiz { get; set; } = null!;
}
