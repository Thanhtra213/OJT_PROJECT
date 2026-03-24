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

        
        private async Task<int> ResolveTeacherIdAsync(int accountId)
        {
            var teacherId = await _courseRepository.GetTeacherIdByAccountIdAsync(accountId);
            if (teacherId == null)
                throw new KeyNotFoundException("Teacher profile not found for this account.");
            return teacherId.Value;
        }

        // ── COURSE ───────────────────────────────────────────────────────────

        public async Task<bool> CourseExistsAsync(int courseId)
        {
            return await _courseRepository.CourseExistsAsync(courseId);
        }

        public async Task<List<CourseResponse>> GetAllCoursesAsync()
        {
            var data = await _courseRepository.GetAllCoursesAsync();

            return data.Select(c => new CourseResponse
            {
                CourseID = c.CourseId,
                CourseName = c.CourseName,
                CourseDescription = c.Description,
                TeacherID = c.TeacherId,
                TeacherName = c.Teacher?.TeacherNavigation?.Username ?? "(No Teacher)",
                CreateAt = c.CreateAt
            }).ToList();
        }

        public async Task<object?> GetCourseDetailAsync(int courseId)
        {
            var course = await _courseRepository.GetCourseDetailAsync(courseId);
            if (course == null)
                throw new KeyNotFoundException("Course not found");

            var chapters = course.CourseChapters.Select(ch => new
            {
                ch.ChapterId,
                ch.ChapterName,
                Videos = ch.CourseVideos.Select(v => new
                {
                    v.VideoId,
                    v.VideoName,
                    v.VideoUrl,
                    v.IsPreview
                })
            });

            var orphanVideos = course.CourseVideos
                .Where(v => v.ChapterId == null)
                .Select(v => new
                {
                    v.VideoId,
                    v.VideoName,
                    v.VideoUrl,
                    v.IsPreview
                }).ToList();

            return new
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
                Chapters = chapters,
                OrphanVideos = orphanVideos
            };
        }

        public async Task<List<CourseResponse>> GetCoursesByTeacherAsync(int accountId)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

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

        public async Task<CourseDetailDto?> GetTeacherCourseDetailAsync(int accountId, int courseId)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var course = await _courseRepository.GetCourseDetailAsync(courseId);
            if (course == null || course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

            var dto = new CourseDetailDto
            {
                CourseID = course.CourseId,
                CourseName = course.CourseName,
                Description = course.Description ?? "",
                CourseLevel = course.CourseLevel,
                Chapters = course.CourseChapters.Select(ch => new ChapterDetailDto
                {
                    ChapterID = ch.ChapterId,
                    ChapterName = ch.ChapterName,
                    Videos = ch.CourseVideos.Select(v => new VideoDetailDto
                    {
                        VideoID = v.VideoId,
                        VideoName = v.VideoName,
                        VideoURL = v.VideoUrl,
                        IsPreview = v.IsPreview
                    }).ToList()
                }).ToList()
            };
            var orphanVideos = course.CourseVideos
    .Where(v => v.ChapterId == null)
    .Select(v => new VideoDetailDto
    {
        VideoID = v.VideoId,
        VideoName = v.VideoName,
        VideoURL = v.VideoUrl,
        IsPreview = v.IsPreview
    })
    .ToList();

            if (orphanVideos.Any())
            {
                dto.Chapters.Add(new ChapterDetailDto
                {
                    ChapterID = 0,
                    ChapterName = "(Uncategorized Videos)",
                    Videos = orphanVideos
                });
            }
            return dto;
        }

        public async Task<int> CreateCourseAsync(int accountId, CreateCourseRequest req)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var course = new Models.Course
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

        public async Task<bool> UpdateCourseAsync(int accountId, int courseId, UpdateCourseRequest req)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var course = await _courseRepository.GetCourseDetailAsync(courseId)
                ?? throw new KeyNotFoundException("Course not found");

            if (course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

            course.CourseName = req.CourseName;
            course.Description = req.Description;

            return await _courseRepository.UpdateCourseAsync(course);
        }

        public async Task<bool> DeleteCourseAsync(int accountId, int courseId)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var course = await _courseRepository.GetCourseDetailAsync(courseId)
                ?? throw new KeyNotFoundException("Course not found");

            if (course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

            return await _courseRepository.DeleteCourseAsync(courseId);
        }

        // ── CHAPTER ──────────────────────────────────────────────────────────

        public async Task<int> AddChapterAsync(int accountId, int courseId, CreateChapterRequest req)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var course = await _courseRepository.GetCourseDetailAsync(courseId)
                ?? throw new KeyNotFoundException("Course not found");

            if (course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

            var chapter = new CourseChapter
            {
                CourseId = courseId,
                ChapterName = req.ChapterName
            };

            var created = await _courseRepository.AddChapterAsync(chapter);
            return created!.ChapterId;
        }

        public async Task<bool> UpdateChapterAsync(int accountId, int chapterId, UpdateChapterRequest req)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var chapter = await _courseRepository.GetChapterAsync(chapterId)
                ?? throw new KeyNotFoundException("Chapter not found");

            if (chapter.Course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

            chapter.ChapterName = req.ChapterName;

            return await _courseRepository.UpdateChapterAsync(chapter);
        }

        public async Task<bool> DeleteChapterAsync(int accountId, int chapterId)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var chapter = await _courseRepository.GetChapterAsync(chapterId)
                ?? throw new KeyNotFoundException("Chapter not found");

            if (chapter.Course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

            return await _courseRepository.DeleteChapterAsync(chapterId);
        }

        // ── VIDEO ────────────────────────────────────────────────────────────

        public async Task<int> AddVideoAsync(int accountId, int chapterId, CreateVideoRequest req)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var chapter = await _courseRepository.GetChapterAsync(chapterId)
                ?? throw new KeyNotFoundException("Chapter not found");

            if (chapter.Course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

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

        public async Task<bool> DeleteVideoAsync(int accountId, int videoId)
        {
            var teacherId = await ResolveTeacherIdAsync(accountId);

            var video = await _courseRepository.GetVideoAsync(videoId)
                ?? throw new KeyNotFoundException("Video not found");

            if (video.Course.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Forbidden");

            await _r2.DeleteFileAsync(video.VideoUrl);

            return await _courseRepository.DeleteVideoAsync(videoId);
        }

        public async Task<CourseVideo?> GetVideoAsync(int videoId)
        {
            return await _courseRepository.GetVideoAsync(videoId);
        }

        public async Task<bool> DeleteCourseAsync(int courseId)
        {
            return await _courseRepository.DeleteCourseAsync(courseId);
        }
    }
}