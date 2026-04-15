import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Form, Card, Alert, InputGroup, Nav, Tab } from "react-bootstrap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CreateEditQuizz.scss";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getTeacherCourses } from "../../middleware/teacher/courseTeacherAPI";
import { faSave, faTimes, faEdit, faPlus, faQuestionCircle, faTrashAlt, faLightbulb, faCircleXmark, faCheckSquare, faPenNib } from '@fortawesome/free-solid-svg-icons';

const CreateEditQuiz = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = !!id;
  const passedCourses = location.state?.courses || [];

  const [quizData, setQuizData] = useState({
    title: "",
    course: "",
    duration: "",
    passingScore: "", // e.g., "70%"
    status: "draft", // "draft" or "published"
    questions: [], // Array of question objects
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isEditMode) {
      const preSelectedId = location.state?.preSelectedCourseId || location.state?.courseId;
      if (preSelectedId) {
        setQuizData(prev => ({ ...prev, course: preSelectedId }));
      } else if (passedCourses.length > 0) {
        setQuizData(prev => ({ ...prev, course: passedCourses[0].courseID }));
      }
    }
  }, [isEditMode, location.state, passedCourses]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getTeacherCourses();
        console.log("Courses API:", data);

        setCourses(data || []);

        // auto chọn course đầu tiên nếu chưa có
        if (data.length > 0 && !quizData.course) {
          setQuizData(prev => ({
            ...prev,
            course: data[0].courseID
          }));
        }
      } catch (err) {
        console.error("Lỗi load courses:", err);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchQuiz = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL || "http://localhost:5293"}/api/teacher/quiz/${id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            }
          );
          // Mapping logic: Backend trả về Groups -> Questions, Frontend cần mảng 'questions' phẳng
          const rawData = response.data;
          const questionsFromGroups = [];

          if (rawData.groups && rawData.groups.length > 0) {
            rawData.groups.forEach(group => {
              if (group.questions) {
                group.questions.forEach(q => {
                  const qType = q.questionType || q.QuestionType || ((q.options && q.options.length > 0) ? 1 : 2);
                  let correctAnswer = "";

                  if (qType === 2) {
                    // Ưu tiên lấy từ metaJson cho câu tự luận
                    if (q.metaJson) {
                      try {
                        const meta = JSON.parse(q.metaJson);
                        correctAnswer = meta.answer || meta.Answer || "";
                      } catch (e) { }
                    }
                    if (!correctAnswer && q.options && q.options.length > 0) {
                      correctAnswer = q.options[0].content || q.options[0];
                    }
                  } else {
                    correctAnswer = (q.options || []).find(opt => opt.isCorrect || opt.IsCorrect)?.content || "";
                  }

                  questionsFromGroups.push({
                    id: q.questionID || q.id || Date.now() + Math.random(),
                    text: q.content || q.text || "",
                    type: qType === 2 ? "essay" : "multiple-choice",
                    options: (q.options || []).map(opt => opt.content || opt),
                    correctAnswer: correctAnswer
                  });
                });
              }
            });
          }

          setQuizData({
            title: rawData.title || "",
            course: rawData.courseID || rawData.courseId || "",
            duration: rawData.duration ? String(rawData.duration).replace(/[^0-9.,]/g, '') : "30",
            passingScore: rawData.passingScore || "70%",
            status: rawData.isActive ? "published" : "draft",
            questions: questionsFromGroups.length > 0 ? questionsFromGroups : (rawData.questions || []),
          });
        } catch (err) {
          console.error("Error fetching quiz:", err);
          if (err.response?.status === 404) {
            setError("Quiz không tồn tại hoặc đã bị xóa.");
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            setError("Bạn không có quyền truy cập Quiz này.");
          } else {
            setError("Không thể tải Quiz để chỉnh sửa.");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchQuiz();
    }
  }, [id, isEditMode]);

  const handleQuizDetailsChange = (e) => {
    const { name, value } = e.target;
    setQuizData({ ...quizData, [name]: value });
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex][field] = value;

    // Nếu chuyển sang tự luận, thu gọn options lại còn 1 và đồng bộ correctAnswer
    if (field === "type" && value === "essay") {
      const firstOpt = newQuestions[qIndex].options[0] || "";
      newQuestions[qIndex].options = [firstOpt];
      newQuestions[qIndex].correctAnswer = firstOpt;
    }

    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        { id: Date.now(), text: "", options: ["", ""], correctAnswer: "", type: "multiple-choice" },
      ],
    });
  };

  const removeQuestion = (qIndex) => {
    const newQuestions = quizData.questions.filter((_, idx) => idx !== qIndex);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addOption = (qIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options.push("");
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const removeOption = (qIndex, optIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, idx) => idx !== optIndex);
    if (newQuestions[qIndex].correctAnswer === newQuestions[qIndex].options[optIndex]) {
      newQuestions[qIndex].correctAnswer = "";
    }
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!quizData.title || !quizData.course || !quizData.duration || !quizData.passingScore || (quizData.questions?.length || 0) === 0) {
      setError("Vui lòng điền đầy đủ thông tin quiz và thêm ít nhất một câu hỏi!");
      setLoading(false);
      return;
    }

    // Basic validation for questions
    for (const q of quizData.questions) {
      if (!q.text) {
        setError("Vui lòng nhập nội dung cho tất cả các câu hỏi.");
        setLoading(false);
        return;
      }
      if (q.type === "multiple-choice") {
        if (q.options.some(opt => !opt) || !q.correctAnswer || !q.options.includes(q.correctAnswer)) {
          setError("Vui lòng đảm bảo tất cả câu hỏi trắc nghiệm có ít nhất 2 lựa chọn và đáp án đúng được chọn.");
          setLoading(false);
          return;
        }
      } else if (q.type === "essay") {
        const answer = q.correctAnswer || q.options[0];
        if (!answer || answer.trim() === "") {
          setError("Vui lòng nhập đáp án cho câu tự luận");
          return;
        }
      }
    }

    try {
      const apiBase = `${process.env.REACT_APP_API_URL || "http://localhost:5293"}/api/teacher/quiz`;
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      };

      const formattedQuestions = quizData.questions.map((q, index) => {
        const type = q.type === "multiple-choice" ? 1 : 2;
        const answer = q.type === "multiple-choice" ? q.correctAnswer : q.options[0];

        return {
          content: q.text,
          questionType: type,
          questionOrder: index + 1,
          scoreWeight: 1.0,
          metaJson: type === 2 ? JSON.stringify({ answer: answer }) : null,
          options: q.type === "multiple-choice"
            ? q.options.map(opt => ({
              content: opt,
              isCorrect: opt === answer && opt !== ""
            }))
            : [{ content: answer, isCorrect: true }]
        };
      });

      if (isEditMode) {
        // Cập nhật thông tin Quiz kèm câu hỏi
        await axios.put(`${apiBase}/${id}`, {
          title: quizData.title,
          description: quizData.title,
          quizType: 1,
          isActive: quizData.status === "published",
          questions: formattedQuestions
        }, config);
        setSuccess("Cập nhật thông tin Quiz thành công!");
      } else {
        await axios.post(apiBase, {
          courseID: parseInt(quizData.course),
          title: quizData.title,
          description: quizData.title,
          quizType: 1,
          questions: formattedQuestions
        }, config);
        setSuccess("Tạo Quiz thành công!");
      }
      setTimeout(() => navigate("/teacher/dashboard"), 1500); // Redirect after a short delay
    } catch (err) {
      setError("Đã có lỗi xảy ra khi lưu Quiz.");
      console.error("Error saving quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !error) {
    return (
      <Container fluid className="p-4 create-edit-quiz-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Đang tải Quiz...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4 create-edit-quiz-container">
      {/* Header */}
      <Row className="mb-4 d-flex justify-content-between align-items-center">
        <Col className="header-content">
          <h3><strong><FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" /> {isEditMode ? "Chỉnh sửa Quiz" : "Tạo Quiz mới"}</strong></h3>
          <p>{isEditMode ? "Cập nhật thông tin cơ bản cho Quiz" : "Thiết kế các bài kiểm tra ngắn cho học viên"}</p>
        </Col>
        <Col className="text-end header-buttons">
          <Button variant="outline-primary" className="me-2" onClick={() => navigate("/teacher/dashboard")}>
            <FontAwesomeIcon icon={faTimes} className="me-1" /> Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            <FontAwesomeIcon icon={faSave} className="me-1" /> {loading ? "Đang lưu..." : "Lưu Quiz"}
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={8}>
          <Card className="p-4 mb-3">
            <h5>Thông tin cơ bản Quiz</h5>
            <p className="text-muted">Đặt tên, chọn khóa học và cấu hình thời gian</p>

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tiêu đề Quiz <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ví dụ: Kiểm tra ngữ pháp cơ bản"
                  name="title"
                  value={quizData.title}
                  onChange={handleQuizDetailsChange}
                  required
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Khóa học <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="course"
                      value={quizData.course}
                      onChange={handleQuizDetailsChange}
                      required
                    >
                      <option value="">Chọn khóa học</option>
                      {courses.map(course => (
                        <option key={course.courseID} value={course.courseID}>
                          {course.courseName}
                        </option>
                      ))}
                      {/* Fallback nếu không có passedCourses */}
                      {/* {passedCourses.length === 0 && (
                          <>
                              <option value="1">IELTS Nền Tảng</option>
                              <option value="2">IELTS Cơ Bản</option>
                              <option value="3">IELTS Nâng Cao</option>
                          </>
                      )} */}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Thời lượng (Phút) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ví dụ: 30"
                      name="duration"
                      value={quizData.duration}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        handleQuizDetailsChange({ target: { name: "duration", value: val } });
                      }}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Điểm đậu <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Ví dụ: 70"
                        name="passingScore"
                        value={String(quizData.passingScore || "").replace('%', '')}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '');
                          handleQuizDetailsChange({ target: { name: "passingScore", value: val ? `${val}%` : '' } });
                        }}
                        required
                      />
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      name="status"
                      value={quizData.status}
                      onChange={handleQuizDetailsChange}
                    >
                      <option value="draft">Bản nháp</option>
                      <option value="published">Đã xuất bản</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* Questions Section - Hidden in Edit Mode */}
          {!isEditMode && (
            <Card className="p-4 mb-3">
              <h5><FontAwesomeIcon icon={faQuestionCircle} className="me-2" /> Câu hỏi Quiz ({quizData.questions?.length || 0})</h5>
              <p className="text-muted">Thêm các câu hỏi và lựa chọn đáp án đúng</p>

              {quizData.questions?.map((q, qIndex) => (
                <Card key={q.id || qIndex} className="mb-4 question-card shadow-sm border-0">
                  <Card.Body className="p-0">
                    <div className="question-header d-flex justify-content-between align-items-center p-3 border-bottom">
                      <div className="d-flex align-items-center">
                        <span className="question-number me-3">#{qIndex + 1}</span>
                        <h6 className="mb-0">Cấu hình câu hỏi</h6>
                      </div>
                      <Button variant="link" className="text-danger p-0" onClick={() => removeQuestion(qIndex)} title="Xóa câu hỏi">
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </Button>
                    </div>

                    <div className="p-3">
                      <Nav variant="pills" className="custom-question-tabs mb-3" activeKey={q.type || "multiple-choice"} onSelect={(k) => handleQuestionChange(qIndex, "type", k)}>
                        <Nav.Item>
                          <Nav.Link eventKey="multiple-choice">
                            <FontAwesomeIcon icon={faCheckSquare} className="me-2" /> Trắc nghiệm
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="essay">
                            <FontAwesomeIcon icon={faPenNib} className="me-2" /> Tự luận
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Nội dung câu hỏi <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          className="question-textarea"
                          placeholder="Nhập nội dung câu hỏi tại đây..."
                          value={q.text}
                          onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                          required
                        />
                      </Form.Group>

                      {(!q.type || q.type === "multiple-choice") ? (
                        <div className="multiple-choice-section p-3 bg-light rounded-3">
                          <Form.Label className="fw-bold mb-3">Các lựa chọn đáp án</Form.Label>
                          {q.options.map((option, optIndex) => (
                            <InputGroup key={optIndex} className="mb-3 custom-input-group">
                              <InputGroup.Text className="bg-white border-end-0">
                                <Form.Check
                                  type="radio"
                                  name={`correctAnswer-${qIndex}`}
                                  id={`q-${qIndex}-opt-${optIndex}`}
                                  checked={q.correctAnswer === option && option !== ""}
                                  onChange={() => handleQuestionChange(qIndex, "correctAnswer", option)}
                                  aria-label="Đánh dấu là đáp án đúng"
                                />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                className="border-start-0"
                                placeholder={`Nhập nội dung lựa chọn ${optIndex + 1}...`}
                                value={option}
                                onChange={(e) => {
                                  handleOptionChange(qIndex, 0, e.target.value);
                                  handleQuestionChange(qIndex, "correctAnswer", e.target.value);
                                }}
                                required
                              />
                              {q.options.length > 2 && (
                                <Button variant="outline-danger" className="border-start-0" onClick={() => removeOption(qIndex, optIndex)}>
                                  <FontAwesomeIcon icon={faTimes} />
                                </Button>
                              )}
                            </InputGroup>
                          ))}
                          <Button variant="outline-primary" size="sm" onClick={() => addOption(qIndex)} className="rounded-pill px-3">
                            <FontAwesomeIcon icon={faPlus} className="me-1" /> Thêm lựa chọn
                          </Button>
                          {q.correctAnswer && (
                            <div className="mt-3 text-success d-flex align-items-center">
                              <FontAwesomeIcon icon={faCheckSquare} className="me-2" />
                              <span>Đáp án đúng: <strong>{q.correctAnswer}</strong></span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="essay-section p-4 bg-light rounded-3 border-dashed">
                          <div className="essay-header d-flex align-items-center mb-3">
                            <div className="essay-icon-container me-3">
                              <FontAwesomeIcon icon={faPenNib} className="text-primary" />
                            </div>
                            <h6 className="mb-0 fw-bold">Đáp án câu hỏi tự luận</h6>
                          </div>

                          <Form.Group>
                            <Form.Label className="small text-muted mb-2 italic">Nhập đáp án đúng hoặc nội dung tham khảo để hệ thống đối chiếu (không phân biệt hoa thường)</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              className="essay-answer-input"
                              placeholder="Ví dụ: Rome, Paris, v.v..."
                              value={q.options[0] || ""}
                              onChange={(e) => handleOptionChange(qIndex, 0, e.target.value)}
                              required
                            />
                          </Form.Group>

                          <div className="mt-3 info-box d-flex align-items-start p-2 rounded bg-white border">
                            <FontAwesomeIcon icon={faLightbulb} className="text-warning me-2 mt-1" />
                            <small className="text-muted">
                              Hệ thống sẽ tự động chấm điểm dựa trên việc so khớp chính xác cụm từ này (không phân biệt chữ hoa/thường).
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ))}

              <Button variant="outline-primary" onClick={addQuestion} className="mt-3 w-100">
                <FontAwesomeIcon icon={faPlus} className="me-2" /> Thêm câu hỏi mới
              </Button>
            </Card>
          )}
        </Col>

        <Col md={4}>
          <Card className="p-4">
            <h6><FontAwesomeIcon icon={faLightbulb} className="me-2" /> Gợi ý Quiz</h6>
            <ul>
              <li>Giữ câu hỏi ngắn gọn và rõ ràng.</li>
              <li>Đảm bảo có ít nhất 2 lựa chọn cho mỗi câu hỏi.</li>
              <li>Luôn chọn đáp án đúng cho mỗi câu hỏi.</li>
              <li>Kiểm tra kỹ thời lượng và điểm đậu phù hợp.</li>
              <li>Xuất bản Quiz khi đã hoàn thành để học viên có thể làm.</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateEditQuiz;