using EasyEnglish_API.DTOs.Course;
using EasyEnglish_API.Models;
using EasyEnglish_API.Repositories.Courses;

namespace EasyEnglish_API.Services.Courses
{
    public interface ICourseService
    {
        Task<bool> CourseExistsAsync(int courseId);
        Task<List<CourseResponse>> GetAllCoursesAsync();
        Task<object?> GetCourseDetailAsync(int courseId);
        Task<bool> DeleteCourseAsync(int courseId);
        Task<List<CourseResponse>> GetCoursesByTeacherAsync(int accountId);
        Task<CourseResponse?> GetTeacherCourseDetailAsync(int accountId, int courseId);
        Task<int> CreateCourseAsync(int accountId, CreateCourseRequest req);
        Task<bool> UpdateCourseAsync(int accountId, int courseId, UpdateCourseRequest req);
        Task<bool> DeleteCourseAsync(int accountId, int courseId);

        // ── CHAPTER ──────────────────────────────────────────────────────────
        Task<int> AddChapterAsync(int accountId, int courseId, CreateChapterRequest req);
        Task<bool> UpdateChapterAsync(int accountId, int chapterId, UpdateChapterRequest req);
        Task<bool> DeleteChapterAsync(int accountId, int chapterId);

        // ── VIDEO ────────────────────────────────────────────────────────────
        Task<int> AddVideoAsync(int accountId, int chapterId, CreateVideoRequest req);
        Task<bool> DeleteVideoAsync(int accountId, int videoId);
        Task<CourseVideo?> GetVideoAsync(int videoId);
    }
}

