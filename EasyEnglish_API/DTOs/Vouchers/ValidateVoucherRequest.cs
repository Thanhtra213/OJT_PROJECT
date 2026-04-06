using System.ComponentModel.DataAnnotations;

namespace EasyEnglish_API.DTOs.Vouchers
{
    public class ValidateVoucherRequest
    {
        public string Code { get; set; } = null!;
        public int PlanId { get; set; }
    }
}
