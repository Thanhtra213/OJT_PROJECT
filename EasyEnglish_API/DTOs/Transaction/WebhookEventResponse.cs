namespace EasyEnglish_API.DTOs.Transaction
{
    public class WebhookEventResponse
    {
        public int WebhookID { get; set; }

        public string UniqueKey { get; set; }

        public string Signature { get; set; }

        public DateTime ReceivedAt { get; set; }

        public string Payload { get; set; }
    }
}
