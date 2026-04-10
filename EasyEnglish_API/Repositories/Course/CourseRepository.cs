using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;
using Polly;

namespace EasyEnglish_API.Repositories.Courses
{
    public class CourseRepository : ICourseRepository
    {
        private readonly EasyEnglishDbContext _db; 

        public CourseRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<List<Course>> GetCoursesByLevelAsync(byte level, int take = 6)
        {
            return await _db.Courses
                .Where(c => c.CourseLevel == level)
                .OrderByDescending(c => c.CreateAt)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int?> GetTeacherIdByAccountIdAsync(int accountId)
        {
            var teacher = await _db.Teachers
                .FirstOrDefaultAsync(t => t.TeacherNavigation.AccountId == accountId);
            return teacher?.TeacherId;
        }

        public async Task<CourseChapter> GetChapterAsync(int courseId)
        {
            return await _db.CourseChapters.FindAsync(courseId);
        }

        public async Task<CourseChapter?> AddChapterAsync(CourseChapter chapter)
        {
            _db.CourseChapters.Add(chapter);
            await _db.SaveChangesAsync();
            return chapter;
        }

        public async Task<CourseVideo?> AddVideoAsync(CourseVideo video)
        {
            _db.CourseVideos.Add(video);
            await _db.SaveChangesAsync();
            return video;
        }

        public async Task<bool> CourseExistsAsync(int courseId)
        {

            return await _db.Courses.AnyAsync(c => c.CourseId == courseId);
        }

        public  async Task<Models.Course?> CreateCourseAsync(Models.Course course)
        {
            _db.Courses.Add(course);
            await _db.SaveChangesAsync();
            return course;
        }

        public async Task<bool> DeleteChapterAsync(int chapterId)
        {
            var chapter = await _db.CourseChapters
                .Include(ch => ch.CourseVideos)
                .FirstOrDefaultAsync(ch => ch.ChapterId == chapterId);

            if (chapter == null) return false;

            _db.CourseVideos.RemoveRange(chapter.CourseVideos);
            _db.CourseChapters.Remove(chapter);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCourseAsync(int courseId)
        {
            var course = await _db.Courses
                .Include(c => c.CourseChapters)
                    .ThenInclude(ch => ch.CourseVideos)
                .Include(c => c.Quizzes)
                    .ThenInclude(q => q.QuestionGroups)
                        .ThenInclude(g => g.Questions)
                            .ThenInclude(qs => qs.Options)
                .Include(c => c.Requests)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null) return false;

            // Xóa dữ liệu liên quan
            foreach (var quiz in course.Quizzes)
            {
                foreach (var group in quiz.QuestionGroups)
                {
                    _db.Options.RemoveRange(group.Questions.SelectMany(q => q.Options));
                    _db.Questions.RemoveRange(group.Questions);
                }

                _db.Options.RemoveRange(quiz.Questions.SelectMany(q => q.Options));
                _db.Questions.RemoveRange(quiz.Questions);
                _db.QuestionGroups.RemoveRange(quiz.QuestionGroups);
            }

            _db.Quizzes.RemoveRange(course.Quizzes);
            _db.CourseVideos.RemoveRange(course.CourseChapters.SelectMany(ch => ch.CourseVideos));
            _db.CourseChapters.RemoveRange(course.CourseChapters);
            _db.Requests.RemoveRange(course.Requests);

            _db.Courses.Remove(course);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteVideoAsync(int videoId)
        {
            var video = await _db.CourseVideos.FindAsync(videoId);
            if (video == null) return false;

            _db.CourseVideos.Remove(video);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<Models.Course>> GetAllCoursesAsync()
        {
            return await _db.Courses
                .Include(c => c.Teacher)
                    .ThenInclude(t => t.TeacherNavigation)
                        .ThenInclude(u => u.UserDetail)
                .OrderBy(c => c.CourseLevel)
                .ToListAsync();
        }

        public async Task<Models.Course?> GetCourseDetailAsync(int courseId)
        {
            return await _db.Courses
                .Include(c => c.Teacher)
                    .ThenInclude(t => t.TeacherNavigation)
                        .ThenInclude(u => u.UserDetail)
                .Include(c => c.CourseChapters)
                    .ThenInclude(ch => ch.CourseVideos)
                .Include(c => c.Quizzes)
                    .ThenInclude(q => q.Questions)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);
        }

        public async Task<List<Course>> GetCoursesByTeacherAsync(int teacherId)
        {
            return await _db.Courses
                .Where(c => c.TeacherId == teacherId)
                .OrderBy(c => c.CourseLevel)
                .ToListAsync();
        }

        public async Task<CourseVideo?> GetVideoAsync(int videoId)
        {
            var video = await _db.CourseVideos.FindAsync(videoId);
            return video;
        }

        public async Task<bool> UpdateChapterAsync(CourseChapter chapter)
        {
            if (!await _db.CourseChapters.AnyAsync(c => c.ChapterId == chapter.ChapterId))
                return false;

            _db.CourseChapters.Update(chapter);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCourseAsync(Models.Course course)
        {
            if (!await _db.Courses.AnyAsync(c => c.CourseId == course.CourseId))
                return false;

            _db.Courses.Update(course);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
