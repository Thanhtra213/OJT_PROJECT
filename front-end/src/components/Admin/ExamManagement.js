import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; 
import { 
  getAllQuizzes, 
  createQuiz, 
  deleteQuiz, 
  updateQuiz 
} from "../../middleware/admin/quizManagementAPI";
import { Eye, Trash2, Plus, BookOpen, BarChart3, Edit2, Target } from "lucide-react";
import "./admin-dashboard-styles.scss";

export function ExamManagement() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    quizType: 1,
  });
  const [creating, setCreating] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingQuiz, setUpdatingQuiz] = useState(null);
  const [updateData, setUpdateData] = useState({
    title: "",
    description: "",
    quizType: 1,
    isActive: true,
  });
  const [updating, setUpdating] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [showResultsModal, setShowResultsModal] = useState(false);
  const [systemExamResults, setSystemExamResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementQuiz, setPlacementQuiz] = useState(null);
  const [placementData, setPlacementData] = useState({
    isPlacementTest: false,
    targetLevel: ""
  });
  const [savingPlacement, setSavingPlacement] = useState(false);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await getAllQuizzes();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      showPopup(err.response?.data?.message || err.message || "Không thể tải danh sách bài kiểm tra", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemExamResults = async () => {
    try {
      setLoadingResults(true);
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.REACT_APP_API_URL;

      const res = await axios.get(`${API_URL}/api/admin/score-management/system-exams`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });

      setSystemExamResults(Array.isArray(res.data) ? res.data : []);
      setShowResultsModal(true);
    } catch (err) {
      console.error("Error fetching system exam results:", err);
      showPopup(err.response?.data?.message || err.message || "Không thể tải kết quả", "error");
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateQuiz = async () => {
    if (!newQuiz.title.trim()) {
      showPopup("Vui lòng nhập tên bài kiểm tra!", "error");
      return;
    }

    try {
      setCreating(true);

      // Payload da duoc loai bo hoan toan CourseID
      const payload = {
        title: newQuiz.title.trim(),
        description: newQuiz.description.trim(),
        quizType: Number(newQuiz.quizType),
        isActive: true
      };

      await createQuiz(payload);
      await fetchQuizzes();
      setShowCreateModal(false);
      setNewQuiz({
        title: "",
        description: "",
        quizType: 1,
      });
      showPopup("Tạo bài kiểm tra thành công!", "success");
    } catch (err) {
      console.error("Create quiz error:", err);
      
      let errorDetails = "";
      if (err.response && err.response.data) {
          const data = err.response.data;
          if (data.errors) {
              errorDetails = Object.entries(data.errors)
                  .map(([key, msgs]) => `- <b>${key}</b>: ${msgs.join(", ")}`)
                  .join("<br/>");
          } else {
              errorDetails = data.message || JSON.stringify(data);
          }
      } else {
          errorDetails = err.message;
      }

      Swal.fire({
          icon: 'error',
          title: 'Tạo thất bại',
          html: `
            <div style="text-align: left; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 10px; color: #dc2626;">
              ${errorDetails}
            </div>
            <p style="font-size: 14px; text-align: left; font-weight: 600;">Gợi ý sửa lỗi:</p>
            <ul style="font-size: 13px; text-align: left; padding-left: 20px;">
              <li>Mở file CreateQuizRequest (DTO) trong Visual Studio.</li>
              <li>Kiểm tra các trường bắt buộc, hãy đảm bảo C# không còn [Required] cho CourseId nữa.</li>
            </ul>
          `,
          confirmButtonColor: '#8b5cf6',
          confirmButtonText: 'Đã hiểu'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleOpenUpdateModal = (quiz) => {
    setUpdatingQuiz(quiz);
    setUpdateData({
      title: quiz.title || "",
      description: quiz.description || "",
      quizType: quiz.quizType || 1,
      isActive: quiz.isActive ?? true,
    });
    setShowUpdateModal(true);
  };

  const handleUpdateQuiz = async () => {
    if (!updateData.title.trim()) {
      showPopup("Vui lòng nhập tên bài kiểm tra!", "error");
      return;
    }

    try {
      setUpdating(true);
      const quizId = updatingQuiz.quizID || updatingQuiz.quizId;
      
      const payload = {
        title: updateData.title,
        description: updateData.description,
        quizType: updateData.quizType.toString(),
        isActive: updateData.isActive,
        groups: updatingQuiz.groups || updatingQuiz.questionGroups || []
      };

      await updateQuiz(quizId, payload);
      await fetchQuizzes();
      setShowUpdateModal(false);
      setUpdatingQuiz(null);
      showPopup("Cập nhật thành công!", "success");
    } catch (err) {
      console.error("Update quiz error:", err);
      showPopup(err.response?.data?.message || err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteQuiz(deleteTarget.quizID || deleteTarget.quizId);
      await fetchQuizzes();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      showPopup("Xóa thành công!", "success");
    } catch (err) {
      console.error("Delete quiz error:", err);
      showPopup(err.response?.data?.message || err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenPlacementModal = (quiz) => {
    setPlacementQuiz(quiz);
    setPlacementData({
      isPlacementTest: quiz.isPlacementTest || quiz.IsPlacementTest || false,
      targetLevel: quiz.targetLevel || quiz.TargetLevel || ""
    });
    setShowPlacementModal(true);
  };

  const handleSavePlacementTest = async () => {
    const parsedLevel = parseInt(placementData.targetLevel, 10);

    if (placementData.isPlacementTest && isNaN(parsedLevel)) {
      showPopup("Vui lòng nhập định dạng số nguyên cho Trình độ mục tiêu!", "error");
      return;
    }

    try {
      setSavingPlacement(true);
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.REACT_APP_API_URL;
      const quizId = placementQuiz.quizID || placementQuiz.quizId;

      const payload = {
        isPlacementTest: placementData.isPlacementTest === true,
        targetLevel: placementData.isPlacementTest ? parsedLevel : null
      };

      await axios.post(`${API_URL}/api/PlacementTest/admin/mark/${quizId}`, payload, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });

      setQuizzes(prevQuizzes => prevQuizzes.map(q => {
        if ((q.quizID || q.quizId) === quizId) {
          return {
            ...q,
            isPlacementTest: payload.isPlacementTest,
            targetLevel: payload.targetLevel,
            IsPlacementTest: payload.isPlacementTest,
            TargetLevel: payload.targetLevel
          };
        }
        return q;
      }));

      showPopup("Thiết lập đánh giá đầu vào thành công!", "success");
      setShowPlacementModal(false);
    } catch (err) {
      console.error("Placement error:", err);
      let errorMsg = "Lỗi khi thiết lập";
      
      if (err.response && err.response.data) {
          const errData = err.response.data;
          errorMsg = errData.message || errorMsg;
          if (errData.errors) {
              const firstKey = Object.keys(errData.errors)[0];
              errorMsg = errData.errors[firstKey][0];
          }
      } else if (err.message) {
          errorMsg = err.message;
      }

      showPopup(errorMsg, "error");
    } finally {
      setSavingPlacement(false);
    }
  };

  const getQuizTypeName = (type) => {
    const numType = typeof type === "string" ? parseInt(type, 10) : type;
    switch (numType) {
      case 1: return "Multiple Choice";
      case 2: return "Listening";
      case 3: return "Reading";
      case 4: return "Writing";
      case 5: return "Speaking";
      default: return "Unknown";
    }
  };

  const getQuizTypeColors = (type) => {
    const numType = typeof type === "string" ? parseInt(type, 10) : type;
    switch (numType) {
      case 1: return { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' }; 
      case 2: return { bg: 'rgba(236,72,153,0.12)', color: '#ec4899' }; 
      case 3: return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }; 
      case 4: return { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' }; 
      case 5: return { bg: 'rgba(0,200,150,0.12)', color: 'var(--primary)' }; 
      default: return { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải danh sách bài kiểm tra...</p>
      </div>
    );
  }

  return (
    <div className="management-card">
      <style>{`
        .swal2-container { z-index: 100000 !important; }
      `}</style>

      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 99999,
          background: toast.type === 'success' ? 'var(--primary)' : '#ec4899',
          color: '#fff', padding: '12px 24px', borderRadius: '99px',
          fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}

      <div className="management-card-header">
        <div>
          <h2 className="card-title">Quản lý Quiz/Exam</h2>
          <p className="card-description">
            Hệ thống đang có tổng số {quizzes.length} bài kiểm tra
          </p>
        </div>
      </div>

      <div className="management-header" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="secondary-button" onClick={fetchSystemExamResults} disabled={loadingResults}>
          {loadingResults ? (
            <div className="admin-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
          ) : (
            <BarChart3 size={18} />
          )}
          <span>Xem System Exam Results</span>
        </button>
        
        <div style={{ flexGrow: 1 }}></div>

        <button onClick={() => setShowCreateModal(true)} className="primary-button">
          <Plus size={18} />
          <span>Tạo Bài Kiểm Tra</span>
        </button>
      </div>

      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>ID</th>
              <th style={{ textAlign: 'center' }}>Tên Bài Kiểm Tra</th>
              <th style={{ textAlign: 'center' }}>Mô tả</th>
              <th style={{ textAlign: 'center' }}>Loại</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => {
                const quizId = quiz.quizID || quiz.quizId;
                const quizType = quiz.quizType ?? 0;
                const typeColors = getQuizTypeColors(quizType);
                const isPlacement = quiz.isPlacementTest || quiz.IsPlacementTest;

                return (
                  <tr key={quizId}>
                    <td className="fw-800" style={{ color: 'var(--primary)', textAlign: 'center' }}>#{quizId}</td>
                    <td className="fw-800 td-title" style={{ textAlign: 'center' }}>
                      {quiz.title}
                      {isPlacement && (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ fontSize: '0.7rem', background: '#8b5cf6', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block' }}>
                            Placement Test
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <p className="td-sub mb-0" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0 auto' }}>
                        {quiz.description || "—"}
                      </p>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-badge" style={{ backgroundColor: typeColors.bg, color: typeColors.color }}>
                        {getQuizTypeName(quizType)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        className="status-badge" 
                        style={{ 
                          backgroundColor: quiz.isActive ? 'rgba(0,200,150,0.12)' : 'rgba(107,114,128,0.12)', 
                          color: quiz.isActive ? 'var(--primary)' : '#6b7280' 
                        }}
                      >
                        {quiz.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button
                          className="action-button"
                          title="Xem chi tiết"
                          onClick={() => navigate(`/admin/examdetail/${quizId}`)}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="action-button"
                          title="Sửa bài kiểm tra"
                          onClick={() => handleOpenUpdateModal(quiz)}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="action-button"
                          title="Thiết lập Placement Test"
                          onClick={() => handleOpenPlacementModal(quiz)}
                          style={{ color: '#8b5cf6' }}
                        >
                          <Target size={18} />
                        </button>
                        <button
                          className="action-button"
                          title="Xóa bài kiểm tra"
                          onClick={() => {
                            setDeleteTarget(quiz);
                            setShowDeleteModal(true);
                          }}
                          style={{ color: '#ec4899' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6">
                  <div className="admin-empty-data" style={{ padding: '3rem 0', flexDirection: 'column', gap: '1rem' }}>
                    <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
                    <span>Chưa có bài kiểm tra nào. Nhấn "Tạo Bài Kiểm Tra" để bắt đầu!</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="management-modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Tạo Bài Kiểm Tra</h3>
            </div>
            
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên Bài Kiểm Tra *</label>
                <input
                  type="text"
                  placeholder="Nhập tên bài kiểm tra..."
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả (tùy chọn)..."
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Loại Quiz</label>
                <select
                  value={newQuiz.quizType}
                  onChange={(e) => setNewQuiz({ ...newQuiz, quizType: parseInt(e.target.value) })}
                  className="form-select"
                >
                  <option value={1}>Multiple Choice (Trắc nghiệm)</option>
                  <option value={2}>Listening</option>
                  <option value={3}>Reading</option>
                  <option value={4}>Writing</option>
                  <option value={5}>Speaking</option>
                </select>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowCreateModal(false)} className="secondary-button" disabled={creating} style={{ marginRight: '1rem' }}>
                Hủy
              </button>
              <button onClick={handleCreateQuiz} className="primary-button" disabled={creating || !newQuiz.title.trim()}>
                {creating ? "Đang tạo..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div className="management-modal-overlay" onClick={() => !updating && setShowUpdateModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Cập nhật Bài Kiểm Tra</h3>
            </div>
            
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên Bài Kiểm Tra *</label>
                <input
                  type="text"
                  placeholder="Nhập tên bài kiểm tra..."
                  value={updateData.title}
                  onChange={(e) => setUpdateData({ ...updateData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả (tùy chọn)..."
                  value={updateData.description}
                  onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Loại Quiz</label>
                <select
                  value={updateData.quizType}
                  onChange={(e) => setUpdateData({ ...updateData, quizType: parseInt(e.target.value) })}
                  className="form-select"
                >
                  <option value={1}>Multiple Choice (Trắc nghiệm)</option>
                  <option value={2}>Listening</option>
                  <option value={3}>Reading</option>
                  <option value={4}>Writing</option>
                  <option value={5}>Speaking</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="quiz-active-switch"
                  checked={updateData.isActive}
                  onChange={(e) => setUpdateData({ ...updateData, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="quiz-active-switch" style={{ fontWeight: 800, color: 'var(--text-dark)', cursor: 'pointer' }}>
                  Cho phép hoạt động
                </label>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowUpdateModal(false)} className="secondary-button" disabled={updating} style={{ marginRight: '1rem' }}>
                Hủy
              </button>
              <button onClick={handleUpdateQuiz} className="primary-button" disabled={updating || !updateData.title.trim()}>
                {updating ? "Đang cập nhật..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="management-modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: '#ec4899' }}>Xác nhận xóa</h3>
            </div>
            
            <div className="modal-body-custom">
              <div style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', padding: '1.5rem', borderRadius: '12px', color: '#be185d' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Bạn có chắc chắn muốn xóa bài kiểm tra này?</p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900 }}>"{deleteTarget?.title}"</p>
                <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: 600 }}>Tất cả nhóm và câu hỏi bên trong sẽ bị xóa vĩnh viễn! Hành động này không thể hoàn tác!</p>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowDeleteModal(false)} className="secondary-button" disabled={deleting} style={{ marginRight: '1rem' }}>
                Hủy
              </button>
              <button onClick={handleDeleteQuiz} className="primary-button" style={{ background: '#ec4899', boxShadow: '0 4px 15px rgba(236,72,153,0.3)' }} disabled={deleting}>
                {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlacementModal && (
        <div className="management-modal-overlay" onClick={() => !savingPlacement && setShowPlacementModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: '#8b5cf6' }}>Thiết lập Bài Đánh Giá</h3>
            </div>
            
            <div className="modal-body-custom">
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#6d28d9' }}>Bài kiểm tra: {placementQuiz?.title}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="is-placement-switch"
                  checked={placementData.isPlacementTest}
                  onChange={(e) => setPlacementData({ ...placementData, isPlacementTest: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8b5cf6' }}
                />
                <label htmlFor="is-placement-switch" style={{ fontWeight: 800, color: 'var(--text-dark)', cursor: 'pointer' }}>
                  Sử dụng làm bài kiểm tra đầu vào (Placement Test)
                </label>
              </div>

              {placementData.isPlacementTest && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Trình độ mục tiêu (Target Level)</label>
                  <input
                    type="text"
                    placeholder="Nhập ID cấp độ..."
                    value={placementData.targetLevel}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPlacementData({ ...placementData, targetLevel: val });
                    }}
                    className="form-input"
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>
                    Nhập trình độ mục tiêu bằng số (Ví dụ: ID của khóa học được đề xuất).
                  </small>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowPlacementModal(false)} className="secondary-button" disabled={savingPlacement} style={{ marginRight: '1rem' }}>
                Hủy
              </button>
              <button 
                onClick={handleSavePlacementTest} 
                className="primary-button" 
                style={{ background: '#8b5cf6', borderColor: '#8b5cf6', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }} 
                disabled={savingPlacement}
              >
                {savingPlacement ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultsModal && (
        <div className="management-modal-overlay" onClick={() => setShowResultsModal(false)}>
          <div className="management-modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={24} style={{ color: 'var(--primary)' }} /> Lịch sử làm bài thi
              </h3>
            </div>
            
            <div className="modal-body-custom" style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
              {systemExamResults.length > 0 ? (
                <>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '1rem', borderRadius: '12px', fontWeight: 800, marginBottom: '1.5rem' }}>
                    Tổng số bài thi đã ghi nhận: {systemExamResults.length}
                  </div>
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>Mã lượt thi</th>
                        <th style={{ textAlign: 'center' }}>Mã bài</th>
                        <th style={{ textAlign: 'center' }}>Tên bài kiểm tra</th>
                        <th style={{ textAlign: 'center' }}>Mã HV</th>
                        <th style={{ textAlign: 'center' }}>Học viên</th>
                        <th style={{ textAlign: 'center' }}>Điểm</th>
                        <th style={{ textAlign: 'center' }}>Ngày nộp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemExamResults.map((result, index) => (
                        <tr key={`${result.attemptId}-${index}`}>
                          <td className="fw-800" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>#{result.attemptId}</td>
                          <td className="fw-800" style={{ color: 'var(--primary)', textAlign: 'center' }}>#{result.quizId}</td>
                          <td style={{ textAlign: 'center' }}>
                            <p className="td-title fw-800 mb-0" style={{ margin: '0 auto' }}>{result.quizTitle}</p>
                            <p className="td-sub mb-0" style={{ margin: '0 auto' }}>{result.courseName}</p>
                          </td>
                          <td className="fw-700" style={{ textAlign: 'center' }}>{result.userId}</td>
                          <td className="fw-800" style={{ textAlign: 'center' }}>{result.userName}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span 
                              className="status-badge" 
                              style={{ 
                                backgroundColor: result.score >= 50 ? 'rgba(0,200,150,0.12)' : 'rgba(236,72,153,0.12)', 
                                color: result.score >= 50 ? 'var(--primary)' : '#ec4899',
                                fontSize: '0.85rem'
                              }}
                            >
                              {result.score} đ
                            </span>
                          </td>
                          <td className="fw-600" style={{ textAlign: 'center' }}>{new Date(result.attemptDate).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="admin-empty-data" style={{ padding: '3rem 0', flexDirection: 'column', gap: '1rem' }}>
                  <BarChart3 size={48} style={{ color: 'var(--text-muted)' }} />
                  <span>Chưa có dữ liệu nào được ghi nhận.</span>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button className="secondary-button" onClick={() => setShowResultsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamManagement;