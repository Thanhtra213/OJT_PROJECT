using System;
using System.Collections.Generic;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Data;

public partial class EasyEnglishDbContext : DbContext
{
    public EasyEnglishDbContext()
    {
    }

    public EasyEnglishDbContext(DbContextOptions<EasyEnglishDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<AIPrompt> AIPrompts { get; set; }

    public virtual DbSet<AISubmission> AISubmissions { get; set; }

    public virtual DbSet<Answer> Answers { get; set; }

    public virtual DbSet<AnswerAIReview> AnswerAIReviews { get; set; }

    public virtual DbSet<AnswerTeacherReview> AnswerTeacherReviews { get; set; }

    public virtual DbSet<Asset> Assets { get; set; }

    public virtual DbSet<Attempt> Attempts { get; set; }

    public virtual DbSet<Course> Courses { get; set; }

    public virtual DbSet<CourseChapter> CourseChapters { get; set; }

    public virtual DbSet<CourseVideo> CourseVideos { get; set; }

    public virtual DbSet<Feedback> Feedbacks { get; set; }

    public virtual DbSet<FlashcardHistory> FlashcardHistories { get; set; }

    public virtual DbSet<FlashcardItem> FlashcardItems { get; set; }

    public virtual DbSet<FlashcardProgress> FlashcardProgresses { get; set; }

    public virtual DbSet<FlashcardSet> FlashcardSets { get; set; }

    public virtual DbSet<Option> Options { get; set; }

    public virtual DbSet<PaymentOrder> PaymentOrders { get; set; }

    public virtual DbSet<Question> Questions { get; set; }

    public virtual DbSet<QuestionGroup> QuestionGroups { get; set; }

    public virtual DbSet<Quiz> Quizzes { get; set; }

    public virtual DbSet<Request> Requests { get; set; }

    public virtual DbSet<RequestLog> RequestLogs { get; set; }

    public virtual DbSet<SubmissionHistory> SubmissionHistories { get; set; }

    public virtual DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }

    public virtual DbSet<Teacher> Teachers { get; set; }

    public virtual DbSet<UserDetail> UserDetails { get; set; }

    public virtual DbSet<UserMembership> UserMemberships { get; set; }

    public virtual DbSet<UserVideoProgress> UserVideoProgresses { get; set; }

    public virtual DbSet<VUserHasActiveMembership> VUserHasActiveMemberships { get; set; }

    public virtual DbSet<WebhookEvent> WebhookEvents { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(e => e.AccountId).HasName("PK__Account__349DA586E914E1F3");

            entity.ToTable("Account");

            entity.HasIndex(e => e.Email, "UQ_Account_Email").IsUnique();

            entity.HasIndex(e => e.Username, "UQ_Account_Username").IsUnique();

            entity.HasIndex(e => e.GoogleSub, "UX_Account_GoogleSub")
                .IsUnique()
                .HasFilter("([GoogleSub] IS NOT NULL)");

            entity.Property(e => e.AccountId).HasColumnName("AccountID");
            entity.Property(e => e.CreateAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.GoogleSub)
                .HasMaxLength(128)
                .IsUnicode(false);
            entity.Property(e => e.Hashpass)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.RefreshTokenHash)
                .HasMaxLength(88)
                .IsUnicode(false);
            entity.Property(e => e.Role)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("STUDENT");
            entity.Property(e => e.Status)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("ACTIVE");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<AIPrompt>(entity =>
        {
            entity.HasKey(e => e.PromptId).HasName("PK__AIPrompt__456CA7738653124B");

            entity.ToTable("AIPrompt");

            entity.Property(e => e.PromptId).HasColumnName("PromptID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.SkillType)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.Title).HasMaxLength(200);
        });

        modelBuilder.Entity<AISubmission>(entity =>
        {
            entity.HasKey(e => e.SubmissionId).HasName("PK__AISubmis__449EE105D6C1C4BC");

            entity.ToTable("AISubmission");

            entity.Property(e => e.SubmissionId).HasColumnName("SubmissionID");
            entity.Property(e => e.AudioUrl).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.PromptId).HasColumnName("PromptID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Prompt).WithMany(p => p.AISubmissions)
                .HasForeignKey(d => d.PromptId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AISubmission_Prompt");

            entity.HasOne(d => d.User).WithMany(p => p.AIsubmissions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AISubmission_User");
        });

        modelBuilder.Entity<Answer>(entity =>
        {
            entity.HasKey(e => e.AnswerId).HasName("PK__Answer__D48250242B31B938");

            entity.ToTable("Answer");

            entity.HasIndex(e => e.AttemptId, "IX_Answer_Attempt");

            entity.HasIndex(e => new { e.AttemptId, e.QuestionId }, "IX_Answer_Attempt_Q");

            entity.HasIndex(e => e.QuestionId, "IX_Answer_Q");

            entity.Property(e => e.AnswerId).HasColumnName("AnswerID");
            entity.Property(e => e.AnswerUrl).HasMaxLength(1000);
            entity.Property(e => e.AnsweredAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.AttemptId).HasColumnName("AttemptID");
            entity.Property(e => e.GradedScore).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.OptionId).HasColumnName("OptionID");
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");

            entity.HasOne(d => d.Attempt).WithMany(p => p.Answers)
                .HasForeignKey(d => d.AttemptId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Answer_Attempt");

            entity.HasOne(d => d.Option).WithMany(p => p.Answers)
                .HasForeignKey(d => d.OptionId)
                .HasConstraintName("FK_Answer_Option");

            entity.HasOne(d => d.Question).WithMany(p => p.Answers)
                .HasForeignKey(d => d.QuestionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Answer_Question");
        });

        modelBuilder.Entity<AnswerAIReview>(entity =>
        {
            entity.HasKey(e => e.AireviewId).HasName("PK__AnswerAI__D0B4D52A3DA8DD51");

            entity.ToTable("AnswerAIReview");

            entity.Property(e => e.AireviewId).HasColumnName("AIReviewID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ModelName)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ScoreCoherence).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreFluency).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreGrammar).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreLexical).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreOverall).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScorePronunciation).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreTask).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.SubmissionId).HasColumnName("SubmissionID");

            entity.HasOne(d => d.Submission).WithMany(p => p.AnswerAireviews)
                .HasForeignKey(d => d.SubmissionId)
                .HasConstraintName("FK_AIReview_Submission");
        });

        modelBuilder.Entity<AnswerTeacherReview>(entity =>
        {
            entity.HasKey(e => e.TeacherReviewId).HasName("PK__AnswerTe__0908B30C4A33924A");

            entity.ToTable("AnswerTeacherReview");

            entity.Property(e => e.TeacherReviewId).HasColumnName("TeacherReviewID");
            entity.Property(e => e.AireviewId).HasColumnName("AIReviewID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ScoreCoherence).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreFluency).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreGrammar).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreLexial).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreOverall).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScorePronunciation).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.ScoreTask).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.TeacherId).HasColumnName("TeacherID");

            entity.HasOne(d => d.Teacher).WithMany(p => p.AnswerTeacherReviews)
                .HasForeignKey(d => d.TeacherId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeacherReview_Teacher");
        });

        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.AssetId).HasName("PK__Asset__4349237245445389");

            entity.ToTable("Asset");

            entity.HasIndex(e => new { e.OwnerType, e.OwnerId }, "IX_Asset_Owner");

            entity.Property(e => e.AssetId).HasColumnName("AssetID");
            entity.Property(e => e.Caption).HasMaxLength(300);
            entity.Property(e => e.MimeType).HasMaxLength(100);
            entity.Property(e => e.OwnerId).HasColumnName("OwnerID");
            entity.Property(e => e.Url).HasMaxLength(1000);
        });

        modelBuilder.Entity<Attempt>(entity =>
        {
            entity.HasKey(e => e.AttemptId).HasName("PK__Attempt__891A68864B13599A");

            entity.ToTable("Attempt");

            entity.HasIndex(e => new { e.UserId, e.QuizId, e.Status }, "IX_Attempt_UserQuiz");

            entity.Property(e => e.AttemptId).HasColumnName("AttemptID");
            entity.Property(e => e.AutoScore).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.ManualScore).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.QuizId).HasColumnName("QuizID");
            entity.Property(e => e.StartedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("in_progress");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Quiz).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.QuizId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attempt_Quiz");

            entity.HasOne(d => d.User).WithMany(p => p.Attempts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attempt_User");
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.CourseId).HasName("PK__Course__C92D718727497EF0");

            entity.ToTable("Course");

            entity.Property(e => e.CourseId).HasColumnName("CourseID");
            entity.Property(e => e.CourseName).HasMaxLength(100);
            entity.Property(e => e.CreateAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.TeacherId).HasColumnName("TeacherID");

            entity.HasOne(d => d.Teacher).WithMany(p => p.Courses)
                .HasForeignKey(d => d.TeacherId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Course_Teacher");
        });

        modelBuilder.Entity<CourseChapter>(entity =>
        {
            entity.HasKey(e => e.ChapterId).HasName("PK__CourseCh__0893A34A5ECD2B1C");

            entity.ToTable("CourseChapter");

            entity.HasIndex(e => e.CourseId, "IX_Chapter_Course");

            entity.Property(e => e.ChapterId).HasColumnName("ChapterID");
            entity.Property(e => e.ChapterName).HasMaxLength(100);
            entity.Property(e => e.CourseId).HasColumnName("CourseID");

            entity.HasOne(d => d.Course).WithMany(p => p.CourseChapters)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Chapter_Course");
        });

        modelBuilder.Entity<CourseVideo>(entity =>
        {
            entity.HasKey(e => e.VideoId).HasName("PK__CourseVi__BAE5124ACCF9BFAF");

            entity.ToTable("CourseVideo");

            entity.HasIndex(e => e.CourseId, "IX_Video_Course");

            entity.HasIndex(e => new { e.CourseId, e.IsPreview }, "IX_Video_Course_Preview");

            entity.Property(e => e.VideoId).HasColumnName("VideoID");
            entity.Property(e => e.ChapterId).HasColumnName("ChapterID");
            entity.Property(e => e.CourseId).HasColumnName("CourseID");
            entity.Property(e => e.VideoName).HasMaxLength(100);
            entity.Property(e => e.VideoUrl)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("VideoURL");

            entity.HasOne(d => d.Chapter).WithMany(p => p.CourseVideos)
                .HasForeignKey(d => d.ChapterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Video_Chapter");

            entity.HasOne(d => d.Course).WithMany(p => p.CourseVideos)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Video_Course");
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.HasKey(e => e.FeedbackId).HasName("PK__Feedback__6A4BEDF68952B373");

            entity.ToTable("Feedback");

            entity.HasIndex(e => new { e.CourseId, e.CreatedAt }, "IX_Feedback_Course").IsDescending(false, true);

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_Feedback_User").IsDescending(false, true);

            entity.Property(e => e.FeedbackId).HasColumnName("FeedbackID");
            entity.Property(e => e.CourseId).HasColumnName("CourseID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsVisible).HasDefaultValue(true);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Course).WithMany(p => p.Feedbacks)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Feedback_Course");

            entity.HasOne(d => d.User).WithMany(p => p.Feedbacks)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Feedback_User");
        });

        modelBuilder.Entity<FlashcardHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PK__Flashcar__4D7B4ADDB234FCA3");

            entity.ToTable("FlashcardHistory");

            entity.Property(e => e.HistoryId).HasColumnName("HistoryID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ItemId).HasColumnName("ItemID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Item).WithMany(p => p.FlashcardHistories)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UFH_Item");

            entity.HasOne(d => d.User).WithMany(p => p.FlashcardHistories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UFH_User");
        });

        modelBuilder.Entity<FlashcardItem>(entity =>
        {
            entity.HasKey(e => e.ItemId).HasName("PK__Flashcar__727E83EBAA1FE0D8");

            entity.ToTable("FlashcardItem");

            entity.Property(e => e.ItemId).HasColumnName("ItemID");
            entity.Property(e => e.BackText).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Example).HasMaxLength(500);
            entity.Property(e => e.FrontText).HasMaxLength(500);
            entity.Property(e => e.IPA).HasMaxLength(500);
            entity.Property(e => e.SetId).HasColumnName("SetID");

            entity.HasOne(d => d.Set).WithMany(p => p.FlashcardItems)
                .HasForeignKey(d => d.SetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Flashcard__SetID__41EDCAC5");
        });

        modelBuilder.Entity<FlashcardProgress>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.ItemId }).HasName("PK__Flashcar__B0AF2492FD275D82");

            entity.ToTable("FlashcardProgress");

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.ItemId).HasColumnName("ItemID");
            entity.Property(e => e.EaseFactor)
                .HasDefaultValue(2.5m)
                .HasColumnType("decimal(4, 2)");
            entity.Property(e => e.IntervalDays).HasDefaultValue(1);

            entity.HasOne(d => d.Item).WithMany(p => p.FlashcardProgresses)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UFP_Item");

            entity.HasOne(d => d.User).WithMany(p => p.FlashcardProgresses)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UFP_User");
        });

        modelBuilder.Entity<FlashcardSet>(entity =>
        {
            entity.HasKey(e => e.SetId).HasName("PK__Flashcar__7E08473D39DBDC16");

            entity.ToTable("FlashcardSet");

            entity.Property(e => e.SetId).HasColumnName("SetID");
            entity.Property(e => e.ChapterId).HasColumnName("ChapterID");
            entity.Property(e => e.CourseId).HasColumnName("CourseID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.Chapter).WithMany(p => p.FlashcardSets)
                .HasForeignKey(d => d.ChapterId)
                .HasConstraintName("FK__Flashcard__Chapt__3E1D39E1");

            entity.HasOne(d => d.Course).WithMany(p => p.FlashcardSets)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("FK__Flashcard__Cours__3D2915A8");
        });

        modelBuilder.Entity<Option>(entity =>
        {
            entity.HasKey(e => e.OptionId).HasName("PK__Option__92C7A1DFD0F8CB95");

            entity.ToTable("Option");

            entity.HasIndex(e => e.QuestionId, "IX_Option_Question");

            entity.HasIndex(e => new { e.QuestionId, e.IsCorrect }, "IX_Option_Question_IsCorrect");

            entity.Property(e => e.OptionId).HasColumnName("OptionID");
            entity.Property(e => e.Content).HasMaxLength(1000);
            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");

            entity.HasOne(d => d.Question).WithMany(p => p.Options)
                .HasForeignKey(d => d.QuestionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Option_Question");
        });

        modelBuilder.Entity<PaymentOrder>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__PaymentO__C3905BAF3023A4DE");

            entity.ToTable("PaymentOrder");

            entity.HasIndex(e => new { e.BuyerId, e.Status, e.CreatedAt }, "IX_PO_Buyer_Status").IsDescending(false, false, true);

            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.OrderCode).HasColumnName("OrderCode");
            entity.Property(e => e.Amount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.BuyerId).HasColumnName("BuyerID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.PlanId).HasColumnName("PlanID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING");

            entity.HasOne(d => d.Buyer).WithMany(p => p.PaymentOrders)
                .HasForeignKey(d => d.BuyerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PO_Buyer");

            entity.HasOne(d => d.Plan).WithMany(p => p.PaymentOrders)
                .HasForeignKey(d => d.PlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PO_Plan");
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.QuestionId).HasName("PK__Question__0DC06F8C8994EEBA");

            entity.ToTable("Question");

            entity.HasIndex(e => new { e.GroupId, e.QuestionOrder }, "IX_Question_Group");

            entity.HasIndex(e => new { e.QuizId, e.QuestionOrder }, "IX_Question_Quiz");

            entity.Property(e => e.QuestionId).HasColumnName("QuestionID");
            entity.Property(e => e.Content).HasMaxLength(2000);
            entity.Property(e => e.GroupId).HasColumnName("GroupID");
            entity.Property(e => e.QuestionOrder).HasDefaultValue(1);
            entity.Property(e => e.QuizId).HasColumnName("QuizID");
            entity.Property(e => e.ScoreWeight)
                .HasDefaultValue(1.00m)
                .HasColumnType("decimal(6, 2)");

            entity.HasOne(d => d.Group).WithMany(p => p.Questions)
                .HasForeignKey(d => d.GroupId)
                .HasConstraintName("FK_Question_QGroup");

            entity.HasOne(d => d.Quiz).WithMany(p => p.Questions)
                .HasForeignKey(d => d.QuizId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Question_Quiz");
        });

        modelBuilder.Entity<QuestionGroup>(entity =>
        {
            entity.HasKey(e => e.GroupId).HasName("PK__Question__149AF30ABAD3200C");

            entity.ToTable("QuestionGroup");

            entity.HasIndex(e => new { e.QuizId, e.GroupOrder }, "IX_QGroup_Quiz");

            entity.Property(e => e.GroupId).HasColumnName("GroupID");
            entity.Property(e => e.Instruction).HasMaxLength(2000);
            entity.Property(e => e.QuizId).HasColumnName("QuizID");

            entity.HasOne(d => d.Quiz).WithMany(p => p.QuestionGroups)
                .HasForeignKey(d => d.QuizId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QGroup_Quiz");
        });

        modelBuilder.Entity<Quiz>(entity =>
        {
            entity.HasKey(e => e.QuizId).HasName("PK__Quiz__8B42AE6EFF47484F");

            entity.ToTable("Quiz");

            entity.HasIndex(e => new { e.CourseId, e.IsActive }, "IX_Quiz_Course");

            entity.Property(e => e.QuizId).HasColumnName("QuizID");
            entity.Property(e => e.CourseId).HasColumnName("CourseID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.Course).WithMany(p => p.Quizzes)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("FK_Quiz_Course");
        });

        modelBuilder.Entity<Request>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__Request__33A8519AFA1B282F");

            entity.ToTable("Request");

            entity.HasIndex(e => e.CourseId, "IX_Request_Course");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_Request_User");

            entity.Property(e => e.RequestId).HasColumnName("RequestID");
            entity.Property(e => e.CourseId).HasColumnName("CourseID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Course).WithMany(p => p.Requests)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("FK_Request_Course");

            entity.HasOne(d => d.ProcessedByNavigation).WithMany(p => p.RequestProcessedByNavigations)
                .HasForeignKey(d => d.ProcessedBy)
                .HasConstraintName("FK_Request_Admin");

            entity.HasOne(d => d.User).WithMany(p => p.RequestUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Request_User");
        });

        modelBuilder.Entity<RequestLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK__RequestL__5E5499A83F866F19");

            entity.ToTable("RequestLog");

            entity.HasIndex(e => new { e.ActorId, e.CreatedAt }, "IX_RequestLog_Actor_Time").IsDescending(false, true);

            entity.Property(e => e.LogId).HasColumnName("LogId");
            entity.Property(e => e.ActorId).HasColumnName("ActorId");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IP)
                .HasMaxLength(45)
                .IsUnicode(false)
                .HasColumnName("IP");
            entity.Property(e => e.Path).HasMaxLength(500);
        });

        modelBuilder.Entity<SubmissionHistory>(entity =>
        {
            entity.HasKey(e => e.SubmissionId).HasName("PK__Submissi__449EE1053EE0FBE0");

            entity.ToTable("SubmissionHistory");

            entity.Property(e => e.SubmissionId).HasColumnName("SubmissionID");
            entity.Property(e => e.AttemptId).HasColumnName("AttemptID");
            entity.Property(e => e.AutoScore).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.ManualScore).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Attempt).WithMany(p => p.SubmissionHistories)
                .HasForeignKey(d => d.AttemptId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SH_Attempt");

            entity.HasOne(d => d.User).WithMany(p => p.SubmissionHistories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SH_User");
        });

        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PK__Subscrip__755C22D7E60DD832");

            entity.ToTable("SubscriptionPlan");

            entity.HasIndex(e => e.PlanCode, "UQ__Subscrip__DDC8069B872594E4").IsUnique();

            entity.Property(e => e.PlanId).HasColumnName("PlanID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.PlanCode)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Price).HasColumnType("decimal(12, 2)");
        });

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.HasKey(e => e.TeacherId).HasName("PK__Teacher__EDF2594405080490");

            entity.ToTable("Teacher");

            entity.Property(e => e.TeacherId)
                .ValueGeneratedNever()
                .HasColumnName("TeacherID");
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.JoinAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.TeacherNavigation).WithOne(p => p.Teacher)
                .HasForeignKey<Teacher>(d => d.TeacherId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Teacher_Account");
        });

        modelBuilder.Entity<UserDetail>(entity =>
        {
            entity.HasKey(e => e.AccountId).HasName("PK__UserDeta__349DA586A40F688A");

            entity.ToTable("UserDetail");

            entity.Property(e => e.AccountId)
                .ValueGeneratedNever()
                .HasColumnName("AccountID");
            entity.Property(e => e.Address).HasMaxLength(100);
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(256)
                .IsUnicode(false)
                .HasColumnName("AvatarURL");
            entity.Property(e => e.FullName).HasMaxLength(50);
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.Account).WithOne(p => p.UserDetail)
                .HasForeignKey<UserDetail>(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserDetail_Account");
        });

        modelBuilder.Entity<UserMembership>(entity =>
        {
            entity.HasKey(e => e.MembershipId).HasName("PK__UserMemb__92A7859936ED55B6");

            entity.ToTable("UserMembership");

            entity.HasIndex(e => new { e.UserId, e.Status, e.EndsAt }, "IX_UM_User").IsDescending(false, false, true);

            entity.Property(e => e.MembershipId).HasColumnName("MembershipID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("ACTIVE");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.UserMemberships)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UM_User");
        });

        modelBuilder.Entity<UserVideoProgress>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.VideoId }).HasName("PK__UserVide__AC269D888F6F1DF6");

            entity.ToTable("UserVideoProgress");

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.VideoId).HasColumnName("VideoID");
            entity.Property(e => e.WatchedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.LastPositionSec).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.User).WithMany(p => p.UserVideoProgresses)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UVP_User");

            entity.HasOne(d => d.Video).WithMany(p => p.UserVideoProgresses)
                .HasForeignKey(d => d.VideoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UVP_Video");
        });

        modelBuilder.Entity<VUserHasActiveMembership>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vUserHasActiveMembership");

            entity.Property(e => e.UserId).HasColumnName("UserID");
        });

        modelBuilder.Entity<WebhookEvent>(entity =>
        {
            entity.HasKey(e => e.WebhookId).HasName("PK__WebhookE__238C71D183DB5693");

            entity.ToTable("WebhookEvent");

            entity.HasIndex(e => e.UniqueKey, "UQ__WebhookE__2DE46E93E1C82353").IsUnique();

            entity.Property(e => e.WebhookId).HasColumnName("WebhookID");
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.ReceivedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Signature)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UniqueKey)
                .HasMaxLength(200)
                .IsUnicode(false);

            entity.HasOne(d => d.Order).WithMany(p => p.WebhookEvents)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Webhook_Order");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
