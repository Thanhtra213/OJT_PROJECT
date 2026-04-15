import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Send,
  X,
  PenTool,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Trophy,
  MessageCircle,
  FileText,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import "./writingpractice.scss";
import { generateWriting, submitWriting } from "../../middleware/writingAPI";

const WritingPractice = () => {
  const [selected, setSelected] = useState(null);
  const [writing, setWriting] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  // ── Timer: 40 phút = 2400 giây ──────────────────────────────────────────
  const WRITE_TIME = 40 * 60;
  const [timeLeft, setTimeLeft] = useState(WRITE_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef(null);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(WRITE_TIME);
    setTimerActive(true);
    setTimerDone(false);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          setTimerDone(true);
          setShowConfirm(true); // Auto-show submit modal
          setMessage({ type: "error", text: "⏰ Hết 40 phút! Hãy nộp bài ngay." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // ✅ Clear message after 5s
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ Lấy đề từ AI
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await generateWriting();
      setSelected({
        promptId: res.promptId || res.id,
        title: res.title || "Chủ đề Writing ngẫu nhiên",
        task: res.content || res.task || "Không có nội dung đề bài.",
        minWords: 150,
        maxWords: 300,
        level: "AI-generated",
        type: "IELTS Essay",
        time: "40 phút",
      });
      setFeedback(null);
      setWriting("");
      setWordCount(0);
      startTimer(); // ← Start 40-min writing timer
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
    const count = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(count);
  };

  // ✅ Gửi bài
  const handleFinalSubmit = async (sendToTeacher = false) => {
    if (!selected) return;
    if (wordCount < 10) {
      setMessage({ type: "error", text: "❌ Bài viết quá ngắn để có thể chấm điểm." });
      return;
    }

    try {
      setLoading(true);
      setShowConfirm(false);
      clearTimer();
      setTimerActive(false);
      setMessage({ type: "info", text: "📤 Đang xử lý bài viết, vui lòng đợi..." });

      const res = await submitWriting(selected.promptId, writing, sendToTeacher);
      setFeedback(res);

      if (sendToTeacher) {
        setMessage({ type: "success", text: "✅ Bài viết đã được gửi cho giáo viên và AI đã chấm điểm xong!" });
      } else {
        setMessage({ type: "success", text: "✅ AI đã chấm điểm bài viết của bạn!" });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage({ type: "error", text: "❌ Gửi bài thất bại. Hãy kiểm tra lại kết nối." });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => navigate("/home");

  const wordProgress = selected ? Math.min((wordCount / selected.minWords) * 100, 100) : 0;

  return (
    <div className="writing-container">
      {/* Header Area */}
      <header className="writing-page-header">
        <div className="header-content">
          <div className="title-group">
            <div className="icon-badge">
              <PenTool size={24} />
            </div>
            <div>
              <h1>Luyện Viết Tiếng Anh</h1>
              <p>Phát triển kỹ năng Writing với sự hỗ trợ từ AI và Giáo viên</p>
            </div>
          </div>
          <div className="header-actions">
            {!selected && (
              <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
                {loading ? <RefreshCw className="spin" size={18} /> : <Plus size={18} />}
                {loading ? "Đang tạo đề..." : "Tạo đề AI"}
              </button>
            )}
            <button className="btn-close" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Alert System */}
      {message && (
        <div className={`alert-toast animation-slide-in ${message.type}`}>
          {message.type === "error" ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X size={14} /></button>
        </div>
      )}

      <main className="writing-content">
        <div className="layout-grid">
          {/* Sidebar Left: Task Info */}
          <aside className="sidebar-left">
            <div className="card task-card">
              <div className="card-header">
                <BookOpen size={18} />
                <h3>Đề bài</h3>
              </div>
              {selected ? (
                <div className="task-content">
                  <div className="tag-row">
                    <span className="badge level">{selected.level}</span>
                    <span className="badge type">{selected.type}</span>
                  </div>
                  <h4 className="task-title">{selected.title}</h4>
                  <p className="task-desc">{selected.task}</p>
                  <div className="task-meta">
                    <div className="meta-item">
                      <span className="label">Mục tiêu:</span>
                      <span className="value">{selected.minWords}-{selected.maxWords} từ</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Thời gian:</span>
                      <span className="value">{selected.time}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-placeholder">
                  <div className="skeleton-group">
                    <div className="skeleton-line" />
                    <div className="skeleton-line mid" />
                    <div className="skeleton-line short" />
                  </div>
                  <p>Hãy nhấn "Tạo đề AI" để bắt đầu bài luyện tập mới</p>
                </div>
              )}
            </div>

            <div className="card info-card">
              <div className="card-header">
                <Trophy size={18} />
                <h3>Tiêu chí chấm điểm</h3>
              </div>
              <ul className="criteria-list">
                <li><strong>Task Response:</strong> Mức độ hoàn thành yêu cầu đề bài.</li>
                <li><strong>Coherence:</strong> Sự mạch lạc và liên kết của các đoạn văn.</li>
                <li><strong>Lexical:</strong> Sự đa dạng và chính xác của từ vựng.</li>
                <li><strong>Grammar:</strong> Độ phong phú và chính xác của ngữ pháp.</li>
              </ul>
            </div>
          </aside>

          {/* Center: Editor */}
          <section className="editor-section">
            <div className="card editor-card">
              <div className="editor-header">
                <h3>Khu vực làm bài</h3>
                <div className="editor-header-right">
                  {/* Timer hiển thị */}
                  {selected && (
                    <div className={`writing-timer-chip ${timerDone ? "timer-done" : timeLeft < 300 ? "timer-warn" : ""}`}>
                      <span className="timer-icon">⏱</span>
                      <span className="timer-value">{formatTime(timeLeft)}</span>
                      {timerDone && <span className="timer-over-text">Hết giờ!</span>}
                    </div>
                  )}
                  <div className="word-count-chip">
                    <FileText size={14} />
                    <span>{wordCount} từ</span>
                    {selected && (
                      <div className="progress-mini">
                        <div className="bar" style={{ width: `${wordProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <textarea
                className="writing-textarea"
                placeholder="Trình bày bài luận của bạn tại đây..."
                value={writing}
                onChange={handleChange}
                disabled={loading || !selected || timerDone}
              />

              <div className="editor-footer">
                {selected && (
                  <>
                    <button
                      className="btn-text"
                      onClick={() => setSelected(null)}
                      disabled={loading}
                    >
                      Chọn đề khác
                    </button>
                    <div className="footer-btns-container">
                      <div className="footer-btns">
                        <button
                          className="btn-outline"
                          onClick={() => handleFinalSubmit(false)}
                          disabled={wordCount < 10 || loading}
                        >
                          Chấm điểm AI
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => setShowConfirm(true)}
                          disabled={wordCount < 10 || loading || !feedback}
                        >
                          <Send size={16} /> Gửi cho giáo viên
                        </button>
                      </div>
                      {!feedback && wordCount >= 10 && (
                        <p className="btn-hint">Vui lòng chấm điểm AI trước khi gửi cho giáo viên</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Sidebar Right: Feedback */}
          <aside className="sidebar-right">
            <div className={`card feedback-card ${feedback ? 'has-content' : ''}`}>
              <div className="card-header">
                <MessageCircle size={18} />
                <h3>Kết quả & Feedback</h3>
              </div>

              {feedback ? (
                <div className="feedback-body">
                  <div className="overall-score">
                    <span className="label">Band Score</span>
                    <h2 className="score-value">{feedback.score}</h2>
                  </div>

                  <div className="sub-scores">
                    <div className="sub-item">
                      <span>Task: {feedback.taskResponse}</span>
                      <div className="mini-bar"><div className="fill" style={{ width: `${feedback.taskResponse * 10}%` }} /></div>
                    </div>
                    <div className="sub-item">
                      <span>Coherence: {feedback.coherence}</span>
                      <div className="mini-bar"><div className="fill" style={{ width: `${feedback.coherence * 10}%` }} /></div>
                    </div>
                    <div className="sub-item">
                      <span>Lexical: {feedback.lexicalResource}</span>
                      <div className="mini-bar"><div className="fill" style={{ width: `${feedback.lexicalResource * 10}%` }} /></div>
                    </div>
                    <div className="sub-item">
                      <span>Grammar: {feedback.grammar}</span>
                      <div className="mini-bar"><div className="fill" style={{ width: `${feedback.grammar * 10}%` }} /></div>
                    </div>
                  </div>

                  <div className="feedback-actions">
                    <button className="btn-refresh" onClick={() => { setFeedback(null); setWriting(""); setWordCount(0); setSelected(null); }}>
                      <RefreshCw size={14} /> Làm đề mới
                    </button>
                  </div>
                </div>
              ) : (
                <div className="feedback-empty">
                  <div className="empty-icon"></div>
                  <p>Sau khi nộp bài, kết quả chi tiết từ AI sẽ hiển thị tại đây.</p>
                </div>
              )}
            </div>

            {feedback && (
  <div className="card info-card animation-fade-in">
    <div className="card-header">
      <AlertCircle size={18} />
      <h3>Chi tiết nhận xét</h3>
    </div>
    <div className="feedback-text-area">
      {/* Overall */}
      {feedback.feedback?.overall && (
        <p className="text-sm text-gray-600 mb-2">
          <strong>Tổng quan:</strong> {feedback.feedback.overall}
        </p>
      )}

      {/* Task Response */}
      {feedback.feedback?.taskResponse && (
        <div className="mb-2">
          <strong>Task Response:</strong>
          <p>{feedback.feedback.taskResponse.comment}</p>
          {feedback.feedback.taskResponse.suggestions?.map((s, i) => (
            <p key={i} className="text-green-600">💡 {s}</p>
          ))}
        </div>
      )}

      {/* Coherence */}
      {feedback.feedback?.coherence && (
        <div className="mb-2">
          <strong>Coherence:</strong>
          <p>{feedback.feedback.coherence.comment}</p>
        </div>
      )}

      {/* Lexical - weakPhrases */}
      {feedback.feedback?.lexical?.weakPhrases?.length > 0 && (
        <div className="mb-2">
          <strong>Từ vựng cần cải thiện:</strong>
          {feedback.feedback.lexical.weakPhrases.map((p, i) => (
            <p key={i}>❌ <em>{p.original}</em> → ✅ <em>{p.suggestion}</em></p>
          ))}
        </div>
      )}

      {/* Grammar - errors */}
      {feedback.feedback?.grammar?.errors?.length > 0 && (
        <div className="mb-2">
          <strong>Lỗi ngữ pháp:</strong>
          {feedback.feedback.grammar.errors.map((e, i) => (
            <div key={i} className="mb-1">
              <p>❌ {e.original}</p>
              <p>✅ {e.correction}</p>
              <p className="text-gray-500 text-xs">{e.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
          </aside>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay animation-fade-in">
          <div className="modal-content animation-scale-up">
            <div className="modal-header">
              <h3>Gửi bài cho Giáo viên?</h3>
              <button className="close-x" onClick={() => setShowConfirm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Bài làm của bạn sẽ được gửi tới hệ thống quản lý của Giáo viên để nhận được những nhận xét chuyên sâu hơn.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-text" onClick={() => setShowConfirm(false)}>Hủy bỏ</button>
              <button className="btn-primary" onClick={() => handleFinalSubmit(true)}>
                Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingPractice;