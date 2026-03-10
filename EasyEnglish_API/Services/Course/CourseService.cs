using EasyEnglish_API.DTOs.Course;
using EasyEnglish_API.ExternalService;
using EasyEnglish_API.Interfaces;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Courses
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly CloudflareExternal _r2;

        public CourseService(ICourseRepository courseRepository, CloudflareExternal r2)
        {
            _courseRepository = courseRepository;
            _r2 = r2;
        }

        public async Task<bool> CourseExistsAsync(int courseId)
        {
            return await _courseRepository.CourseExistsAsync(courseId);
        }


        public async Task<CourseResponse?> GetTeacherCourseDetailAsync(int teacherId, int courseId)
        {
            var course = await _courseRepository.GetCourseDetailAsync(courseId);

            if (course == null || course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            return new CourseResponse
            {
                CourseID = course.CourseId,
                CourseName = course.CourseName,
                CourseDescription = course.Description,
                TeacherID = course.TeacherId,
                TeacherName = course.Teacher?.TeacherNavigation?.Username ?? "(Unknown)",
                CreateAt = course.CreateAt
            };
        }


        public async Task<int> CreateCourseAsync(int teacherId, CreateCourseRequest req)
        {
            var course = new Course
            {
                TeacherId = teacherId,
                CourseName = req.CourseName,
                Description = req.Description,
                CourseLevel = req.CourseLevel,
                CreateAt = DateTime.UtcNow
            };

            var created = await _courseRepository.CreateCourseAsync(course);

            return created!.CourseId;
        }


        public async Task<bool> UpdateCourseAsync(int teacherId, int courseId, UpdateCourseRequest req)
        {
            var course = await _courseRepository.GetCourseDetailAsync(courseId);

            if (course == null)
                throw new Exception("Course not found");

            if (course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            course.CourseName = req.CourseName;
            course.Description = req.Description;

            return await _courseRepository.UpdateCourseAsync(course);
        }


        public async Task<bool> DeleteCourseAsync(int teacherId, int courseId)
        {
            var course = await _courseRepository.GetCourseDetailAsync(courseId);

            if (course == null)
                throw new Exception("Course not found");

            if (course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            return await _courseRepository.DeleteCourseAsync(courseId);
        }

        // =========================
        // CHAPTER
        // =========================

        public async Task<int> AddChapterAsync(int teacherId, int courseId, CreateChapterRequest req)
        {
            var course = await _courseRepository.GetCourseDetailAsync(courseId);

            if (course == null || course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            var chapter = new CourseChapter
            {
                CourseId = courseId,
                ChapterName = req.ChapterName
            };

            var created = await _courseRepository.AddChapterAsync(chapter);

            return created!.ChapterId;
        }


        public async Task<bool> UpdateChapterAsync(int teacherId, int chapterId, UpdateChapterRequest req)
        {
            var chapter = await _courseRepository.GetChapterAsync(chapterId);

            if (chapter == null)
                throw new Exception("Chapter not found");

            if (chapter.Course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            chapter.ChapterName = req.ChapterName;

            return await _courseRepository.UpdateChapterAsync(chapter);
        }


        public async Task<bool> DeleteChapterAsync(int teacherId, int chapterId)
        {
            var chapter = await _courseRepository.GetChapterAsync(chapterId);

            if (chapter == null)
                throw new Exception("Chapter not found");

            if (chapter.Course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            return await _courseRepository.DeleteChapterAsync(chapterId);
        }


        // =========================
        // VIDEO
        // =========================

        public async Task<int> AddVideoAsync(int teacherId, int chapterId, CreateVideoRequest req)
        {
            var chapter = await _courseRepository.GetChapterAsync(chapterId);

            if (chapter == null)
                throw new Exception("Chapter not found");

            if (chapter.Course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            // upload video lên Cloudflare R2
            var videoUrl = await _r2.UploadVideoAsync(
                req.VideoFile.OpenReadStream(),
                req.VideoFile.FileName,
                req.VideoFile.ContentType
            );

            var video = new CourseVideo
            {
                CourseId = chapter.CourseId,
                ChapterId = chapterId,
                VideoName = req.VideoName,
                VideoUrl = videoUrl,
                IsPreview = req.IsPreview
            };

            var created = await _courseRepository.AddVideoAsync(video);

            return created!.VideoId;
        }


        public async Task<bool> DeleteVideoAsync(int teacherId, int videoId)
        {
            var video = await _courseRepository.GetVideoAsync(videoId);

            if (video == null)
                throw new Exception("Video not found");

            if (video.Course.TeacherId != teacherId)
                throw new Exception("Forbidden");

            // xoá file trên Cloudflare
            await _r2.DeleteFileAsync(video.VideoUrl);

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

        public async Task<List<CourseResponse>> GetCoursesByTeacherAsync(int teacherId)
        {
            var courses = await _courseRepository.GetCoursesByTeacherAsync(teacherId);

            return courses.Select(c => new CourseResponse
            {
                CourseID = c.CourseId,
                CourseName = c.CourseName,
                CourseDescription = c.Description,
                TeacherID = c.TeacherId,
                TeacherName = c.Teacher?.TeacherNavigation?.Username ?? "(Unknown)",
                CreateAt = c.CreateAt
            }).ToList();
        }

        public Task<CourseVideo?> GetVideoAsync(int videoId)
        {
            throw new NotImplementedException();
        }

        public async Task<bool> DeleteCourseAsync(int courseId)
        {
            return await _courseRepository.DeleteCourseAsync(courseId);
        }


    }
}
