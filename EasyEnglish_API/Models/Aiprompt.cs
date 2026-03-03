using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class AIprompt
{
    public int PromptId { get; set; }

    public string SkillType { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AIsubmission> AIsubmissions { get; set; } = new List<AIsubmission>();
}
