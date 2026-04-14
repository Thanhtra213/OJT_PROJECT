using EasyEnglish_API.DTOs.Profile;
using EasyEnglish_API.ExternalService;
using EasyEnglish_API.Interfaces.Profile;
using EasyEnglish_API.Security;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Services.Profile
{
        public class ProfileService : IProfileService
        {
            private readonly IProfileRepository _repo;
            private readonly CloudflareExternal _r2;

            public ProfileService(IProfileRepository repo, CloudflareExternal r2)
            {
                _repo = repo;
                _r2 = r2;
            }

            public async Task<GetProfileDetail> GetDetailAsync(int userId)
            {
                var user = await _repo.GetAccountAsync(userId)
                    ?? throw new KeyNotFoundException("Account not found");

            var detail = await _repo.GetUserDetailAsync(userId)
                    ?? throw new KeyNotFoundException("User detail not found");

                return new GetProfileDetail
                {
                    AccountID = detail.AccountId,
                    FullName = detail.FullName,
                    Email = user.Email,
                    Dob = detail.Dob,
                    Address = detail.Address,
                    Phone = detail.Phone
                };
            }

            public async Task<string> GetAvatarAsync(int userId)
            {
                var detail = await _repo.GetUserDetailAsync(userId)
                    ?? throw new KeyNotFoundException("User not found");

            if (string.IsNullOrEmpty(detail.AvatarUrl))
                return null;

                return detail.AvatarUrl;
            }

        public async Task UpdateDetailAsync(int userId, UpdateUserDetailRequest req)
        {
            // ❗ check null request
            if (req == null)
                throw new ArgumentNullException(nameof(req), "Request không được null");

            var detail = await _repo.GetUserDetailAsync(userId);

            // ❗ check user tồn tại
            if (detail == null)
                throw new KeyNotFoundException("Account not found");

            // ❗ validate FullName
            if (!string.IsNullOrWhiteSpace(req.FullName))
            {
                if (req.FullName.Length > 100)
                    throw new ArgumentException("FullName không được vượt quá 100 ký tự");

                detail.FullName = req.FullName.Trim();
            }

            if (req.Dob.HasValue)
            {
                if (req.Dob.Value >= DateOnly.FromDateTime(DateTime.UtcNow))
                    throw new ArgumentException("Ngày sinh không hợp lệ (lớn hơn hiện tại)");

                if (req.Dob.Value.Year < 1900)
                    throw new ArgumentException("Ngày sinh không hợp lệ");

                detail.Dob = req.Dob.Value;
            }
            if (!string.IsNullOrWhiteSpace(req.Address))
            {
                if (req.Address.Length > 255)
                    throw new ArgumentException("Address quá dài");

                detail.Address = req.Address.Trim();
            }

            if (!string.IsNullOrWhiteSpace(req.Phone))
            {
                var phone = req.Phone.Trim();
                if (!System.Text.RegularExpressions.Regex.IsMatch(phone, @"^[0-9]{9,11}$"))
                    throw new ArgumentException("Số điện thoại không hợp lệ");

                detail.Phone = phone;
            }

            try
            {
                await _repo.SavechangeAsync();
            }
            catch (DbUpdateException ex)
            {
                throw new Exception("Lỗi khi cập nhật dữ liệu DB", ex);
            }
            catch (Exception ex)
            {
                throw new Exception("Có lỗi xảy ra khi cập nhật thông tin", ex);
            }
        }

        public async Task<string> ChangeAvatarAsync(int userId, IFormFile file)
            {
                var detail = await _repo.GetUserDetailAsync(userId)
                    ?? throw new KeyNotFoundException("User not found");

                if (file == null || file.Length == 0)
                    throw new ArgumentException("No file uploaded.");

                var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
                if (!allowed.Contains(file.ContentType.ToLower()))
                    throw new ArgumentException("Invalid file type.");

                // Xoá avatar cũ nếu có
                if (!string.IsNullOrEmpty(detail.AvatarUrl))
                    await _r2.DeleteFileAsync(detail.AvatarUrl);

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var randomName = $"{Guid.NewGuid():N}{ext}";
                var keyPath = $"avatars/{randomName}";

                await using var stream = file.OpenReadStream();
                var newUrl = await _r2.UploadAvatarAsync(stream, keyPath, file.ContentType);

                detail.AvatarUrl = newUrl;
                await _repo.SavechangeAsync();

                return newUrl;
            }

            public async Task ChangePasswordAsync(int userId, ChangePasswordRequest req)
            {
                if (req.NewPassword != req.ConfirmNewPassword)
                    throw new ArgumentException("New password and confirm do not match.");

                var acc = await _repo.GetAccountAsync(userId)
                    ?? throw new KeyNotFoundException("Account not found.");

                if (!PasswordHasher.Verify(req.CurrentPassword, acc.Hashpass))
                    throw new UnauthorizedAccessException("Current password is incorrect.");

                acc.Hashpass = PasswordHasher.Hash(req.NewPassword);
                await _repo.SavechangeAsync();
            }
        }
    }

