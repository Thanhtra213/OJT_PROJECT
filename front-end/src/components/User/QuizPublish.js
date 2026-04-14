import React, { useState, useEffect } from "react";
import { Container, Card, Row, Col, Spinner, Alert, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFileAlt, faPlay, faClock, faListOl } from "@fortawesome/free-solid-svg-icons";
import { getAllQuizzesPublish } from "../../middleware/QuizAPI";
import "./QuizPublish.scss";

const QuizPublish = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublishedQuizzes();
  }, []);

  const fetchPublishedQuizzes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllQuizzesPublish();
      console.log("✅ Fetched published quizzes:", data);
      
      // Lọc chỉ lấy quiz published (nếu API có trường status/isPublished)
      
      const publishedQuizzes = Array.isArray(data) 
        ? data.filter(quiz => quiz.isPublished !== false) 
        : [];
      
      setQuizzes(publishedQuizzes);
    } catch (err) {
      console.error("❌ Error fetching quizzes:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách quiz");
    } finally {
      setLoading(false);
    }
  };

  const getQuizTypeBadge = (type) => {
    switch (type) {
      case 0: return <span className="brand-badge badge-practice">Practice</span>;
      case 1: return <span className="brand-badge badge-exam">Exam</span>;
      case 2: return <span className="brand-badge badge-assignment">Assignment</span>;
      default: return <span className="brand-badge badge-default">Quiz</span>;
    }
  };

  const getTotalQuestions = (quiz) => {
    if (quiz.questionCount) return quiz.questionCount;
    if (quiz.groups && Array.isArray(quiz.groups)) {
      return quiz.groups.reduce((sum, g) => sum + (g.questions?.length || 0), 0);
    }
    if (quiz.questions && Array.isArray(quiz.questions)) {
      return quiz.questions.length;
    }
    return 0;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Đang tải danh sách quiz...</p>
      </Container>
    );
  }

  return (
    <div className="quiz-publish-page py-4">
      <Container>
        {/* Header */}
        <div className="page-header">
          <button 
            className="back-btn" 
            onClick={() => navigate(-1)} 
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
          </button>
          <h3>
            <FontAwesomeIcon icon={faFileAlt} className="me-3" style={{color: '#00c896'}}/>
            Danh sách Quiz
          </h3>
          <p className="text-muted">Chọn quiz để bắt đầu luyện tập và kiểm tra năng lực của bạn.</p>
        </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          <strong>❌ Lỗi:</strong> {error}
        </Alert>
      )}

      {/* Quiz List */}
      {quizzes.length > 0 ? (
        <Row>
          {quizzes.map((quiz) => {
            const quizId = quiz.quizID || quiz.quizId || quiz.id;
            const totalQuestions = getTotalQuestions(quiz);
            
            return (
              <Col md={6} lg={4} key={quizId} className="mb-4">
                <div 
                  className="qcard"
                  onClick={() => navigate(`/quiz/start/${quizId}`)}
                >
                  <div className="qcard-head">
                    <h4>{quiz.title || "Quiz không có tiêu đề"}</h4>
                    <div className="play-icon">
                      <FontAwesomeIcon icon={faPlay} />
                    </div>
                  </div>

                  <div className="qcard-body">
                    <p>{quiz.description || "Chưa có mô tả cho quiz này."}</p>
                  </div>

                  <div className="qcard-meta">
                    <span><FontAwesomeIcon icon={faListOl} /> {totalQuestions} câu hỏi</span>
                    {quiz.duration && (
                      <span><FontAwesomeIcon icon={faClock} /> {quiz.duration} phút</span>
                    )}
                  </div>

                  <div className="qcard-foot">
                    {getQuizTypeBadge(quiz.quizType)}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <FontAwesomeIcon 
              icon={faFileAlt} 
              size="4x" 
              className="text-muted mb-3" 
            />
            <h5 className="text-muted">Chưa có quiz nào</h5>
            <p className="text-muted mb-0">
              Hiện tại chưa có quiz nào được publish. Vui lòng quay lại sau!
            </p>
          </Card.Body>
        </Card>
      )}
      </Container>
    </div>
  );
};

export default QuizPublish;