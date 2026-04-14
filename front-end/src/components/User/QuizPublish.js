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
      case 0:
        return <Badge bg="info">Practice</Badge>;
      case 1:
        return <Badge bg="danger">Exam</Badge>;
      case 2:
        return <Badge bg="warning" text="dark">Assignment</Badge>;
      default:
        return <Badge bg="secondary">Quiz</Badge>;
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
    <Container className="quiz-publish-page py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-5 mt-2">
        <button 
          onClick={() => navigate(-1)} 
          className="mint-back-btn me-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
        </button>
        <div>
          <h2 className="page-header-title mb-0">
            Danh sách Quiz
          </h2>
          <p className="text-muted mb-0 mt-1 fw-bold">
            Chọn quiz để kiểm tra trình độ hoặc luyện tập
          </p>
        </div>
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
                <Card 
                  className="quiz-card h-100 shadow-sm hover-card"
                  onClick={() => navigate(`/quiz/start/${quizId}`)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Card.Body className="d-flex flex-column">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-2 text-primary">
                          {quiz.title || "Quiz không có tiêu đề"}
                        </h5>
                        {getQuizTypeBadge(quiz.quizType)}
                      </div>
                      <FontAwesomeIcon 
                        icon={faPlay} 
                        className="text-primary" 
                        size="lg"
                      />
                    </div>

                    {/* Description */}
                    <Card.Text className="text-muted mb-3 flex-grow-1">
                      {quiz.description || "Không có mô tả"}
                    </Card.Text>

                    {/* Footer Info */}
                    <div className="d-flex justify-content-between align-items-center info-footer">
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faListOl} className="me-2" />
                        <span>{totalQuestions} câu</span>
                      </div>
                      {quiz.duration && (
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faClock} className="me-2" />
                          <span>{quiz.duration} phút</span>
                        </div>
                      )}
                    </div>

                    {/* Start Button */}
                    <Button 
                      variant="primary" 
                      className="w-100 mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quiz/start/${quizId}`);
                      }}
                    >
                      <FontAwesomeIcon icon={faPlay} className="me-2" />
                      Bắt đầu làm bài
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '24px' }}>
          <Card.Body className="py-5">
            <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesomeIcon 
                icon={faFileAlt} 
                size="2x" 
                className="text-muted" 
              />
            </div>
            <h4 className="mt-4 fw-bold text-dark">Chưa có quiz nào</h4>
            <p className="text-muted mb-0">
              Hiện tại chưa có bài kiểm tra hoặc bài luyện tập nào được xuất bản.
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default QuizPublish;