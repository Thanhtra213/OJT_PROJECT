import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Layers3, Sparkles } from "lucide-react";
import {
  createFlashcardSet,
  updateFlashcardSet,
  getFlashcardSetById,
} from "../../middleware/teacher/flashcardTeacherAPI";
import { getCourses } from "../../middleware/courseAPI";
import "./createEditFlashcard.scss";

const CreateEditFlashcardSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = id && id !== "create";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseID: "",
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        console.log("📘 API Course data:", data);

        if (Array.isArray(data)) {
          setCourses(data);
        } else if (data && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          console.warn("⚠️ Dữ liệu khóa học không hợp lệ:", data);
          setCourses([]);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách khóa học:", err);
        setCourses([]);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      (async () => {
        try {
          setLoading(true);
          const data = await getFlashcardSetById(id);

          setFormData({
            title: data.title || "",
            description: data.description || "",
            courseID: data.courseID || "",
          });
        } catch (err) {
          console.error("❌ Lỗi khi tải flashcard set:", err);
          setMessage({
            type: "danger",
            text: "Không thể tải flashcard set.",
          });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.courseID) {
      setMessage({ type: "danger", text: "Vui lòng chọn khóa học!" });
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await updateFlashcardSet(id, formData);
        setMessage({ type: "success", text: "Cập nhật thành công!" });
      } else {
        await createFlashcardSet(formData);
        setMessage({ type: "success", text: "Tạo mới thành công!" });
      }

      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      console.error("❌ Lỗi khi lưu flashcard set:", err);
      setMessage({
        type: "danger",
        text: "Có lỗi khi lưu flashcard set.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseName =
    Array.isArray(courses) &&
    courses.find((c) => String(c.courseID) === String(formData.courseID))
      ?.courseName;

  return (
    <div className="create-edit-flashcard-page">
      <Container fluid className="create-edit-flashcard-container">
        <div className="page-topbar">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </button>
        </div>

        <Row className="g-4 align-items-start">
          <Col lg={8}>
            <div className="page-header">
              <div className="header-icon">
                <Layers3 size={24} />
              </div>
              <div className="header-content">
                <h1>
                  {isEditMode
                    ? "Chỉnh sửa Flashcard Set"
                    : "Tạo Flashcard Set mới"}
                </h1>
                <p>
                  Tạo bộ flashcard rõ ràng, trực quan và đồng bộ với giao diện
                  quản lý khóa học.
                </p>
              </div>
            </div>

            <Card className="flashcard-form-card">
              <Card.Body>
                {message.text && (
                  <Alert variant={message.type} className="custom-alert">
                    {message.text}
                  </Alert>
                )}

                {loading ? (
                  <div className="loading-box">
                    <Spinner animation="border" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit} className="flashcard-form">
                    <Form.Group className="mb-4">
                      <Form.Label>Tiêu đề</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ví dụ: Từ vựng bài 1"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Mô tả</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Mô tả ngắn về bộ flashcard này..."
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Khóa học</Form.Label>
                      {isEditMode ? (
                        <Form.Control
                          type="text"
                          value={selectedCourseName || "Không xác định"}
                          disabled
                          readOnly
                        />
                      ) : (
                        <Form.Select
                          name="courseID"
                          value={formData.courseID}
                          onChange={handleChange}
                          required
                        >
                          <option value="">-- Chọn khóa học --</option>
                          {Array.isArray(courses) &&
                            courses.map((course) => (
                              <option
                                key={course.courseID}
                                value={course.courseID}
                              >
                                {course.courseName}
                              </option>
                            ))}
                        </Form.Select>
                      )}
                    </Form.Group>

                    <div className="form-actions">
                      <Button type="submit" className="btn-save" disabled={loading}>
                        {isEditMode ? "Lưu thay đổi" : "Tạo mới"}
                      </Button>

                      <Button
                        type="button"
                        className="btn-cancel"
                        onClick={() => navigate(-1)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="flashcard-side-card">
              <Card.Body>
                <div className="side-title">
                  <Sparkles size={18} />
                  <span>Gợi ý khi tạo flashcard</span>
                </div>

                <ul className="tips-list">
                  <li>Đặt tiêu đề ngắn gọn, dễ nhận biết theo bài học.</li>
                  <li>Mô tả nên nêu rõ chủ đề hoặc mục tiêu ghi nhớ.</li>
                  <li>Chọn đúng khóa học để quản lý bộ thẻ dễ hơn.</li>
                  <li>Nên thống nhất cách đặt tên giữa các flashcard set.</li>
                </ul>
              </Card.Body>
            </Card>

            <Card className="flashcard-side-card info-card">
              <Card.Body>
                <div className="side-title">
                  <BookOpen size={18} />
                  <span>Thông tin hiện tại</span>
                </div>

                <div className="info-row">
                  <span>Chế độ</span>
                  <strong>{isEditMode ? "Chỉnh sửa" : "Tạo mới"}</strong>
                </div>

                <div className="info-row">
                  <span>Khóa học</span>
                  <strong>{selectedCourseName || "Chưa chọn"}</strong>
                </div>

                <div className="info-row">
                  <span>Trạng thái</span>
                  <strong>{loading ? "Đang xử lý" : "Sẵn sàng"}</strong>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateEditFlashcardSet;