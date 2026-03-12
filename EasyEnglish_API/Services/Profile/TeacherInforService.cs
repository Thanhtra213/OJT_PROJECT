using EasyEnglish_API.DTOs.Profile;
using EasyEnglish_API.Interfaces.Profile;
using System.Text.Json;

namespace EasyEnglish_API.Services.Profile
{
    public class TeacherInforService : ITeacherInforService
    {
        private readonly ITeacherInForRepository _repo;

        public TeacherInforService(ITeacherInForRepository repo)
        {
            _repo = repo;
        }

        public async Task<TeacherInfoResponse> GetTeacherInfoAsync(int teacherId)
        {
            var teacher = await _repo.GetTeacherByIdAsync(teacherId)
                ?? throw new KeyNotFoundException("Teacher not found");

            return new TeacherInfoResponse
            {
                TeacherID = teacher.TeacherId,
                FullName = teacher.TeacherNavigation?.Username ?? "(Unknown)",
                JoinAt = teacher.JoinAt,
                Description = teacher.Description,
                Certs = ParseCerts(teacher.CertJson)
            };
        }

        public async Task UpdateTeacherInfoAsync(int accountId, TeacherUpdateInfoRequest req)
        {
            var teacher = await _repo.GetTeacherByAccountIdAsync(accountId)
                ?? throw new KeyNotFoundException("Teacher not found");

            if (!string.IsNullOrWhiteSpace(req.Description))
                teacher.Description = req.Description;

            if (req.CertUrls != null && req.CertUrls.Any())
                teacher.CertJson = JsonSerializer.Serialize(new { certs = req.CertUrls });

            await _repo.SaveChangesAsync();
        }

        private static List<string> ParseCerts(string? certJson)
        {
            if (string.IsNullOrWhiteSpace(certJson)) return new();

            try
            {
                using var doc = JsonDocument.Parse(certJson);
                if (doc.RootElement.TryGetProperty("certs", out var arr) &&
                    arr.ValueKind == JsonValueKind.Array)
                {
                    return arr.EnumerateArray()
                        .Where(x => x.ValueKind == JsonValueKind.String)
                        .Select(x => x.GetString()!)
                        .ToList();
                }
            }
            catch (JsonException) { }

            return new();
        }
    }
}
