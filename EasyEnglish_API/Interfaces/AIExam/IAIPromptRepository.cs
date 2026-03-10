using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.AIExam
{
    public interface IAIPromptRepository
    {
        Task<AIPrompt> CreateAsync(AIPrompt prompt);
        Task<AIPrompt> GetByIdAsync(int promptId);
    }
}
