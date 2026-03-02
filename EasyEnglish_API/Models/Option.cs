using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Option
{
    public int OptionId { get; set; }

    public int QuestionId { get; set; }

    public string Content { get; set; } = null!;

    public bool IsCorrect { get; set; }

    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public virtual Question Question { get; set; } = null!;
}
