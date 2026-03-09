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

        // -------- TEACHER SIDE --------
        Task<List<Course>> GetCoursesByTeacherAsync(int teacherId);
        Task<Course?> CreateCourseAsync(Course course);
        Task<bool> UpdateCourseAsync(Course course);
        Task<bool> DeleteCourseAsync(int courseId);

        Task<CourseChapter?> AddChapterAsync(CourseChapter chapter);
        Task<bool> UpdateChapterAsync(CourseChapter chapter);
        Task<bool> DeleteChapterAsync(int chapterId);

        //Video
        Task<CourseVideo?> GetVideoAsync(int videoId);
        Task<CourseVideo?> AddVideoAsync(CourseVideo video);
        Task<bool> DeleteVideoAsync(int videoId);
    }
}
