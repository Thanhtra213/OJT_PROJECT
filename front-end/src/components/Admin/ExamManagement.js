import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getAllQuizzes, 
  createQuiz, 
  deleteQuiz, 
  updateQuiz 
} from "../../middleware/admin/quizManagementAPI";
import { Eye, Trash2, Plus, BookOpen, BarChart3, Edit2, X, RefreshCw } from "lucide-react";
import "./admin-dashboard-styles.scss";

export function ExamManagement() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Create Quiz Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    courseID: 0,
    title: "",
    description: "",
    quizType: 1,
  });
  const [creating, setCreating] = useState(false);

  // Update Quiz Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingQuiz, setUpdatingQuiz] = useState(null);
  const [updateData, setUpdateData] = useState({
    title: "",
    description: "",
    quizType: 1,
    isActive: true,
  });
  const [updating, setUpdating] = useState(false);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // System Exam Results Modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [systemExamResults, setSystemExamResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await getAllQuizzes();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching quizzes:", err);
      showPopup(err.response?.data?.message || err.message || "Không thể tải danh sách quiz", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemExamResults = async () => {
    try {
      setLoadingResults(true);
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.REACT_APP_API_URL;

      const response = await fetch(`${API_URL}/api/admin/score-management/system-exams`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSystemExamResults(Array.isArray(data) ? data : []);
      setShowResultsModal(true);
    } catch (err) {
      console.error("❌ Error fetching system exam results:", err);
      showPopup(err.message || "Không thể tải kết quả system exam", "error");
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
      showPopup("Vui lòng nhập tên quiz!", "error");
      return;
    }

    try {
      setCreating(true);
      await createQuiz(newQuiz);
      await fetchQuizzes();
      setShowCreateModal(false);
      setNewQuiz({
        courseID: 0,
        title: "",
        description: "",
        quizType: 1,
      });
      showPopup("Tạo quiz thành công!", "success");
    } catch (err) {
      console.error("❌ Create quiz error:", err);
      showPopup(err.response?.data?.message || err.message, "error");
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
      showPopup("Vui lòng nhập tên quiz!", "error");
      return;
    }

    try {
      setUpdating(true);
      const quizId = updatingQuiz.quizID || updatingQuiz.quizId;
      
      const payload = {
        title: updateData.title,
        description: updateData.description,
        quizType: updateData.quizType,
        isActive: updateData.isActive,
        groups: updatingQuiz.groups || updatingQuiz.questionGroups || []
      };

      await updateQuiz(quizId, payload);
      await fetchQuizzes();
      setShowUpdateModal(false);
      setUpdatingQuiz(null);
      showPopup("Cập nhật quiz thành công!", "success");
    } catch (err) {
      console.error("❌ Update quiz error:", err);
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
      showPopup("Xóa quiz thành công!", "success");
    } catch (err) {
      console.error("❌ Delete quiz error:", err);
      showPopup(err.response?.data?.message || err.message, "error");
    } finally {
      setDeleting(false);
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
      case 1: return { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' }; // Blue
      case 2: return { bg: 'rgba(236,72,153,0.12)', color: '#ec4899' }; // Pink
      case 3: return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }; // Amber
      case 4: return { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' }; // Gray
      case 5: return { bg: 'rgba(0,200,150,0.12)', color: 'var(--primary)' }; // Mint
      default: return { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải danh sách quiz...</p>
      </div>
    );
  }

  return (
    <div className="management-card">
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? 'var(--mint)' : '#ec4899',
          color: '#fff', padding: '12px 24px', borderRadius: '99px',
          fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="management-card-header">
        <div>
          <h2 className="card-title">Quản lý Quiz/Exam</h2>
          <p className="card-description">
            Hệ thống đang có tổng số {quizzes.length} bài kiểm tra
          </p>
        </div>
      </div>

      {/* Toolbar */}
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
          <span>Tạo Quiz Mới</span>
        </button>
      </div>

      {/* Table Data */}
      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Quiz</th>
              <th>Mô tả</th>
              <th>Loại</th>
              <th style={{ textAlign: 'center' }}>Course ID</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => {
                const quizId = quiz.quizID || quiz.quizId;
                const quizType = quiz.quizType ?? 0;
                const typeColors = getQuizTypeColors(quizType);

                return (
                  <tr key={quizId}>
                    <td className="fw-800" style={{ color: 'var(--primary)' }}>#{quizId}</td>
                    <td className="fw-800 td-title">{quiz.title}</td>
                    <td>
                      <p className="td-sub mb-0" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {quiz.description || "—"}
                      </p>
                    </td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: typeColors.bg, color: typeColors.color }}>
                        {getQuizTypeName(quizType)}
                      </span>
                    </td>
                    <td className="fw-700" style={{ textAlign: 'center' }}>
                      {quiz.courseID || "—"}
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
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="action-button"
                        title="Xem chi tiết"
                        onClick={() => navigate(`/admin/examdetail/${quizId}`)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="action-button"
                        title="Sửa quiz"
                        onClick={() => handleOpenUpdateModal(quiz)}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="action-button"
                        title="Xóa quiz"
                        onClick={() => {
                          setDeleteTarget(quiz);
                          setShowDeleteModal(true);
                        }}
                        style={{ color: '#ec4899', marginLeft: '4px' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="admin-empty-data" style={{ padding: '3rem 0', flexDirection: 'column', gap: '1rem' }}>
                    <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
                    <span>Chưa có quiz nào. Nhấn "Tạo Quiz Mới" để bắt đầu!</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════
          MODAL: TẠO QUIZ MỚI
      ════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="management-modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Tạo Quiz Mới</h3>
              {/* <button className="action-button" onClick={() => setShowCreateModal(false)} disabled={creating}>
                <X size={20} />
              </button> */}
            </div>
            
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên Quiz *</label>
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

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Course ID (Mã khóa học)</label>
                <input
                  type="number"
                  placeholder="Nhập mã khóa học (hoặc để 0)..."
                  value={newQuiz.courseID}
                  onChange={(e) => setNewQuiz({ ...newQuiz, courseID: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>Để 0 nếu quiz không thuộc khóa học nào.</small>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowCreateModal(false)} className="secondary-button" disabled={creating} style={{ marginRight: '1rem' }}>
                Hủy
              </button>
              <button onClick={handleCreateQuiz} className="primary-button" disabled={creating || !newQuiz.title.trim()}>
                {creating ? "Đang tạo..." : "Tạo Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL: CẬP NHẬT QUIZ
      ════════════════════════════════════════════ */}
      {showUpdateModal && (
        <div className="management-modal-overlay" onClick={() => !updating && setShowUpdateModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Cập nhật Quiz</h3>
              {/* <button className="action-button" onClick={() => setShowUpdateModal(false)} disabled={updating}>
                <X size={20} />
              </button> */}
            </div>
            
            <div className="modal-body-custom">
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tên Quiz *</label>
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
                  Quiz đang hoạt động
                </label>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowUpdateModal(false)} className="secondary-button" disabled={updating} style={{ marginRight: '1rem' }}>
                Hủy
              </button>
              <button onClick={handleUpdateQuiz} className="primary-button" disabled={updating || !updateData.title.trim()}>
                {updating ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL: XÓA QUIZ (XÁC NHẬN)
      ════════════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="management-modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: '#ec4899' }}>⚠️ Xác nhận xóa</h3>
              {/* <button className="action-button" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                <X size={20} />
              </button> */}
            </div>
            
            <div className="modal-body-custom">
              <div style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', padding: '1.5rem', borderRadius: '12px', color: '#be185d' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Bạn có chắc chắn muốn xóa quiz này?</p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900 }}>"{deleteTarget?.title}"</p>
                <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: 600 }}>Tất cả groups và câu hỏi sẽ bị xóa vĩnh viễn! Hành động này không thể hoàn tác!</p>
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

      {/* ════════════════════════════════════════════
          MODAL: KẾT QUẢ SYSTEM EXAM
      ════════════════════════════════════════════ */}
      {showResultsModal && (
        <div className="management-modal-overlay" onClick={() => setShowResultsModal(false)}>
          <div className="management-modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={24} style={{ color: 'var(--primary)' }} /> System Exam Results
              </h3>
              {/* <button className="action-button" onClick={() => setShowResultsModal(false)}>
                <X size={20} />
              </button> */}
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
                        <th>Attempt ID</th>
                        <th>Quiz ID</th>
                        <th>Quiz Title</th>
                        <th style={{ textAlign: 'center' }}>User ID</th>
                        <th>User Name</th>
                        <th style={{ textAlign: 'center' }}>Score</th>
                        <th>Attempt Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemExamResults.map((result, index) => (
                        <tr key={`${result.attemptId}-${index}`}>
                          <td className="fw-800" style={{ color: 'var(--text-muted)' }}>#{result.attemptId}</td>
                          <td className="fw-800" style={{ color: 'var(--primary)' }}>#{result.quizId}</td>
                          <td>
                            <p className="td-title fw-800 mb-0">{result.quizTitle}</p>
                            <p className="td-sub mb-0">{result.courseName}</p>
                          </td>
                          <td className="fw-700" style={{ textAlign: 'center' }}>{result.userId}</td>
                          <td className="fw-800">{result.userName}</td>
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
                          <td className="fw-600">{new Date(result.attemptDate).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="admin-empty-data" style={{ padding: '3rem 0', flexDirection: 'column', gap: '1rem' }}>
                  <BarChart3 size={48} style={{ color: 'var(--text-muted)' }} />
                  <span>Chưa có kết quả System Exam nào được ghi nhận.</span>
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