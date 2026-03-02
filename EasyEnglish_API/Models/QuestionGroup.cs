using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class QuestionGroup
{
    public int GroupId { get; set; }

    public int QuizId { get; set; }

    public int GroupOrder { get; set; }

    public byte GroupType { get; set; }

    public string? Instruction { get; set; }

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();

    public virtual Quiz Quiz { get; set; } = null!;
}
