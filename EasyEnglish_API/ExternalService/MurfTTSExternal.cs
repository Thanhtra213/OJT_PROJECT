using System.Text;
using System.Text.Json;

public class MurfTTSExternal
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public MurfTTSExternal(IConfiguration config)
    {
        _http = new HttpClient();
        _apiKey = config["Murf:ApiKey"];
    }

    public async Task<string> GenerateAudioAsync(string text)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.murf.ai/v1/speech/generate");

        request.Headers.Add("api-key", _apiKey);

        var payload = new
        {
            text = text,
            voiceId = "en-UK-hazel", 
            format = "mp3"
        };

        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _http.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);

        var audioUrl = doc.RootElement
            .GetProperty("audioFile")
            .GetString();

        return audioUrl!;
    }
}