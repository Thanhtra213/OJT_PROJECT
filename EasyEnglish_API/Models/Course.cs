using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class Course
{
    public int CourseId { get; set; }

    public int TeacherId { get; set; }

    public string CourseName { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreateAt { get; set; }

    public byte CourseLevel { get; set; }

    public virtual ICollection<CourseChapter> CourseChapters { get; set; } = new List<CourseChapter>();

    public virtual ICollection<CourseVideo> CourseVideos { get; set; } = new List<CourseVideo>();

    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

    public virtual ICollection<FlashcardSet> FlashcardSets { get; set; } = new List<FlashcardSet>();

    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();

    public virtual Teacher Teacher { get; set; } = null!;
}
