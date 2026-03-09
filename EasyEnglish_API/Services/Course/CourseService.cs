using EasyEnglish_API.DTOs.Course;
using EasyEnglish_API.Interfaces;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Courses
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;

        public CourseService(ICourseRepository courseRepository)
        {
            _courseRepository = courseRepository;
        }
        public async Task<CourseChapter?> AddChapterAsync(CourseChapter chapter)
        {
            return await _courseRepository.AddChapterAsync(chapter);
        }

        public async Task<CourseVideo?> AddVideoAsync(CourseVideo video)
        {
            return await _courseRepository.AddVideoAsync(video);
        }

        public async Task<bool> CourseExistsAsync(int courseId)
        {
            return await _courseRepository.CourseExistsAsync(courseId);
        }

        public async Task<Course?> CreateCourseAsync(Course course)
        {
            return await _courseRepository.CreateCourseAsync(course);
        }

        public async Task<bool> DeleteChapterAsync(int chapterId)
        {
            return await _courseRepository.DeleteChapterAsync(chapterId);
        }

        public async Task<bool> DeleteCourseAsync(int courseId)
        {
            return await _courseRepository.DeleteCourseAsync(courseId);
        }

        public async Task<bool> DeleteVideoAsync(int videoId)
        {
            return await _courseRepository.DeleteVideoAsync(videoId);
        }

        public async Task<List<CourseResponse>> GetAllCoursesAsync()
        {
            var data = await _courseRepository.GetAllCoursesAsync();
            var result = data.Select(c => new CourseResponse
            {
                CourseID = c.CourseId,
                CourseName = c.CourseName,
                CourseDescription = c.Description,
                TeacherID = c.TeacherId,
                TeacherName = c.Teacher?.TeacherNavigation?.Username ?? "(No Teacher)",
                CreateAt = c.CreateAt
            }).ToList();
            return result;
        }

        public async Task<object?> GetCourseDetailAsync(int courseId)
        {
            var course = await _courseRepository.GetCourseDetailAsync(courseId);
            var response = new
            {
                course.CourseId,
                course.CourseName,
                course.Description,
                Teacher = course.Teacher != null ? new
                {
                    course.Teacher.TeacherId,
                    TeacherName = course.Teacher.TeacherNavigation?.Username ?? "(Unknown)"
                } : null,
                course.CreateAt,
                Chapters = course.CourseChapters.Select(ch => new
                {
                    ch.ChapterId,
                    ch.ChapterName
                }),
                Videos = course.CourseChapters.SelectMany(ch => ch.CourseVideos).Select(v => new
                {
                    v.VideoId,
                    v.VideoName,
                    v.VideoUrl,
                    v.IsPreview
                })
            };

            var orphanVideos = course.CourseVideos
                .Where(v => v.ChapterId == null)
                .Select(v => new
                {
                    v.VideoId,
                    v.VideoName,
                    v.VideoUrl,
                    v.IsPreview
                }).ToList();

            if (orphanVideos.Any())
            {
                response = new
                {
                    response.CourseId,
                    response.CourseName,
                    response.Description,
                    response.Teacher,
                    response.CreateAt,
                    Chapters = response.Chapters,
                    Videos = response.Videos.Concat(orphanVideos)
                };
            }
            return response;
        }

        public Task<List<Course>> GetCoursesByTeacherAsync(int teacherId)
        {
            throw new NotImplementedException();
        }

        public Task<CourseVideo?> GetVideoAsync(int videoId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> UpdateChapterAsync(CourseChapter chapter)
        {
            throw new NotImplementedException();
        }

        public Task<bool> UpdateCourseAsync(Course course)
        {
            throw new NotImplementedException();
        }
    }
}
