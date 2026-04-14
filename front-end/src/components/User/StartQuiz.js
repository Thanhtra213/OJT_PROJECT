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
  const hasFetched = useRef(false);

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 5000);
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

    if (unanswered.length > 0) {
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
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Đang tải quiz...</p>
      </Container>
    );

  if (!quiz && error)
    return (
      <Container>
        <Button variant="link" onClick={() => navigate("/")} className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách quiz
        </Button>
        <Alert variant="danger" className="mt-3">
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

        <button className="back-btn" onClick={handleBackToList}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại bài trước
        </button>

        <div className="quiz-header">
          <h1 className="quiz-title">{quiz.title || "Quiz không có tiêu đề"}</h1>
          {quiz.description && <p className="quiz-description">{quiz.description}</p>}
          <span className="badge bg-info text-dark me-2">{groups.length} phần</span>
          <span className="badge bg-secondary">{getTotalQuestions()} câu hỏi</span>
        </div>

        {groups.length > 0 ? (
          groups.map((group, groupIdx) => {
            const hasLeftCol = group.instruction || (group.assets && group.assets.length > 0);
            return (
              <div key={groupIdx} className="quiz-group-box">
                <Row className="g-0 h-100">
                  {/* LEFT COLUMN: Instruction & Assets */}
                  {hasLeftCol && (
                    <Col md={5} className="qg-left">
                      <div className="instruction-title">
                        <span>Phần {groupIdx + 1}</span>
                        <Badge bg="light" text="dark" style={{fontWeight: 800, border: '1px solid #e5e7eb'}}>
                          {group.questions?.length || 0} câu
                        </Badge>
                      </div>
                      {group.instruction && <p className="instruction-text">{group.instruction}</p>}
                      {group.assets?.length > 0 &&
                        group.assets.map((asset, idx) => (
                          <div className="asset-box" key={idx}>{renderAsset(asset, idx)}</div>
                        ))}
                    </Col>
                  )}

                  {/* RIGHT COLUMN: Questions List */}
                  <Col md={hasLeftCol ? 7 : 12} className="qg-right">
                    {group.questions?.map((question, qIdx) => {
                      const qid = question.questionID;
                      return (
                        <div key={qid} className="question-block">
                          <div className="q-title">
                            <span className="q-num">Câu {qIdx + 1}</span>
                            <span>{question.content}</span>
                          </div>
                          
                          {question.assets?.length > 0 &&
                            question.assets.map((asset, idx) => (
                              <div className="asset-box" key={`qasset-${idx}`}>{renderAsset(asset, idx)}</div>
                            ))}

                          <div className="options-grid">
                            {question.options?.length > 0 ? (
                              question.options.map((opt, idx) => {
                                const isSelected = answers[qid] === opt.optionID;
                                return (
                                  <div 
                                    key={opt.optionID}
                                    className={`option-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => !submitted && handleAnswerChange(qid, opt.optionID)}
                                    style={{ opacity: submitted && !isSelected ? 0.6 : 1 }}
                                  >
                                    <div className="opt-letter">{String.fromCharCode(65 + idx)}</div>
                                    <div className="opt-text">{opt.content}</div>
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
                  </Col>
                </Row>
              </div>
            );
          })
        ) : (
          <Alert variant="warning" className="mt-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Quiz này chưa có câu hỏi nào.
          </Alert>
        )}

        {!submitted ? (
          <div className="action-buttons">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={submitting || getTotalQuestions() === 0}
            >
              {submitting ? (
                <><Spinner animation="border" size="sm" /> Đang nộp bài...</>
              ) : (
                <><FontAwesomeIcon icon={faCheckCircle} /> Nộp bài hoàn tất</>
              )}
            </button>
          </div>
        ) : (
          <div className="results-section">
            <div className="icon-wrapper">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3>Kết quả bài làm</h3>
            <div className="score-highlight">{score} <span style={{fontSize: '1.5rem', color: '#9ca3af'}}>/100</span></div>
            <p className="text-muted mb-4">Điểm số của bạn đã được ghi nhận vào hệ thống một cách an toàn.</p>
            <div className="result-actions">
              <button className="btn-outline" onClick={handleRetry}>Làm lại</button>
              <button className="btn-primary" onClick={handleBackToList}>Tiếp tục hành trình</button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default StartQuiz;