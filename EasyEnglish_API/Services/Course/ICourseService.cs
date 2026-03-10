using EasyEnglish_API.DTOs.Course;
using EasyEnglish_API.Models;
using EasyEnglish_API.Repositories.Courses;

namespace EasyEnglish_API.Services.Courses
{
    public interface ICourseService
    {
        Task<List<CourseResponse>> GetAllCoursesAsync();
        Task<object?> GetCourseDetailAsync(int courseId);
        Task<bool> CourseExistsAsync(int courseId);
        Task<bool> DeleteCourseAsync(int courseId);

        // -------- TEACHER SIDE --------
        Task<List<CourseResponse>> GetCoursesByTeacherAsync(int teacherId);

        Task<CourseResponse?> GetTeacherCourseDetailAsync(int teacherId, int courseId);

        Task<int> CreateCourseAsync(int teacherId, CreateCourseRequest req);

        Task<bool> UpdateCourseAsync(int teacherId, int courseId, UpdateCourseRequest req);

        Task<bool> DeleteCourseAsync(int teacherId, int courseId);


        // ===== CHAPTER =====

        Task<int> AddChapterAsync(int teacherId, int courseId, CreateChapterRequest req);

        Task<bool> UpdateChapterAsync(int teacherId, int chapterId, UpdateChapterRequest req);

        Task<bool> DeleteChapterAsync(int teacherId, int chapterId);


        // ===== VIDEO =====

        Task<int> AddVideoAsync(int teacherId, int chapterId, CreateVideoRequest req);

        Task<bool> DeleteVideoAsync(int teacherId, int videoId);
        Task<CourseVideo?> GetVideoAsync(int videoId);
    }
}
