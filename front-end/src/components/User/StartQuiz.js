import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Alert, Container, Badge, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckCircle, faExclamationTriangle, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import { getQuizById, startQuiz, submitQuiz } from "../../middleware/QuizAPI";
import { getPlacementTests, getPlacementRecommendation } from "../../middleware/placementTestAPI";
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
  const [results, setResults] = useState([]);   // ← kết quả từng câu
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Placement test
  const [isPlacementTest, setIsPlacementTest] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRecommend, setLoadingRecommend] = useState(false);

  const hasFetched = useRef(false);

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 5000);
  };

  const renderAsset = (asset, idx) => {
    if (!asset) return null;
    const style = { maxWidth: "100%", marginBottom: "10px", borderRadius: "8px" };
    switch (asset.assetType) {
      case 1: return (
        <div key={idx} className="mb-2">
          <audio controls src={asset.url} style={style} className="w-100" />
          {asset.caption && <small className="text-muted d-block mt-1">{asset.caption}</small>}
        </div>
      );
      case 2: return (
        <div key={idx} className="mb-2">
          <img src={asset.url} alt={asset.caption || "Image"} style={style} className="img-fluid" />
          {asset.caption && <small className="text-muted d-block mt-1">{asset.caption}</small>}
        </div>
      );
      case 3: return (
        <div key={idx} className="mb-3 p-3 bg-light rounded">
          <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{asset.contentText}</p>
        </div>
      );
      case 5: return (
        <div key={idx} className="mb-2">
          <video controls src={asset.url} style={style} className="w-100" />
          {asset.caption && <small className="text-muted d-block mt-1">{asset.caption}</small>}
        </div>
      );
      default: return null;
    }
  };

  // ── Load quiz ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      try {
        // Kiểm tra có phải placement test không
        const placementList = await getPlacementTests().catch(() => []);
        const isPlacement = Array.isArray(placementList) &&
          placementList.some(p => String(p.quizID) === String(quizId));
        setIsPlacementTest(isPlacement);

        const data = await getQuizById(quizId);
        let parsedGroups = [];

        if (data.groups?.length > 0) {
          parsedGroups = data.groups.map(group => ({
            groupOrder: group.groupOrder || 1,
            instruction: group.instruction || "",
            assets: group.assets || [],
            questions: (group.questions || []).map(q => ({
              ...q,
              questionID: q.questionID || q.id,
              options: (q.options || []).map(opt => ({ ...opt, optionID: opt.optionID || opt.id }))
            }))
          }));
        }

        if (parsedGroups.length === 0 && data.questions?.length > 0) {
          parsedGroups = [{
            groupOrder: 1,
            instruction: "Trả lời các câu hỏi sau",
            assets: [],
            questions: data.questions.map(q => ({
              ...q,
              questionID: q.questionID || q.id,
              options: (q.options || []).map(opt => ({ ...opt, optionID: opt.optionID || opt.id }))
            }))
          }];
        }

        setQuiz(data);
        setGroups(parsedGroups);

        const attempt = await startQuiz(quizId);
        setAttemptId(attempt?.attemptId || attempt?.attemptID || attempt);
        showToast("Quiz đã sẵn sàng! Hãy bắt đầu làm bài.", "success");
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Không thể tải quiz.";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchQuiz();
  }, [quizId]);

  // ── Answer change ──────────────────────────────────────────────────────────
  const handleAnswerChange = (questionId, optionId) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      showToast("Không tìm thấy attempt ID!", "error");
      return;
    }

    const allQuestions = groups.flatMap(g => g.questions);
    const unanswered = allQuestions.filter(q => !answers[q.questionID]);

    if (unanswered.length > 0) {
      const ok = window.confirm(`Bạn còn ${unanswered.length} câu chưa trả lời. Vẫn nộp bài?`);
      if (!ok) return;
    }

    try {
      setSubmitting(true);

      // ✅ FIX: support cả trắc nghiệm + tự luận
      const formatted = Object.entries(answers).map(([q, val]) => {
        if (typeof val === "number") {
          return {
            QuestionID: Number(q),
            OptionID: val
          };
        } else {
          return {
            QuestionID: Number(q),
            AnswerText: val
          };
        }
      });

      const result = await submitQuiz(attemptId, formatted);

      const finalScore = result.totalScore ?? result.autoScore ?? 0;

      setScore(finalScore);
      setResults(Array.isArray(result.results) ? result.results : []);
      setSubmitted(true);

      showToast(`Đã nộp bài! Bạn đạt ${finalScore} điểm.`, "success");

    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Gửi bài thất bại.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => window.location.reload();
  const handleBackToList = () => navigate(-1);
  const getTotalQuestions = () => groups.reduce((s, g) => s + (g.questions?.length || 0), 0);

  const getQuestionResult = (questionID) =>
    results.find(r => r.questionId === questionID || r.questionID === questionID);


  const getOptionState = (questionID, optionID) => {
    if (!submitted) return null;
    const res = getQuestionResult(questionID);
    if (!res) return null;

    const isSelected = answers[questionID] === optionID;
    const isCorrectOption = res.correctOptions?.some(
      o => o.optionId === optionID || o.OptionId === optionID
    );

    if (isSelected && res.isCorrect) return 'correct';       // chọn đúng
    if (isSelected && !res.isCorrect) return 'wrong';         // chọn sai
    if (!isSelected && isCorrectOption) return 'correct-answer'; // đây là đáp án đúng
    return null;
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" /><p className="mt-3">Đang tải quiz...</p>
    </Container>
  );
  if (!quiz && error) return (
    <Container>
      <button className="back-btn" onClick={() => navigate("/")}>
        <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
      </button>
      <Alert variant="danger" className="mt-3">
        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}
      </Alert>
    </Container>
  );

  // ── Filter groups có câu hỏi ───────────────────────────────────────────────
  const visibleGroups = groups.filter(g => g.questions?.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="start-quiz-page">
      <Container>

        {/* Toast */}
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

        {/* Header */}
        <div className="quiz-header">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <h1 className="quiz-title mb-0">{quiz.title || "Quiz không có tiêu đề"}</h1>
            {isPlacementTest && (
              <span className="placement-badge">📋 Placement Test</span>
            )}
          </div>
          {quiz.description && <p className="quiz-description">{quiz.description}</p>}
          <span className="badge bg-info text-dark me-2">{visibleGroups.length} phần</span>
          <span className="badge bg-secondary">{getTotalQuestions()} câu hỏi</span>
        </div>

        {/* Groups */}
        {visibleGroups.length > 0 ? (
          visibleGroups.map((group, groupIdx) => {
            const hasLeftCol = group.instruction || group.assets?.length > 0;
            return (
              <div key={groupIdx} className="quiz-group-box">
                <Row className="g-0 h-100">

                  {/* LEFT: Instruction & Assets */}
                  {hasLeftCol && (
                    <Col md={5} className="qg-left">
                      <div className="instruction-title">
                        <span>Phần {groupIdx + 1}</span>
                        <Badge bg="light" text="dark" style={{ fontWeight: 800, border: '1px solid #e5e7eb' }}>
                          {group.questions?.length || 0} câu
                        </Badge>
                      </div>
                      {group.instruction && <p className="instruction-text">{group.instruction}</p>}
                      {group.assets?.map((asset, idx) => (
                        <div className="asset-box" key={idx}>{renderAsset(asset, idx)}</div>
                      ))}
                    </Col>
                  )}

                  {/* RIGHT: Questions */}
                  <Col md={hasLeftCol ? 7 : 12} className="qg-right">
                    {group.questions?.map((question, qIdx) => {
                      const qid = question.questionID;
                      const qResult = submitted ? getQuestionResult(qid) : null;

                      return (
                        <div
                          key={qid}
                          className={`question-block ${submitted
                              ? qResult?.isCorrect === true ? 'q-correct'
                                : qResult?.isCorrect === false ? 'q-wrong'
                                  : ''
                              : ''
                            }`}
                        >
                          {/* Question title + result badge */}
                          <div className="q-title">
                            <span className="q-num">Câu {qIdx + 1}</span>
                            <span>{question.content}</span>
                            {submitted && qResult && (
  qResult.isCorrect === null ? (
    <span className="q-result-badge badge-pending">
      Chờ chấm
    </span>
  ) : (
    <span className={`q-result-badge ${qResult.isCorrect ? 'badge-correct' : 'badge-wrong'}`}>
      <FontAwesomeIcon icon={qResult.isCorrect ? faCheck : faTimes} />
      {qResult.isCorrect ? ' Đúng' : ' Sai'}
    </span>
  )
)}
                          </div>

                          {/* Question assets */}
                          {question.assets?.map((asset, idx) => (
                            <div className="asset-box" key={`qa-${idx}`}>{renderAsset(asset, idx)}</div>
                          ))}

                          {/* Options */}
                          <div className="options-grid">
                            {question.options?.length > 0 ? (
                              // ================= TRẮC NGHIỆM =================
                              question.options.map((opt, idx) => {
                                const state = getOptionState(qid, opt.optionID);

                                return (
                                  <div
                                    key={opt.optionID}
                                    className={`option-card
            ${answers[qid] === opt.optionID && !submitted ? 'selected' : ''}
            ${state === 'correct' ? 'opt-correct' : ''}
            ${state === 'wrong' ? 'opt-wrong' : ''}
            ${state === 'correct-answer' ? 'opt-correct-answer' : ''}
          `}
                                    onClick={() => handleAnswerChange(qid, opt.optionID)}
                                    style={{ cursor: submitted ? 'default' : 'pointer' }}
                                  >
                                    <div className="opt-letter">
                                      {submitted && state === 'correct' && <FontAwesomeIcon icon={faCheck} />}
                                      {submitted && state === 'wrong' && <FontAwesomeIcon icon={faTimes} />}
                                      {submitted && state === 'correct-answer' && <FontAwesomeIcon icon={faCheck} />}
                                      {(!submitted || !state) && String.fromCharCode(65 + idx)}
                                    </div>

                                    <div className="opt-text">{opt.content}</div>
                                  </div>
                                );
                              })
                            ) : (
                              // ================= TỰ LUẬN =================
                              <div className="essay-wrapper">
                                <textarea
                                  className="essay-input"
                                  placeholder="Nhập câu trả lời của bạn..."
                                  value={answers[qid] || ""}
                                  onChange={(e) =>
                                    setAnswers(prev => ({
                                      ...prev,
                                      [qid]: e.target.value
                                    }))
                                  }
                                  disabled={submitted}
                                />

                                {/* Hiển thị sau khi submit */}
                                {submitted && (
                                  <div className="essay-result">
                                   Câu trả lời của bạn: <strong>{answers[qid] || "(trống)"}</strong>
                                  </div>
                                )}

                                {/* Nếu có đáp án đúng */}
                                {submitted && qResult?.correctAnswerText && (
                                  <div className="correct-answer-hint">
                                    Đáp án mẫu: <strong>{qResult.correctAnswerText}</strong>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Hint: đáp án đúng khi sai (text) */}
                          {submitted && qResult?.isCorrect === false && qResult?.correctAnswerText && (
                            <div className="correct-answer-hint">
                              Đáp án đúng: <strong>{qResult.correctAnswerText}</strong>
                            </div>
                          )}
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

        {/* Submit / Results */}
        {!submitted ? (
          <div className="action-buttons">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={submitting || getTotalQuestions() === 0}
            >
              {submitting
                ? <><Spinner animation="border" size="sm" /> Đang nộp bài...</>
                : <><FontAwesomeIcon icon={faCheckCircle} /> Nộp bài hoàn tất</>
              }
            </button>
          </div>
        ) : (
          <div className="results-section">
            <div className="icon-wrapper">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3>Kết quả bài làm</h3>
            <div className="score-highlight">
              {score}
              <span style={{ fontSize: '1.5rem', color: '#9ca3af' }}>/100</span>
            </div>

            {/* Score breakdown */}
            <div className="score-breakdown">
              <span className="breakdown-item correct">
                <FontAwesomeIcon icon={faCheck} /> {results.filter(r => r.isCorrect === true).length} đúng
              </span>
              <span className="breakdown-item wrong">
                <FontAwesomeIcon icon={faTimes} /> {results.filter(r => r.isCorrect === false).length} sai
              </span>
              {results.filter(r => r.isCorrect === null).length > 0 && (
                <span className="breakdown-item essay">
                  ✍ {results.filter(r => r.isCorrect === null).length} tự luận
                </span>
              )}
            </div>

            <p className="text-muted mb-4">Điểm số của bạn đã được ghi nhận.</p>

            {/* ── Placement Test Recommendation ── */}
            {isPlacementTest && (
              <div className="placement-result">
                {loadingRecommend ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" style={{ color: '#00c896' }} />
                    <span className="ms-2" style={{ color: '#6b7280', fontWeight: 600 }}>Đang phân tích kết quả...</span>
                  </div>
                ) : recommendation ? (
                  <>
                    <div className="placement-level">
                      <span className="level-label">Trình độ của bạn</span>
                      <span className="level-name">{recommendation.levelName}</span>
                      <span className="level-score">Điểm: {recommendation.score}/100</span>
                    </div>

                    {recommendation.recommendedCourses?.length > 0 && (
                      <div className="recommended-courses">
                        <h5 className="recommended-title">📚 Khóa học phù hợp với bạn</h5>
                        <div className="course-cards">
                          {recommendation.recommendedCourses.map(course => (
                            <div
                              key={course.courseID}
                              className="rec-course-card"
                              onClick={() => navigate(`/course/${course.courseID}`)}
                            >
                              <div className="rec-course-name">{course.courseName}</div>
                              {course.description && (
                                <div className="rec-course-desc">{course.description}</div>
                              )}
                              <span className="rec-course-btn">Xem khóa học →</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

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