using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class CourseVideo
{
    public int VideoId { get; set; }

    public int ChapterId { get; set; }

    public int CourseId { get; set; }

    public string VideoName { get; set; } = null!;

    public string VideoUrl { get; set; } = null!;

    public bool IsPreview { get; set; }

    public string? ResourceJson { get; set; }

    public virtual CourseChapter Chapter { get; set; } = null!;

    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<UserVideoProgress> UserVideoProgresses { get; set; } = new List<UserVideoProgress>();
}
