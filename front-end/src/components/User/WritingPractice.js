import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./writingpractice.scss";
import { generateWriting, submitWriting } from "../../middleware/writingAPI";

const WritingPractice = () => {
  const [selected, setSelected] = useState(null);
  const [writing, setWriting] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  // ✅ Lấy đề từ AI
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await generateWriting();
      setSelected({
        id: Date.now(),
        title: res.title,
        task: res.content,
        minWords: 150,
        maxWords: 300,
        level: "AI-generated",
        type: "essay",
        time: "20 phút",
      });
      setFeedback(null);
    } catch (err) {
      console.error("AI generate failed:", err);
      setMessage({
        type: "error",
        text: "⚠️ Không thể lấy đề từ AI. Hãy thử lại hoặc chọn chủ đề thủ công.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tính từ khi gõ
  const handleChange = (e) => {
    const text = e.target.value;
    setWriting(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  };

  // ✅ Gửi bài để AI chấm điểm
const handleSubmit = async () => {
  if (wordCount < selected.minWords) {
    setMessage({ type: "error", text: `❌ Cần ít nhất ${selected.minWords} từ để hoàn thành bài viết.` });
    return;
  }
  try {
    setLoading(true);
    setMessage({ type: "success", text: "📤 Đang chấm điểm, vui lòng đợi..." });
    const res = await submitWriting(selected.task, writing);
    setFeedback(res);
    setMessage({ type: "success", text: "✅ Bài viết đã được chấm xong!" });
  
  } catch (err) {
    console.error("Submit error:", err);
    setMessage({ type: "error", text: "❌ Gửi bài thất bại. Hãy kiểm tra lại kết nối hoặc token." });
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => navigate("/home");

  return (
    <div className="writing-page">
      <div className="writing-header">
        <div className="header-left">
          <h1>Luyện Writing</h1>
          <p>
            {selected
              ? `${selected.title} (${selected.minWords}-${selected.maxWords} từ)`
              : "Nhấn 'Tạo đề AI' để bắt đầu luyện viết"}
          </p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo đề AI"}
          </button>
          <button className="close-btn" onClick={handleClose} aria-label="Đóng">
            Đóng
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
        >
          {message.text}
        </div>
      )}

      <div className="writing-main">
        {/* Left Info */}
        <div className="left-section">
          {selected ? (
            <div className="info-box">
              <h3>Thông tin bài viết</h3>
              <h4>{selected.title}</h4>
              <p className="desc">{selected.task}</p>
              <div className="tags">
                <span className="tag easy">{selected.level}</span>
                <span className="tag small">{selected.type}</span>
              </div>
              <div className="info-stats">
                <p>🎯 {selected.minWords}-{selected.maxWords} từ</p>
                <p>⏱ {selected.time}</p>
              </div>
            </div>
          ) : (
            <div className="info-box placeholder">
              <h3>Hãy nhấn "Tạo đề AI" để nhận một chủ đề luyện viết</h3>
            </div>
          )}
        </div>

        {/* Center Section */}
        <div className="center-section">
          {selected ? (
            <div className="writing-area">
              <div className="writing-title">
                <h3>Khu vực viết bài</h3>
                <span className="word-limit">
                  {wordCount} / {selected.minWords}-{selected.maxWords} từ
                </span>
              </div>
              <textarea
                placeholder="Bắt đầu viết bài của bạn ở đây..."
                value={writing}
                onChange={handleChange}
                disabled={loading}
              />
              <div className="writing-actions">
                <button className="btn-outline" onClick={() => setSelected(null)}>
                  Chọn đề mới
                </button>
                <button
                  className="btn-primary submit-btn"
                  onClick={handleSubmit}
                  disabled={wordCount < selected.minWords || loading}
                >
                  Nộp bài
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Section: Feedback */}
        <div className="right-section">
  {feedback ? (
    <div className="feedback-box">
      <h3>Kết quả chấm điểm</h3>

      <div className="score-grid">
        <div className="score-item"><span>Tổng điểm: </span><strong>{feedback.score}</strong></div>
        <div className="score-item"><span>Task Response: </span><strong>{feedback.taskResponse}</strong></div>
        <div className="score-item"><span>Coherence: </span><strong>{feedback.coherence}</strong></div>
        <div className="score-item"><span>Lexical: </span><strong>{feedback.lexicalResource}</strong></div>
        <div className="score-item"><span>Grammar: </span><strong>{feedback.grammar}</strong></div>
      </div>

      {(() => {
        try {
          const fb = typeof feedback.feedback === "string"
            ? JSON.parse(feedback.feedback)
            : feedback.feedback;

          return (
            <div className="feedback-detail">
              {fb.overall && <p className="fb-overall">{fb.overall}</p>}

              {fb.taskResponse && (
                <div className="fb-section">
                  <h4>Task Response</h4>
                  <p>{fb.taskResponse.comment}</p>
                  {fb.taskResponse.issues?.length > 0 && (
                    <ul className="fb-issues">{fb.taskResponse.issues.map((i, idx) => <li key={idx}>⚠️ {i}</li>)}</ul>
                  )}
                  {fb.taskResponse.suggestions?.length > 0 && (
                    <ul className="fb-suggestions">{fb.taskResponse.suggestions.map((s, idx) => <li key={idx}>💡 {s}</li>)}</ul>
                  )}
                </div>
              )}

              {fb.coherence && (
                <div className="fb-section">
                  <h4>Coherence & Cohesion</h4>
                  <p>{fb.coherence.comment}</p>
                  {fb.coherence.issues?.length > 0 && (
                    <ul className="fb-issues">{fb.coherence.issues.map((i, idx) => <li key={idx}>⚠️ {i}</li>)}</ul>
                  )}
                  {fb.coherence.suggestions?.length > 0 && (
                    <ul className="fb-suggestions">{fb.coherence.suggestions.map((s, idx) => <li key={idx}>💡 {s}</li>)}</ul>
                  )}
                </div>
              )}

              {fb.lexical && (
                <div className="fb-section">
                  <h4>Lexical Resource</h4>
                  <p>{fb.lexical.comment}</p>
                  {fb.lexical.weakPhrases?.length > 0 && (
                    <div className="fb-table">
                      <div className="fb-table-header"><span>Từ gốc →  </span><span>Gợi ý thay thế</span></div>
                      {fb.lexical.weakPhrases.map((w, idx) => (
                        <div key={idx} className="fb-table-row">
                          <span className="original">"{w.original}"</span>
                          <span className="suggestion">→ "{w.suggestion}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {fb.grammar && (
                <div className="fb-section">
                  <h4>Grammar</h4>
                  <p>{fb.grammar.comment}</p>
                  {fb.grammar.errors?.length > 0 && (
                    <div className="fb-errors">
                      {fb.grammar.errors.map((e, idx) => (
                        <div key={idx} className="fb-error-item">
                          <p className="error-original">Lỗi: {e.original}</p>
                          <p className="error-correction">Đúng:  {e.correction}</p>
                          <p className="error-explanation">Explan: {e.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        } catch {
          return <p className="feedback-text">{feedback.feedback}</p>;
        }
      })()}

      <button className="btn-outline reset-btn" onClick={() => { setFeedback(null); setWriting(""); setWordCount(0); setSelected(null); }}>
        Làm bài mới
      </button>
    </div>
  ) : (
    <div className="criteria-box">
      <h3>Tiêu chí chấm điểm</h3>
      <ul>
        <li><strong>Phản hồi đề bài</strong> – Trả lời đầy đủ và đúng trọng tâm.</li>
        <li><strong>Mạch lạc & liên kết</strong> – Các đoạn logic, liên kết tự nhiên.</li>
        <li><strong>Từ vựng</strong> – Dùng từ chính xác, đa dạng.</li>
        <li><strong>Ngữ pháp</strong> – Cấu trúc câu phong phú, chính xác.</li>
      </ul>
    </div>
  )}
</div>
      </div>
    </div>
  );
};

export default WritingPractice;
