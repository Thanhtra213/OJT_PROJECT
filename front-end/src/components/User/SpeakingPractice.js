import React, { useState, useRef } from "react";
import { generateSpeakingPrompt, submitSpeakingAnswer } from "../../middleware/speakingAPI";
import "./speakingpractice.scss";
import { useNavigate } from "react-router-dom";

const SpeakingPractice = () => {
  const [prompt, setPrompt] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  const handleGeneratePrompt = async () => {
    try {
      const data = await generateSpeakingPrompt();
      setPrompt(data);
      setResult(null);
      setAudioURL(null);
      setAudioBlob(null);
       console.log("PROMPT DATA:", data);
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
    } catch {
      alert("Không thể truy cập micro. Vui lòng cấp quyền.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
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

  const handleSubmitClick = () => {
    if (!audioBlob || !prompt) return alert("Vui lòng ghi âm hoặc tải file trước khi nộp!");
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async (sendToTeacher) => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const data = await submitSpeakingAnswer(audioBlob, prompt.promptId, sendToTeacher);
      setResult(data);
    } catch {
      alert("Lỗi khi nộp bài. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => navigate("/home");

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

          {prompt && (
            <div className="record-section">
              <h3 className="record-section-title">Ghi âm hoặc tải file</h3>
              <div className="record-controls">
                {!recording ? (
                  <button onClick={handleStartRecording} className="record-btn start-record-btn">
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
              <button onClick={handleSubmitClick} disabled={!audioBlob || loading} className="submit-btn">
                {loading ? "Đang chấm..." : "Nộp bài"}
              </button>
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

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Send To Teacher?</h3>
            <p>Bạn có muốn gửi bài nộp này cho giáo viên để nhận thêm nhận xét không?</p>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-yes" onClick={() => handleConfirmSubmit(true)}>
                Yes
              </button>
              <button className="confirm-btn confirm-no" onClick={() => handleConfirmSubmit(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingPractice;