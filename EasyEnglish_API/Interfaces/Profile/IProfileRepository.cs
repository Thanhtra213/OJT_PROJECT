using EasyEnglish_API.Data;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Profile
{
    public interface IProfileRepository
    {
        Task<Account?> GetAccountAsync(int accountId);
        Task<UserDetail> GetUserDetailAsync(int userId);
        Task SavechangeAsync();
    }
}
