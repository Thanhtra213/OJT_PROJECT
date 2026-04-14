import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Spinner, Form, Alert, Container, Badge, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckCircle, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { getQuizById, startQuiz, submitQuiz } from "../../middleware/QuizAPI";
import "./StartQuiz.scss";

const StartQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [groups, setGroups] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [timeLeft, setTimeLeft] = useState(null);
  const hasFetched = useRef(false);
  const timerRef = useRef(null);

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 5000);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderAsset = (asset, idx) => {
    if (!asset) return null;
    const style = { maxWidth: "100%", marginBottom: "10px", borderRadius: "8px" };

    switch (asset.assetType) {
      case 1:
        return (
          <div key={idx} className="mb-2">
            <audio controls src={asset.url} style={style} className="w-100" />
            {asset.caption && <small className="text-muted d-block mt-1">{asset.caption}</small>}
          </div>
        );
      case 2:
        return (
          <div key={idx} className="mb-2">
            <img src={asset.url} alt={asset.caption || "Image"} style={style} className="img-fluid" />
            {asset.caption && <small className="text-muted d-block mt-1">{asset.caption}</small>}
          </div>
        );
      case 3:
        return (
          <div key={idx} className="mb-3 p-3 bg-light rounded">
            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{asset.contentText}</p>
          </div>
        );
      case 5:
        return (
          <div key={idx} className="mb-2">
            <video controls src={asset.url} style={style} className="w-100" />
            {asset.caption && <small className="text-muted d-block mt-1">{asset.caption}</small>}
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const data = await getQuizById(quizId);
        let parsedGroups = [];

        if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
          parsedGroups = data.groups.map(group => ({
            groupOrder: group.groupOrder || 1,
            instruction: group.instruction || "",
            assets: group.assets || [],
            questions: (group.questions || []).map(q => ({
              ...q,
              questionID: q.questionID || q.id,
              options: (q.options || []).map(opt => ({
                ...opt,
                optionID: opt.optionID || opt.id
              }))
            }))
          }));
        }

        if (parsedGroups.length === 0 && data.questions && data.questions.length > 0) {
          parsedGroups = [{
            groupOrder: 1,
            instruction: "Trả lời các câu hỏi sau",
            assets: [],
            questions: data.questions.map(q => ({
              ...q,
              questionID: q.questionID || q.id,
              options: (q.options || []).map(opt => ({
                ...opt,
                optionID: opt.optionID || opt.id
              }))
            }))
          }];
        }

        setQuiz(data);
        setGroups(parsedGroups);
        
        if (data.duration && data.duration > 0) {
          setTimeLeft(data.duration * 60);
        }

        const attempt = await startQuiz(quizId);
        setAttemptId(attempt?.attemptId || attempt?.attemptID || attempt);
        showToast("Quiz đã sẵn sàng! Hãy bắt đầu làm bài.", "success");
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Không thể tải quiz. Vui lòng thử lại sau!";
        setError(errorMsg);
        showToast(errorMsg, "error");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null || submitted || submitting) return;
    
    if (timeLeft <= 0) {
      showToast("Hết thời gian gian làm bài. Đang nộp bài tự động...", "warning");
      handleSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted, submitting]);

  const handleAnswerChange = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      showToast("Không tìm thấy attempt ID, vui lòng tải lại trang!", "error");
      return;
    }

    const allQuestions = groups.flatMap(g => g.questions);
    const unanswered = allQuestions.filter(q => !answers[q.questionID]);

    if (unanswered.length > 0 && timeLeft > 0) {
      const confirmSubmit = window.confirm(`Bạn còn ${unanswered.length} câu chưa trả lời. Bạn có muốn nộp bài không?`);
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      const formatted = Object.entries(answers).map(([q, o]) => ({
        QuestionID: Number(q),
        OptionID: Number(o)
      }));
      const result = await submitQuiz(attemptId, formatted);
      const finalScore = result.totalScore ?? result.autoScore ?? 0;
      setScore(finalScore);
      setSubmitted(true);
      showToast(`Chúc mừng! Bạn đạt ${finalScore} điểm.`, "success");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Gửi bài thất bại.";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => window.location.reload();
  const handleBackToList = () => navigate(-1);
  const getTotalQuestions = () => groups.reduce((sum, g) => sum + (g.questions?.length || 0), 0);

  if (loading)
    return (
      <Container className="loading-container">
        <Spinner animation="border" className="spinner-border" />
        <p>Đang tải dữ liệu bài làm...</p>
      </Container>
    );

  if (!quiz && error)
    return (
      <Container className="py-5 text-center">
        <button onClick={() => navigate("/")} className="mint-back-btn mb-4">
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách quiz
        </button>
        <Alert variant="danger" className="mt-3 d-inline-block">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      </Container>
    );

  return (
    <div className="start-quiz-page">
      <Container>
        {toast.show && (
          <div className="toast-notification position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 9999 }}>
            <Alert
              variant={toast.type === "success" ? "success" : "danger"}
              dismissible
              onClose={() => setToast({ show: false, message: "", type: "" })}
            >
              <strong>{toast.type === "success" ? "✅ Thành công" : "❌ Lỗi"}</strong>
              <p className="mb-0 mt-1">{toast.message}</p>
            </Alert>
          </div>
        )}

        {/* Top Sticky Bar */}
        <div className="quiz-top-bar">
          <Container className="top-bar-inner">
            <button onClick={handleBackToList} className="mint-back-btn">
              <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
            </button>
            
            {timeLeft !== null && !submitted && (
              <div className={`quiz-timer ${timeLeft <= 60 ? 'text-danger border-danger' : ''}`}>
                <FontAwesomeIcon icon={faClock} /> {formatTime(timeLeft)}
              </div>
            )}
          </Container>
        </div>

        <div className="quiz-header text-center">
          <h1 className="quiz-title">{quiz.title || "Quiz không có tiêu đề"}</h1>
          {quiz.description && <p className="quiz-description">{quiz.description}</p>}
          <div className="mt-3">
            <Badge bg="info" className="me-2">{groups.length} phần</Badge>
            <Badge bg="secondary">{getTotalQuestions()} câu hỏi</Badge>
          </div>
        </div>

        {groups.length > 0 ? (
          groups.map((group, groupIdx) => (
            <div key={groupIdx} className="quiz-group-box">
              <Row>
                {/* CỘT TRÁI - HƯỚNG DẪN VÀ TÀI LIỆU */}
                <Col md={5} className="group-instruction">
                  <h5 className="mb-3">
                    Phần {groupIdx + 1}
                    <Badge bg="light" text="dark" className="ms-2 shadow-sm border">
                      {group.questions.length} câu
                    </Badge>
                  </h5>
                  {group.instruction && (
                    <div className="instruction-text">
                      <strong className="text-primary d-block mb-2">📌 Hướng dẫn:</strong>
                      {group.instruction}
                    </div>
                  )}
                  {group.assets?.length > 0 &&
                    group.assets.map((asset, idx) => renderAsset(asset, idx))}
                </Col>

                {/* CỘT PHẢI - DANH SÁCH CÂU HỎI */}
                <Col md={7}>
                  <div className="questions-container pe-2">
                    {group.questions?.map((question, qIdx) => {
                      const qid = question.questionID;
                      return (
                        <div key={qid} className="question-card">
                          <div className="d-flex align-items-center mb-3">
                            <Badge bg="primary" className="me-2 px-3 py-2 rounded-pill">Câu {qIdx + 1}</Badge>
                          </div>
                          <div className="question-statement">{question.content}</div>
                          {question.assets?.length > 0 &&
                            question.assets.map((asset, idx) => renderAsset(asset, idx))}
                            
                          <div className="options-grid mt-3">
                            {question.options?.length > 0 ? (
                              question.options.map((opt, idx) => {
                                const isSelected = answers[qid] === opt.optionID;
                                return (
                                  <div 
                                    key={opt.optionID} 
                                    className={`option-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                      if (!submitted) handleAnswerChange(qid, opt.optionID);
                                    }}
                                  >
                                    <div className="option-letter">{String.fromCharCode(65 + idx)}</div>
                                    <div className="option-text">{opt.content}</div>
                                  </div>
                                );
                              })
                            ) : (
                              <Alert variant="warning">⚠ Không có lựa chọn nào cho câu hỏi này.</Alert>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Col>
              </Row>
            </div>
          ))
        ) : (
          <Alert variant="warning" className="mt-4 text-center py-4 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3 text-warning" />
            <h5>Quiz này chưa có nội dung</h5>
          </Alert>
        )}

        {!submitted ? (
          <div className="submit-area mt-4 mb-5 mx-auto" style={{ maxWidth: '600px' }}>
            <h4 className="fw-bold mb-3 text-dark">Bạn đã hoàn thành bài?</h4>
            <button
              onClick={handleSubmit}
              className="btn-submit-quiz w-100"
              disabled={submitting || getTotalQuestions() === 0}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Đang chấm điểm...
                </>
              ) : (
                <>
                  Nộp Bài Ngay
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="result-card mx-auto mt-5 mb-5" style={{ maxWidth: '600px' }}>
            <h3>Kết quả siêu phàm của bạn!</h3>
            <div className="score-circle">
              {score}
            </div>
            <div className="d-flex justify-content-center gap-3">
              <Button variant="outline-success" onClick={handleRetry} style={{ borderRadius: '100px', fontWeight: '800' }}>
                Làm Lại Quiz
              </Button>
              <Button variant="success" onClick={handleBackToList} style={{ borderRadius: '100px', fontWeight: '800' }}>
                Quay Về Danh Sách
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default StartQuiz;