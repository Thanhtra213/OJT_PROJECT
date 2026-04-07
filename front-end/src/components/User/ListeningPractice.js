import { useState } from "react";

const API = "https://localhost:7131/api/user/ai-listening";

export default function AIListeningTestPage() {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  const generate = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        alert("Generate failed: " + text);
        return;
      }

      const json = await res.json();

      setData(json);
      setAnswers({});
      setResult(null);
    } catch (err) {
      console.error(err);
      alert("Error generating listening");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    try {
      setLoading(true);

      const payload = {
        promptId: data.promptId,
        answers: Object.keys(answers).map((id) => ({
          questionId: parseInt(id),
          answer: answers[id],
        })),
      };

      const res = await fetch(`${API}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        alert("Submit failed: " + text);
        return;
      }

      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error(err);
      alert("Error submitting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h1>🎧 AI Listening Test</h1>

      <button onClick={generate} disabled={loading}>
        {loading ? "Loading..." : "Generate Listening"}
      </button>

      {/* ================= GENERATE ================= */}
      {data && (
        <>
          <h2 style={{ marginTop: 20 }}>{data.title}</h2>

          {/* 🔊 AUDIO */}
          <audio
            controls
            style={{ width: "100%", marginBottom: 20 }}
          >
            <source src={data.audioUrl} type="audio/mpeg" />
            Your browser does not support audio.
          </audio>

          {/* QUESTIONS */}
          <h3>Questions</h3>

          {data.questions.map((q) => (
            <div
              key={q.questionId}
              style={{
                marginBottom: 15,
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 6,
              }}
            >
              <p>
                <b>
                  {q.questionId}. {q.content}
                </b>
              </p>

              {/* MCQ */}
              {q.type === 1 &&
                q.options?.map((opt, i) => (
                  <label key={i} style={{ display: "block" }}>
                    <input
                      type="radio"
                      name={`q-${q.questionId}`}
                      value={opt.content}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [q.questionId]: e.target.value,
                        })
                      }
                    />
                    {opt.content}
                  </label>
                ))}

              {/* FILL */}
              {q.type === 2 && (
                <input
                  type="text"
                  placeholder="Your answer..."
                  style={{ width: "100%", padding: 5 }}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [q.questionId]: e.target.value,
                    })
                  }
                />
              )}
            </div>
          ))}

          <button onClick={submit} disabled={loading}>
            Submit
          </button>
        </>
      )}

      {/* ================= RESULT ================= */}
      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>
            🎯 Score: {result.score}/{result.total}
          </h2>

          {/* 🔥 SCRIPT (CHỈ HIỆN SAU SUBMIT) */}
          <h3>Transcript</h3>
          <pre
            style={{
              background: "#eee",
              padding: 10,
              whiteSpace: "pre-wrap",
            }}
          >
            {result.script}
          </pre>

          {/* RESULT DETAIL */}
          {result.results.map((r) => (
            <div
              key={r.questionId}
              style={{
                marginBottom: 10,
                padding: 10,
                borderRadius: 6,
                background: r.isCorrect ? "#d4edda" : "#f8d7da",
              }}
            >
              <p>
                <b>{r.content}</b>
              </p>
              <p>Your: {r.userAnswer || "(empty)"}</p>
              <p>Correct: {r.correctAnswer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}