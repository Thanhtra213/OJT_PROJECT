using EasyEnglish_API.DTOs.Course;
using EasyEnglish_API.Interfaces;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Course
{
    public class VideoService : IVideoService
    {
        private readonly ICourseRepository _courseDao;
        private readonly IMembershipRepository _membershipDao;

        public VideoService(ICourseRepository courseDao, IMembershipRepository membershipDao)
        {
            _courseDao = courseDao;
            _membershipDao = membershipDao;
        }

        public async Task<(VideoDto? video, int statusCode, string? message)> GetVideoAsync(int videoId, int? userId)
        {
            var video = await _courseDao.GetVideoAsync(videoId);

            if (video == null)
                return (null, 404, "Video not found");

            var dto = new VideoDto
            {
                VideoId = video.VideoId,
                VideoName = video.VideoName,
                VideoURL = video.VideoUrl,
                IsPreview = video.IsPreview
            };

            // Preview → ai cũng xem được
            if (dto.IsPreview)
            {
                dto.IsPreview = true;
                dto.CanWatch = true;
                dto.RequiresMembership = false;
                return (dto, 200, null);
            }

            // Nếu có user
            if (userId.HasValue)
            {
                bool hasMembership = await _membershipDao.HasActiveMembershipAsync(userId.Value);

                if (hasMembership)
                {
                    dto.CanWatch = true;
                    dto.RequiresMembership = true;
                    return (dto, 200, null);
                }

                dto.CanWatch = false;
                dto.RequiresMembership = true;

                return (dto, 403, "Your membership has expired or is inactive");
            }

            return (null, 401, "You must have an active membership to watch this video.");
        }
    }
}
