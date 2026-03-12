using EasyEnglish_API.DTOs.Profile;

namespace EasyEnglish_API.Services.Profile
{
    public interface ITeacherInforService
    {
        Task<TeacherInfoResponse> GetTeacherInfoAsync(int teacherId);
        Task UpdateTeacherInfoAsync(int accountId, TeacherUpdateInfoRequest req);
    }
}
