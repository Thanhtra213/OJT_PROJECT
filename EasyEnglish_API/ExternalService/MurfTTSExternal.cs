using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

public class MurfTTSExternal
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private static readonly Random _rand = new Random();

    // Giới hạn plain text mỗi chunk (Murf giới hạn ~3000 ký tự SSML,
    // dùng plain text nên đặt thấp hơn để an toàn)
    private const int MaxChunkLength = 2500;

    public MurfTTSExternal(IConfiguration config)
    {
        _http = new HttpClient { Timeout = TimeSpan.FromMinutes(3) };
        _apiKey = config["Murf:ApiKey"] ?? throw new Exception("Murf:ApiKey is not configured.");
    }

    // -------------------------------------------------------------------------
    // Chia script thành các chunk sao cho plain text mỗi chunk <= MaxChunkLength
    // -------------------------------------------------------------------------
    private List<string> SplitScriptIntoChunks(string script)
    {
        var lines = script.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var chunks = new List<string>();
        var currentLines = new List<string>();
        int currentLength = 0;

        foreach (var line in lines)
        {
            var match = Regex.Match(line, @"^(Speaker\s*[AB]|A|B)\s*:\s*(.+)", RegexOptions.IgnoreCase);
            if (!match.Success) continue;

            var text = match.Groups[2].Value.Trim();
            if (string.IsNullOrEmpty(text)) continue;

            // +1 cho newline
            if (currentLength + text.Length + 1 > MaxChunkLength && currentLines.Count > 0)
            {
                chunks.Add(string.Join("\n", currentLines));
                currentLines.Clear();
                currentLength = 0;
            }

            currentLines.Add(line);
            currentLength += text.Length + 1;
        }

        if (currentLines.Count > 0)
            chunks.Add(string.Join("\n", currentLines));

        return chunks;
    }

    // -------------------------------------------------------------------------
    // Chuyển script chunk thành plain text (không có SSML)
    // -------------------------------------------------------------------------
    private string ConvertToPlainText(string scriptChunk)
    {
        var lines = scriptChunk.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var sb = new StringBuilder();

        foreach (var line in lines)
        {
            var match = Regex.Match(line, @"^(Speaker\s*[AB]|A|B)\s*:\s*(.+)", RegexOptions.IgnoreCase);
            if (!match.Success) continue;

            var text = match.Groups[2].Value.Trim();
            if (!string.IsNullOrEmpty(text))
                sb.AppendLine(text);
        }

        return sb.ToString().Trim();
    }

    // -------------------------------------------------------------------------
    // Gọi Murf API cho một chunk, trả về audio URL
    // -------------------------------------------------------------------------
    private async Task<string> GenerateAudioChunkAsync(string scriptChunk)
    {
        var plainText = ConvertToPlainText(scriptChunk);

        if (string.IsNullOrWhiteSpace(plainText))
            throw new Exception("Chunk rỗng sau khi convert sang plain text.");

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.murf.ai/v1/speech/generate");
        request.Headers.Add("api-key", _apiKey);

        var payload = new
        {
            text = plainText,
            voiceId = "en-UK-hazel",
            format = "MP3",          // Murf yêu cầu uppercase
            encodeAsBase64 = false
        };

        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _http.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Murf error: {json}");

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Murf có thể trả về "audioFile" hoặc "audio_file" tùy version
        if (root.TryGetProperty("audioFile", out var af) && !string.IsNullOrEmpty(af.GetString()))
            return af.GetString()!;

        if (root.TryGetProperty("audio_file", out var af2) && !string.IsNullOrEmpty(af2.GetString()))
            return af2.GetString()!;

        if (root.TryGetProperty("encodedAudio", out var ea) && !string.IsNullOrEmpty(ea.GetString()))
            return ea.GetString()!;

        throw new Exception($"Không tìm thấy audio URL trong response: {json}");
    }

    // -------------------------------------------------------------------------
    // Entrypoint chính
    // -------------------------------------------------------------------------
    public async Task<string> GenerateAudioAsync(string script)
    {
        if (string.IsNullOrWhiteSpace(script))
            throw new ArgumentException("Script không được để trống.");

        var chunks = SplitScriptIntoChunks(script);

        if (chunks.Count == 0)
            throw new Exception("Không parse được dòng thoại nào từ script. Kiểm tra format: 'A: ...' hoặc 'Speaker A: ...'");

        if (chunks.Count == 1)
            return await GenerateAudioChunkAsync(chunks[0]);

        // Nhiều chunk → gọi song song, ghép URL bằng dấu phẩy
        var audioUrls = await Task.WhenAll(chunks.Select(GenerateAudioChunkAsync));
        return string.Join(",", audioUrls);
    }
}