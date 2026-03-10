using EasyEnglish_API.DTOs.AIExam;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using EasyEnglish_API.ExternalService;

namespace EasyEnglish_API.Services.AIExam
{
    public class AIQuizService : IAIQuizService
    {
        private readonly AIQuizExternal _ai;

        public AIQuizService(AIQuizExternal ai)
        {
            _ai = ai;
        }

        public async Task<AIQuizResponse> GenerateQuizAsync([FromBody] AIQuizRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Prompt))
                throw new("Prompt cannot be empty.");

            var json = await _ai.GenerateQuizAsync(req.Prompt);

            try
            {
                var parsed = JsonDocument.Parse(json);
                return new AIQuizResponse
                {
                    Json = parsed.RootElement,
                    RawText = json
                };
            }
            catch (JsonException)
            {
                return new AIQuizResponse
                {
                    RawText = json,
                    Error = "Failed to parse JSON from AI response. Check formatting."
                };
            }
        }
    }
}
