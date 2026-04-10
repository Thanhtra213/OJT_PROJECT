import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFlashcardSetById,
  createFlashcardItem,
  updateFlashcardItem,
  deleteFlashcardItem,
} from "../../middleware/teacher/flashcardTeacherAPI";
import "./FlashcardItem.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrashAlt,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const FlashcardItem = () => {
  const { setId } = useParams();
  const navigate = useNavigate();

  const [setData, setSetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    frontText: "",
    ipa: "",
    backText: "",
    example: "",
  });

  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    const fetchSet = async () => {
      try {
        setLoading(true);
        const data = await getFlashcardSetById(setId);
        setSetData(data);
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu flashcard");
      } finally {
        setLoading(false);
      }
    };

    fetchSet();
  }, [setId]);

  const handleShowAdd = () => {
    setModalMode("add");
    setSelectedItem(null);
    setFormData({ frontText: "", ipa: "", backText: "", example: "" });
    setShowModal(true);
  };

  const handleShowEdit = (item) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormData({
      frontText: item.frontText || item.FrontText || "",
      ipa: item.ipa || item.IPA || "",
      backText: item.backText || item.BackText || "",
      example: item.example || item.Example || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Map frontend formData fields to backend DTO fields
      const payload = {
        setID: parseInt(setId, 10),
        frontText: formData.frontText,
        backText: formData.backText,
        IPA: formData.ipa,
        example: formData.example,
      };
      if (modalMode === "add") {
        await createFlashcardItem(payload);
        setAlertMessage("✅ Đã thêm thẻ thành công!");
      } else {
        await updateFlashcardItem(selectedItem.itemID || selectedItem.ItemID, payload);
        setAlertMessage("✅ Đã cập nhật thẻ thành công!");
      }

      const updatedSet = await getFlashcardSetById(setId);
      setSetData(updatedSet);
      setShowModal(false);
    } catch (err) {
      setAlertMessage(`❌ Lỗi: ${err.response?.data || err.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ này không?")) return;

    try {
      await deleteFlashcardItem(setId, itemId);
      setAlertMessage("🗑️ Đã xóa thẻ thành công!");
      const updatedSet = await getFlashcardSetById(setId);
      setSetData(updatedSet);
    } catch (err) {
      setAlertMessage(`❌ Lỗi khi xóa: ${err.response?.data || err.message}`);
    }
  };

  return (
    <Container className="flashcard-item-page py-4">
      <div className="flashcard-header d-flex justify-content-between align-items-center mb-3">
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
        </Button>

        <h4 className="mb-0">{setData?.title || "Flashcard Set"}</h4>

        <Button variant="primary" onClick={handleShowAdd}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm thẻ mới
        </Button>
      </div>

      {alertMessage && (
        <Alert
          variant={alertMessage.includes("✅") ? "success" : "danger"}
          onClose={() => setAlertMessage(null)}
          dismissible
        >
          {alertMessage}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : !setData?.items || setData.items.length === 0 ? (
        <p>Chưa có thẻ nào trong bộ này.</p>
      ) : (
        <Row>
          {setData.items.map((item) => (
            <Col md={6} lg={4} key={item.itemID} className="mb-3">
              <Card className="flashcard-card shadow-sm border-0 rounded-3">
                <Card.Body>
                  <h6 className="fw-bold">
                    {item.frontText || item.FrontText || "(Chưa có từ)"}
                  </h6>
                  {(item.ipa || item.IPA) && (
                    <p className="text-secondary small mb-1 fst-italic">
                      /{item.ipa || item.IPA}/
                    </p>
                  )}
                  <p className="text-muted mb-1">{item.backText || item.BackText}</p>

                  {(item.example || item.Example) && (
                    <p className="fst-italic text-secondary small">
                      💡 {item.example || item.Example}
                    </p>
                  )}

                  <div className="flashcard-controls d-flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => handleShowEdit(item)}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Sửa
                    </Button>

                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(item.itemID || item.ItemID)}
                    >
                      <FontAwesomeIcon icon={faTrashAlt} /> Xóa
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "add" ? "Thêm thẻ mới" : "Chỉnh sửa thẻ"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Từ / Câu hỏi (Front)</Form.Label>
              <Form.Control
                type="text"
                value={formData.frontText}
                onChange={(e) =>
                  setFormData({ ...formData, frontText: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phiên âm (IPA)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ví dụ: /ˈæp.əl/"
                value={formData.ipa}
                onChange={(e) =>
                  setFormData({ ...formData, ipa: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Đáp án / Giải nghĩa (Back)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.backText}
                onChange={(e) =>
                  setFormData({ ...formData, backText: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ví dụ (Example)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.example}
                onChange={(e) =>
                  setFormData({ ...formData, example: e.target.value })
                }
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === "add" ? "Thêm" : "Cập nhật"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default FlashcardItem;