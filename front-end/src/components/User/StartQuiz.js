import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Alert, Container, Badge, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckCircle, faExclamationTriangle, faTimes, faCheck, faPenNib, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
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
  const [results, setResults] = useState([]);   
  const [error, setError] = useState(null);

  const [isPlacementTest, setIsPlacementTest] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRecommend, setLoadingRecommend] = useState(false);

  const hasFetched = useRef(false);

  const showToast = (message, type = "error") => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type === "error" ? "error" : "success",
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
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

  useEffect(() => {
    const fetchQuiz = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      try {
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
    const unanswered = allQuestions.filter(q => !answers[q.questionID] || String(answers[q.questionID]).trim() === "");

    if (unanswered.length > 0) {
      const confirmResult = await Swal.fire({
        title: "Chưa hoàn thành bài",
        text: `Bạn còn ${unanswered.length} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#00c896",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Vẫn nộp bài",
        cancelButtonText: "Quay lại làm tiếp"
      });

      if (!confirmResult.isConfirmed) return;
    }

    try {
      setSubmitting(true);

      const formatted = Object.entries(answers).map(([q, val]) => {
        if (typeof val === "number") {
          return { QuestionID: Number(q), OptionID: val };
        } else {
          return { QuestionID: Number(q), AnswerText: val };
        }
      });

      const result = await submitQuiz(attemptId, formatted);
      const finalScore = result.totalScore ?? result.autoScore ?? 0;

      setScore(finalScore);
      setResults(Array.isArray(result.results) ? result.results : []);
      setSubmitted(true);

      showToast(`Đã nộp bài! Bạn đạt ${finalScore} điểm.`, "success");

      if (isPlacementTest) {
        setLoadingRecommend(true);
        try {
          const rec = await getPlacementRecommendation(attemptId);
          setRecommendation(rec?.data || rec);
        } catch (recErr) {
          console.error("Lỗi lấy gợi ý khóa học:", recErr);
        } finally {
          setLoadingRecommend(false);
        }
      }

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
    results.find(r => String(r.questionId) === String(questionID) || String(r.questionID) === String(questionID));

  // ✅ ĐÃ FIX LẠI LOGIC CHẤM ĐIỂM CHO OPTION TRẮC NGHIỆM
  const getOptionState = (question, opt) => {
    if (!submitted) return null;
    const qid = question.questionID;
    const res = getQuestionResult(qid);
    const isSelected = String(answers[qid]) === String(opt.optionID);

    // Nếu người dùng CHỌN đáp án này
    if (isSelected) {
      // Backend báo câu này ĐÚNG -> Chắc chắn đáp án đang chọn là ĐÚNG
      if (res?.isCorrect === true) return 'correct';
      // Backend báo câu này SAI -> Chắc chắn đáp án đang chọn là SAI
      if (res?.isCorrect === false) return 'wrong';
    }

    // ĐỐI VỚI CÁC ĐÁP ÁN KHÔNG ĐƯỢC CHỌN (Tìm xem đâu là đáp án đúng thực sự để hiển thị khung xanh nét đứt)
    let isCorrectOption = false;
    if (res && res.correctOptions && Array.isArray(res.correctOptions) && res.correctOptions.length > 0) {
        isCorrectOption = res.correctOptions.some(o => String(o.optionId) === String(opt.optionID) || String(o.OptionId) === String(opt.optionID));
    } else if (res && res.correctOptionId !== undefined && res.correctOptionId !== null) {
        isCorrectOption = String(res.correctOptionId) === String(opt.optionID);
    } else {
        isCorrectOption = opt.isCorrect === true || opt.IsCorrect === true || opt.correct === true;
    }

    if (!isSelected && isCorrectOption) return 'correct-answer'; 
    return null;
  };

  // TÌM ĐÁP ÁN ĐÚNG CỦA CÂU TỰ LUẬN/ĐIỀN KHUYẾT ĐỂ LÀM GỢI Ý
  const getCorrectText = (question, qResult) => {
    if (qResult?.correctAnswerText) return qResult.correctAnswerText;
    
    const metaSource = question.metaJson || question.MetaJson;
    if (metaSource) {
      try {
        const meta = typeof metaSource === 'string' ? JSON.parse(metaSource) : metaSource;
        const ans = meta?.answer || meta?.Answer || (meta?.answers && meta.answers.join(", "));
        if (ans) return ans;
      } catch (e) { }
    }
    
    const firstOpt = (question.options || question.choices || [])[0];
    return firstOpt?.content || firstOpt?.Content || firstOpt || "Chưa có đáp án mẫu";
  };

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

  const visibleGroups = groups.filter(g => g.questions?.length > 0);

  return (
    <div className="start-quiz-page">
      <Container>
        <button className="back-btn" onClick={handleBackToList}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại bài trước
        </button>

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

        {visibleGroups.length > 0 ? (
          visibleGroups.map((group, groupIdx) => {
            const hasLeftCol = group.instruction || group.assets?.length > 0;
            return (
              <div key={groupIdx} className="quiz-group-box">
                <Row className="g-0 h-100">
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

                  <Col md={hasLeftCol ? 7 : 12} className="qg-right">
                    {group.questions?.map((question, qIdx) => {
                      const qid = question.questionID;
                      const qResult = submitted ? getQuestionResult(qid) : null;
                      const qType = question.questionType || question.type || 1;
                      const correctText = getCorrectText(question, qResult);
                      const isAnswered = answers[qid] !== undefined && String(answers[qid]).trim() !== "";
                      
                      // Xác định class cho khối câu hỏi (đổi màu viền)
                      let qStatusClass = '';
                      let badgeContent = null;

                      if (submitted) {
                        if (qType === 3 && qResult?.isCorrect === null && isAnswered) {
                            badgeContent = <span className="q-result-badge badge-pending">Chờ chấm</span>;
                        } else if (qResult?.isCorrect === true) {
                            qStatusClass = 'q-correct';
                            badgeContent = <span className="q-result-badge badge-correct"><FontAwesomeIcon icon={faCheck} /> Đúng</span>;
                        } else {
                            qStatusClass = 'q-wrong';
                            badgeContent = <span className="q-result-badge badge-wrong"><FontAwesomeIcon icon={faTimes} /> Sai</span>;
                        }
                      }

                      return (
                        <div key={qid} className={`question-block ${qStatusClass}`}>
                          <div className="q-title">
                            <span className="q-num">Câu {qIdx + 1}</span>
                            <span>{question.content}</span>
                            {badgeContent}
                          </div>

                          {question.assets?.map((asset, idx) => (
                            <div className="asset-box" key={`qa-${idx}`}>{renderAsset(asset, idx)}</div>
                          ))}

                          {question.options?.length > 0 && qType === 1 ? (
                            <div className="options-grid">
                              {question.options.map((opt, idx) => {
                                const state = getOptionState(question, opt);
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
                              })}
                            </div>
                          ) : (
                            <div className="essay-wrapper mt-3 w-100">
                              <textarea
                                className={`form-control w-100 ${submitted ? (qResult?.isCorrect === true ? 'is-valid' : (qResult?.isCorrect === false || !isAnswered) ? 'is-invalid' : '') : ''}`}
                                style={{
                                  minHeight: qType === 2 ? '60px' : '120px',
                                  borderRadius: '12px',
                                  padding: '14px 18px',
                                  backgroundColor: submitted ? '#f8fafc' : '#ffffff',
                                  border: submitted ? '1px solid #cbd5e1' : '2px solid #e2e8f0',
                                  boxShadow: submitted ? 'none' : 'inset 0 2px 4px rgba(0,0,0,0.03)',
                                  fontSize: '1.05rem',
                                  color: '#0f172a',
                                  resize: qType === 2 ? 'none' : 'vertical',
                                  transition: 'all 0.2s ease-in-out'
                                }}
                                placeholder={qType === 2 ? "Nhập từ/cụm từ điền khuyết vào đây..." : "Nhập câu trả lời tự luận của bạn..."}
                                value={answers[qid] || ""}
                                onChange={(e) =>
                                  setAnswers(prev => ({
                                    ...prev,
                                    [qid]: e.target.value
                                  }))
                                }
                                disabled={submitted}
                              />

                              {submitted && (
                                <div>
                                  {/* TYPE 2: Nếu làm sai hoặc chưa làm => Báo đáp án đúng */}
                                  {qType === 2 && qResult?.isCorrect !== true && correctText && (
                                    <div className="p-3 mt-3 rounded-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                                      <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} className="me-2" /> Đáp án chính xác:
                                      </strong>
                                      <div className="mt-2 fw-bold fs-6">{correctText}</div>
                                    </div>
                                  )}

                                  {/* TYPE 3: Luôn hiển thị gợi ý sau khi nộp bài */}
                                  {qType === 3 && correctText && (
                                    <div className="p-3 mt-3 rounded-3" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
                                      <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <FontAwesomeIcon icon={faLightbulb} className="me-2" /> Gợi ý / Đáp án mẫu:
                                      </strong>
                                      <div className="mt-2 fw-bold fs-6" style={{ whiteSpace: 'pre-wrap' }}>{correctText}</div>
                                    </div>
                                  )}
                                </div>
                              )}
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

            <div className="score-breakdown">
              <span className="breakdown-item correct">
                <FontAwesomeIcon icon={faCheck} /> {results.filter(r => r.isCorrect === true).length} đúng
              </span>
              <span className="breakdown-item wrong">
                <FontAwesomeIcon icon={faTimes} /> {results.filter(r => r.isCorrect === false).length} sai
              </span>
              {results.filter(r => r.isCorrect === null).length > 0 && (
                <span className="breakdown-item essay">
                  <FontAwesomeIcon icon={faPenNib} /> {results.filter(r => r.isCorrect === null).length} tự luận
                </span>
              )}
            </div>

            <p className="text-muted mb-4">Điểm số của bạn đã được ghi nhận.</p>

            {isPlacementTest && (
              <div className="mt-5 mb-4">
                {loadingRecommend ? (
                  <div className="text-center py-4 p-4 rounded-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Spinner animation="border" size="sm" style={{ color: '#8b5cf6' }} />
                    <span className="ms-3" style={{ color: '#64748b', fontWeight: 600 }}>Hệ thống đang phân tích trình độ và gợi ý khóa học...</span>
                  </div>
                ) : recommendation ? (
                  <div className="placement-result-modern">
                    <div className="pr-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <span className="pr-label text-muted fw-bold text-uppercase">Trình độ hiện tại của bạn:</span>
                        <span className="pr-badge">{recommendation.levelName}</span>
                      </div>
                      <div className="pr-score text-muted fw-bold">
                        Tổng điểm đánh giá: {recommendation.score}/100
                      </div>
                    </div>
                    <hr className="pr-divider" />
                    
                    {recommendation.recommendedCourses?.length > 0 && (
                      <div className="pr-courses-section">
                        <h6 className="text-center fw-bold mb-4" style={{ color: '#334155' }}>Khóa học được đề xuất dành riêng cho bạn:</h6>
                        <div className="pr-course-grid">
                          {recommendation.recommendedCourses.map(course => (
                            <div
                              key={course.courseID}
                              className="pr-course-card"
                              onClick={() => navigate(`/course/${course.courseID}`)}
                            >
                              <div className="pr-c-title">{course.courseName}</div>
                              {course.description && (
                                <div className="pr-c-desc">{course.description}</div>
                              )}
                              <span className="pr-c-link">Xem chi tiết khóa học &rarr;</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <div className="result-actions mt-3">
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