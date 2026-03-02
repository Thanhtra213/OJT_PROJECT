using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class CourseChapter
{
    public int ChapterId { get; set; }

    public int CourseId { get; set; }

    public string ChapterName { get; set; } = null!;

    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<CourseVideo> CourseVideos { get; set; } = new List<CourseVideo>();

    public virtual ICollection<FlashcardSet> FlashcardSets { get; set; } = new List<FlashcardSet>();
}
