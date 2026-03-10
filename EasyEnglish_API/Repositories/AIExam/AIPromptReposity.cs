using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Repositories.AIExam
{
    public class AIPromptReposity : IAIPromptRepository
    {
        private readonly EasyEnglishDbContext _db;

        public AIPromptReposity(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<AIPrompt> CreateAsync(AIPrompt prompt)
        {
            _db.AIPrompts.Add(prompt);
            await _db.SaveChangesAsync();
            return prompt;
        }

        public async Task<AIPrompt?> GetByIdAsync(int promptId)
        {
            return await _db.AIPrompts.FindAsync(promptId);
        }
    }
}
