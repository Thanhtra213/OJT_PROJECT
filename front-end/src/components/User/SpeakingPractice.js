import React, { useState, useRef, useEffect, useCallback } from "react";
import { generateSpeakingPrompt, submitSpeakingAnswer } from "../../middleware/speakingAPI";
import "./speakingpractice.scss";
import { useNavigate } from "react-router-dom";

const THINK_TIME = 2 * 60;   // 2 phút suy nghĩ
const SPEAK_TIME = 5 * 60;   // 5 phút nói

const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const SpeakingPractice = () => {
  const [prompt, setPrompt] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Timer states
  const [timerPhase, setTimerPhase] = useState(null); // null | "think" | "speak" | "done"
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingRef = useRef(false); // mirror of recording state for use inside timer
  const navigate = useNavigate();

  // ── Timer logic ──────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startSpeakPhase = useCallback(() => {
    setTimerPhase("speak");
    setTimeLeft(SPEAK_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerPhase("done");
          // Auto-stop recording if still active
          if (recordingRef.current && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            recordingRef.current = false;
            setRecording(false);
          }
          setMessage({ type: "error", text: "⏰ Hết giờ! Hãy nộp bài ngay." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startThinkPhase = useCallback(() => {
    setTimerPhase("think");
    setTimeLeft(THINK_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          startSpeakPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startSpeakPhase]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleGeneratePrompt = async () => {
    try {
      const data = await generateSpeakingPrompt();
      setPrompt(data);
      setResult(null);
      setAudioURL(null);
      setAudioBlob(null);
      // Reset & start think timer
      clearTimer();
      startThinkPhase();
    } catch {
      alert("Lỗi khi tạo đề. Vui lòng thử lại.");
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      recordingRef.current = true;

      // Move to speak phase when user starts recording if still in think phase
      if (timerPhase === "think") {
        clearTimer();
        startSpeakPhase();
      }
    } catch {
      alert("Không thể truy cập micro. Vui lòng cấp quyền.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      recordingRef.current = false;
    }
  };

  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      alert("Vui lòng chọn file âm thanh hợp lệ (.mp3, .wav, ...)");
      return;
    }
    const url = URL.createObjectURL(file);
    setAudioURL(url);
    setAudioBlob(file);
  };

  const handleFinalSubmit = async (sendToTeacher = false) => {
    if (!audioBlob || !prompt) return alert("Vui lòng ghi âm hoặc tải file trước khi nộp!");
    clearTimer();
    setLoading(true);
    setMessage({ type: "info", text: "📤 Đang xử lý bài nói, vui lòng đợi..." });
    try {
      const data = await submitSpeakingAnswer(audioBlob, prompt.promptId, sendToTeacher);
      setResult(data);
      setMessage({
        type: "success",
        text: sendToTeacher
          ? "✅ Bài nói đã được gửi cho giáo viên và AI đã chấm điểm xong!"
          : "✅ AI đã chấm điểm bài nói của bạn!"
      });
    } catch {
      setMessage({ type: "error", text: "❌ Gửi bài thất bại. Hãy thử lại." });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => navigate("/home");

  // ── Timer display helpers ─────────────────────────────────────────────────
  const timerColor = timerPhase === "think"
    ? (timeLeft < 30 ? "#ef4444" : "#f59e0b")
    : timerPhase === "speak"
    ? (timeLeft < 60 ? "#ef4444" : "#10b981")
    : "#9ca3af";

  const timerLabel = timerPhase === "think"
    ? "🤔 Thời gian suy nghĩ"
    : timerPhase === "speak"
    ? "🎙️ Thời gian nói"
    : timerPhase === "done"
    ? "⏰ Hết giờ"
    : null;

  return (
    <div className="speaking-page-outer-container">
      <div className="speaking-page-content-wrapper">
        <div className="speaking-main-content">
          <div className="speaking-header-section">
            <div className="speaking-title-group">
              <div>
                <h1 className="speaking-title">Luyện Speaking AI</h1>
                <p className="speaking-subtitle">Luyện tập và nhận feedback chi tiết từ AI</p>
              </div>
            </div>
            <button className="speaking-close-btn" onClick={handleClose}>✕</button>
          </div>

          <div className="prompt-section">
            <div className="prompt-header">
              <h3 className="prompt-title-icon">Đề bài luyện tập</h3>
              <button onClick={handleGeneratePrompt} disabled={loading} className="generate-prompt-btn">
                Tạo đề mới
              </button>
            </div>
            {prompt ? (
              <div className="prompt-card">
                <h3 className="prompt-card-title">{prompt.title}</h3>
                <p className="prompt-card-content">{prompt.content}</p>
              </div>
            ) : (
              <p className="no-prompt-message">Nhấn "Tạo đề mới" để bắt đầu luyện nói</p>
            )}
          </div>

          {/* ── Timer Display ─────────────────────────────────────────────── */}
          {timerPhase && (
            <div className="speaking-timer-box" style={{ borderColor: timerColor }}>
              <div className="speaking-timer-label">{timerLabel}</div>
              <div className="speaking-timer-display" style={{ color: timerColor }}>
                {timerPhase === "done" ? "00:00" : formatTime(timeLeft)}
              </div>
              {timerPhase === "think" && (
                <div className="speaking-timer-hint">Hãy đọc đề và chuẩn bị ý tưởng</div>
              )}
              {timerPhase === "speak" && (
                <div className="speaking-timer-hint">Ghi âm câu trả lời của bạn ngay!</div>
              )}
              {timerPhase === "done" && (
                <div className="speaking-timer-hint" style={{ color: "#ef4444" }}>
                  Đã hết thời gian! Hãy dừng ghi âm và nộp bài.
                </div>
              )}
            </div>
          )}

          {prompt && (
            <div className="record-section">
              <h3 className="record-section-title">Ghi âm hoặc tải file</h3>
              <div className="record-controls">
                {!recording ? (
                  <button
                    onClick={handleStartRecording}
                    className="record-btn start-record-btn"
                    disabled={timerPhase === "done"}
                  >
                    Bắt đầu ghi âm
                  </button>
                ) : (
                  <button onClick={handleStopRecording} className="record-btn stop-record-btn">
                    Dừng ghi âm
                  </button>
                )}
                <label className="upload-btn">
                  Tải file lên
                  <input type="file" accept="audio/*" onChange={handleUploadFile} style={{ display: "none" }} />
                </label>
                {audioURL && <audio controls src={audioURL} className="audio-player" />}
              </div>

              <div className="speaking-submit-actions">
                <button
                  onClick={() => handleFinalSubmit(false)}
                  disabled={!audioBlob || loading}
                  className="submit-btn ai-btn"
                >
                  {loading ? "Đang chấm..." : "Chấm điểm AI"}
                </button>

                {result && (
                  <button
                    onClick={() => handleFinalSubmit(true)}
                    disabled={loading}
                    className="submit-btn teacher-btn"
                  >
                    Gửi cho giáo viên
                  </button>
                )}
              </div>

              {message && (
                <div className={`speaking-alert ${message.type}`}>
                  {message.text}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="result-section">
              <h3 className="result-section-title">Kết quả chấm điểm</h3>
              <p className="result-transcript"><strong>Transcript:</strong> {result.transcript}</p>
              <div className="result-scores">
                <p>Fluency: <strong className="score-value">{result.fluency}</strong></p>
                <p>Grammar: <strong className="score-value">{result.grammar}</strong></p>
                <p>Pronunciation: <strong className="score-value">{result.pronunciation}</strong></p>
                <p>Vocabulary: <strong className="score-value">{result.lexicalResource}</strong></p>
                <p className="total-score-line">Tổng điểm: <span className="total-score-value">{result.score}</span></p>
              </div>
              <p className="result-feedback">Feedback: {result.feedback}</p>
            </div>
          )}
        </div>

        <div className="speaking-sidebar">
          <h3 className="sidebar-title">Tips hữu ích</h3>
          <ul className="tips-list">
            {[
              "Nói chậm rãi và rõ ràng",
              "Sử dụng ngôn ngữ cơ thể tự nhiên",
              "Mỉm cười khi nói",
              "Chuẩn bị ý tưởng trước khi nói",
              "Sử dụng từ vựng đa dạng",
              "Luyện tập phát âm mỗi ngày"
            ].map((tip, index) => (
              <li key={index} className="tip-item"><span className="tip-bullet">•</span> {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;