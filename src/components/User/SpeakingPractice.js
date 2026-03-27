import React, { useState, useRef } from "react";
import { generateSpeakingPrompt, submitSpeakingAnswer } from "../../middleware/speakingAPI";
import "./speakingpractice.scss"; // This is where your styles will be
import { useNavigate } from "react-router-dom";

const SpeakingPractice = () => {
  const [prompt, setPrompt] = useState(null);
  const [recording, setRecording] = useState(false);
const [audioURL, setAudioURL] = useState(null);
const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  // 🧠 Lấy đề từ AI
  const handleGeneratePrompt = async () => {
    try {
      const data = await generateSpeakingPrompt();
      setPrompt(data);
      setResult(null);
      setAudioURL(null);
      setAudioBlob(null);
    } catch {
      alert("Lỗi khi tạo đề. Vui lòng thử lại.");
    }
  };

  // 🎙️ Bắt đầu ghi âm
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

  // ⏹️ Dừng ghi âm
  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // 📁 Upload file ghi âm (nếu người học đã có sẵn)
  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng
    if (!file.type.startsWith("audio/")) {
      alert("Vui lòng chọn file âm thanh hợp lệ (.mp3, .wav, ...)");
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioURL(url);
    setAudioBlob(file);
  };

  // 📤 Gửi file để chấm điểm
  const handleSubmit = async () => {
    if (!audioBlob || !prompt) return alert("Vui lòng ghi âm hoặc tải file trước khi nộp!");

    setLoading(true);
    try {
      const data = await submitSpeakingAnswer(audioBlob, prompt.content);
      setResult(data);
    } catch {
      alert("Lỗi khi nộp bài. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
const handleClose = () => {
    navigate("/home");
  };
  return (
    <div className="speaking-page-outer-container">

      <div className="speaking-page-content-wrapper">
        {/* Main Content Area */}
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

          {/* Đề bài */}
          <div className="prompt-section">
            <div className="prompt-header">
              <h3 className="prompt-title-icon">Đề bài luyện tập</h3>
              <button onClick={handleGeneratePrompt} disabled={loading} className="generate-prompt-btn">
                Tạo đề mới
              </button>
            </div>

            {prompt ? (
              <div className="prompt-card">
                {/* tags removed */}
                <h3 className="prompt-card-title">{prompt.title}</h3>
                <p className="prompt-card-content">{prompt.content}</p>
              </div>
            ) : (
              <p className="no-prompt-message">Nhấn “Tạo đề mới” để bắt đầu luyện nói</p>
            )}
          </div>

          {/* Ghi âm + Upload */}
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

                {/* 📁 Nút tải file lên */}
                <label className="upload-btn">
                  Tải file lên
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleUploadFile}
                    style={{ display: "none" }}
                  />
                </label>

                {audioURL && (
                  <audio controls src={audioURL} className="audio-player"></audio>
                )}
              </div>

              <button onClick={handleSubmit} disabled={!audioBlob || loading} className="submit-btn">
                {loading ? "Đang chấm..." : "Nộp bài"}
              </button>
            </div>
          )}

          {/* Kết quả - Appears only after submission */}
          {result && (
            <div className="result-section">
              <h3 className="result-section-title">Kết quả chấm điểm</h3>
              <p className="result-transcript">
                <strong>Transcript:</strong> {result.transcript}
              </p>
              <div className="result-scores">
                <p>Fluency: <strong className="score-value">{result.fluency}</strong></p>
                <p>Grammar: <strong className="score-value">{result.grammar}</strong></p>
                <p>Pronunciation: <strong className="score-value">{result.pronunciation}</strong></p>
                <p>Vocabulary: <strong className="score-value">{result.lexicalResource}</strong></p>
                <p className="total-score-line">
                    Tổng điểm: <span className="total-score-value">{result.score}</span>
                </p>
              </div>
              <p className="result-feedback">
                Feedback: {result.feedback}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Tips */}
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
              <li key={index} className="tip-item">
                <span className="tip-bullet">•</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;