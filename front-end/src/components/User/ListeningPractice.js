import { useState } from "react";
import "./listeningPractice.scss";

const API = "https://localhost:7131/api/user/ai-listening";

export default function AIListeningPractice() {
  const [data, setData]       = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  const token = localStorage.getItem("accessToken");

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Generate ──────────────────────────────────────────────────
  const generate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        showToast("error", "Không thể tạo bài: " + text);
        return;
      }

      const json = await res.json();
      setData(json);
      setAnswers({});
      setResult(null);
      showToast("success", "Đã tạo bài nghe mới. Hãy nghe và trả lời câu hỏi!");
    } catch (err) {
      console.error(err);
      showToast("error", "Lỗi kết nối. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────
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
        showToast("error", "Nộp bài thất bại: " + text);
        return;
      }

      const json = await res.json();
      setResult(json);
      showToast("success", ` Kết quả: ${json.score}/${json.total} câu đúng!`);
    } catch (err) {
      console.error(err);
      showToast("error", "Lỗi khi nộp bài. Kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = data?.questions?.length ?? 0;

  return (
    <div className="listening-container">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="listening-page-header">
        <div className="header-content">
          <div className="title-group">
            <div>
              <h1>Luyện Nghe Tiếng Anh</h1>
              <p>Phát triển kỹ năng Listening với sự hỗ trợ từ AI</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-generate"
              onClick={generate}
              disabled={loading}
            >
              {loading ? (
                <><span className="btn-spinner" /> Đang tạo...</>
              ) : (
                <>Tạo bài nghe mới</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div className={`alert-toast animation-slide-in ${toast.type}`}>
          <span>{toast.text}</span>
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="listening-content">

        {/* Audio + Title */}
        <div className="card audio-card animation-fade-in">
          <div className="card-header">
            <span className="header-icon">🔊</span>
            <h3>Bài nghe</h3>
          </div>

          {data ? (
            <div className="audio-body">
              <div className="title-row">
                <h2>{data.title}</h2>
                <span className="badge">AI-generated</span>
              </div>
              <audio controls>
                <source src={data.audioUrl} type="audio/mpeg" />
                Trình duyệt của bạn không hỗ trợ audio.
              </audio>
            </div>
          ) : (
            <div className="card-placeholder">
              <div className="placeholder-icon">🎧</div>
              <div className="skeleton-group">
                <div className="skeleton-line" />
                <div className="skeleton-line mid" />
                <div className="skeleton-line short" />
              </div>
              <p>Nhấn "Tạo bài nghe mới" để bắt đầu luyện tập</p>
            </div>
          )}
        </div>

        {/* Questions */}
        {data && !result && (
          <div className="card questions-card animation-fade-in">
            <div className="card-header">
              <span className="header-icon"></span>
              <h3>
                Câu hỏi&nbsp;
                <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                  ({answeredCount}/{totalQuestions} đã trả lời)
                </span>
              </h3>
            </div>

            <div className="questions-body">
              {data.questions.map((q) => (
                <div key={q.questionId} className="question-item">
                  <p className="question-label">
                    {q.questionId}.&nbsp;{q.content}
                  </p>

                  {/* MCQ */}
                  {q.type === 1 && (
                    <div className="options-list">
                      {q.options?.map((opt, i) => (
                        <label key={i} className="option-label">
                          <input
                            type="radio"
                            name={`q-${q.questionId}`}
                            value={opt.content}
                            checked={answers[q.questionId] === opt.content}
                            onChange={(e) =>
                              setAnswers({ ...answers, [q.questionId]: e.target.value })
                            }
                          />
                          {opt.content}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Fill-in */}
                  {q.type === 2 && (
                    <input
                      type="text"
                      className="fill-input"
                      placeholder="Nhập câu trả lời của bạn..."
                      value={answers[q.questionId] ?? ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.questionId]: e.target.value })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        {data && !result && (
          <div className="listening-footer animation-fade-in">
            <button
              className="btn-outline"
              onClick={() => { setData(null); setAnswers({}); }}
              disabled={loading}
            >
              Chọn bài khác
            </button>
            <button
              className="btn-primary"
              onClick={submit}
              disabled={loading || answeredCount === 0}
            >
              {loading ? (
                <><span className="btn-spinner" /> Đang chấm...</>
              ) : (
                <>📤 Nộp bài ({answeredCount}/{totalQuestions})</>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card result-card animation-fade-in">
            <div className="result-header-bar">
              <div className="score-block">
                <span className="score-label">Kết quả</span>
                <div className="score-value">
                  {result.score}<span style={{ fontSize: "1.5rem", opacity: 0.6 }}>/{result.total}</span>
                </div>
              </div>
              <div className="score-badge">
                {result.score === result.total ? "🏆" : result.score >= result.total / 2 ? "👍" : "📚"}
              </div>
            </div>

            {result.script && (
              <div className="transcript-section">
                <h4>Transcript</h4>
                <pre>{result.script}</pre>
              </div>
            )}

            <div className="result-list">
              <h4>Chi tiết từng câu</h4>
              {result.results.map((r) => (
                <div
                  key={r.questionId}
                  className={`result-item ${r.isCorrect ? "correct" : "wrong"}`}
                >
                  <p className="result-question">
                    {r.isCorrect ? "✅" : "❌"}&nbsp;{r.content}
                  </p>
                  <div className="result-answers">
                    {!r.isCorrect && (
                      <span className="your-answer">Bạn trả lời: {r.userAnswer || "(bỏ trống)"}</span>
                    )}
                    <span className="correct-answer">Đáp án đúng: {r.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redo button after result */}
        {result && (
          <div className="listening-footer animation-fade-in">
            <button
              className="btn-outline"
              onClick={() => { setData(null); setAnswers({}); setResult(null); }}
            >
              Làm bài khác
            </button>
            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? <><span className="btn-spinner" /> Đang tạo...</> : <>🎲 Tạo bài mới</>}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}