import { useState, useEffect } from "react";
import { Eye, Trash, X } from "lucide-react";
import { getAllCourses, deleteCourse, getCourseDetail } from "../../middleware/admin/courseManagementAPI";
import "./management-styles.scss";

export function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // 📦 Tải danh sách khóa học
  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
      showPopup("Không thể tải danh sách khóa học", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // 👁️ Xem chi tiết khóa học
  const handleViewCourse = async (courseId) => {
    try {
      setIsLoadingDetail(true);
      setIsModalOpen(true);
      const data = await getCourseDetail(courseId);
      setSelectedCourse(data);
    } catch (error) {
      console.error("Error loading course detail:", error);
      showPopup("Không thể tải thông tin chi tiết", "error");
      setIsModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 🗑️ Xóa khóa học
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Bạn có chắc muốn xóa khóa học này không?")) return;
    try {
      await deleteCourse(courseId);
      showPopup("Đã xóa khóa học thành công", "success");
      setCourses((prev) => prev.filter((c) => c.courseID !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
      showPopup("Không thể xóa khóa học", "error");
    }
  };

  // 🚪 Đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  if (isLoading) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải dữ liệu khóa học...</p>
      </div>
    );
  }

  return (
    <div className="management-page-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="management-card">
        <div className="management-card-header">
          <h2 className="card-title">Quản lý khóa học</h2>
          <p className="card-description">Tổng số: {courses.length} khóa học</p>
        </div>

        <div className="management-card-content">
          <table className="management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên khóa học</th>
                <th>Mô tả</th>
                <th>Giảng viên</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.courseID}>
                  <td>{course.courseID}</td>
                  <td className="font-bold">{course.courseName}</td>
                  <td>{course.courseDescription}</td>
                  <td>{course.teacherName}</td>
                  <td>{new Date(course.createAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        className="action-button view-button"
                        onClick={() => handleViewCourse(course.courseID)}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() => handleDeleteCourse(course.courseID)}
                        title="Xóa khóa học"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {courses.length === 0 && (
            <div className="empty-state">
              <p>Không có khóa học nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal chi tiết khóa học */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết khóa học</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {isLoadingDetail ? (
                <div className="modal-loading">
                  <div className="admin-spinner"></div>
                  <p>Đang tải thông tin...</p>
                </div>
              ) : selectedCourse ? (
                <div className="course-detail">
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedCourse.courseID}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tên khóa học:</span>
                    <span className="detail-value">{selectedCourse.courseName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mô tả:</span>
                    <span className="detail-value">{selectedCourse.description}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Giảng viên:</span>
                    <span className="detail-value">{selectedCourse.teacher?.teacherName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">ID Giảng viên:</span>
                    <span className="detail-value">{selectedCourse.teacher?.teacherID || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Số chương:</span>
                    <span className="detail-value">{selectedCourse.chapters?.length || 0} chương</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Số video:</span>
                    <span className="detail-value">{selectedCourse.videos?.length || 0} video</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Số quiz:</span>
                    <span className="detail-value">{selectedCourse.quizzes?.length || 0} quiz</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ngày tạo:</span>
                    <span className="detail-value">
                      {new Date(selectedCourse.createAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {selectedCourse.updateAt && (
                    <div className="detail-row">
                      <span className="detail-label">Cập nhật lần cuối:</span>
                      <span className="detail-value">
                        {new Date(selectedCourse.updateAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}

                  {/* Danh sách Chapters */}
                  {selectedCourse.chapters && selectedCourse.chapters.length > 0 && (
                    <div className="detail-section">
                      <h6 className="section-title">Danh sách chương</h6>
                      <div className="chapters-list">
                        {selectedCourse.chapters.map((chapter, index) => (
                          <div key={chapter.chapterID || index} className="chapter-item">
                            <span className="chapter-number">{index + 1}.</span>
                            <span className="chapter-name">{chapter.chapterName || chapter.title || 'Chương không có tên'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Danh sách Quizzes */}
                  {selectedCourse.quizzes && selectedCourse.quizzes.length > 0 && (
                    <div className="detail-section">
                      <h6 className="section-title">Danh sách quiz</h6>
                      <div className="quizzes-list">
                        {selectedCourse.quizzes.map((quiz, index) => (
                          <div key={quiz.quizID || index} className="quiz-item">
                            <span className="quiz-number">{index + 1}.</span>
                            <span className="quiz-name">{quiz.quizTitle || quiz.title || 'Quiz không có tên'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted">Không có dữ liệu</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseManagement;