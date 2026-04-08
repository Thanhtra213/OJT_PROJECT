import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash, X, RefreshCw, Search } from "lucide-react";
import { getAllCourses, deleteCourse, getCourseDetail } from "../../middleware/admin/courseManagementAPI";
import { getQuizzesByCourse } from "../../middleware/QuizAPI";
import "./admin-dashboard-styles.scss";

export function CourseManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [quizCount, setQuizCount] = useState(0);

  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCourses();
      setCourses(data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      showPopup("Không thể tải danh sách khóa học", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCourses = courses.filter((course) => {
    const q = searchQuery.toLowerCase();
    return (
      course.courseName?.toLowerCase().includes(q) ||
      course.teacherName?.toLowerCase().includes(q) ||
      course.courseID?.toString().includes(q) ||
      course.courseDescription?.toLowerCase().includes(q)
    );
  });

  const handleViewCourse = async (courseId) => {
    try {
      setIsLoadingDetail(true);
      setIsModalOpen(true);
      setQuizCount(0); 

      const data = await getCourseDetail(courseId);
      setSelectedCourse({ ...data, _fallbackId: courseId });

      let count = data.quizzes?.length || 0;
      if (count === 0 && data.chapters) {
          count = data.chapters.reduce((sum, ch) => sum + (ch.quizzes?.length || 0), 0);
      }
      
      if (count === 0) {
        try {
          const quizRes = await getQuizzesByCourse(courseId);
          const quizzes = Array.isArray(quizRes?.data || quizRes) ? (quizRes?.data || quizRes) : [];
          count = quizzes.length;
        } catch (quizErr) {
          console.error("Không thể lấy số lượng quiz (Do Backend chặn Admin):", quizErr);
        }
      }
      setQuizCount(count);

    } catch (error) {
      console.error("Error loading course detail:", error);
      showPopup("Không thể tải thông tin chi tiết", "error");
      setIsModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

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
    <div className="management-card">
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#00c896' : '#ec4899',
          color: '#fff', padding: '12px 24px', borderRadius: '99px',
          fontWeight: 700, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}

      <div className="management-card-header">
        <div>
          <h2 className="card-title">Quản lý khóa học</h2>
          <p className="card-description">
            Hiển thị {filteredCourses.length} trên tổng số {courses.length} khóa học
          </p>
        </div>
      </div>

      <div className="management-header">
        <div className="search-bar" style={{ width: '320px' }}>
           <Search size={18} style={{ color: 'var(--text-muted)' }} />
           <input 
             type="text" 
             placeholder="Tìm tên KH, giảng viên, mã KH..." 
             className="search-input" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        <button className="secondary-button" onClick={loadCourses}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Khóa học</th>
              <th>Mô tả ngắn</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.courseID}>
                  <td className="fw-800" style={{ color: 'var(--primary)' }}>
                    {course.courseID ? `#${course.courseID}` : ""}
                  </td>
                  <td>
                    <p className="td-title fw-800 mb-0">{course.courseName}</p>
                    <p className="td-sub mb-0">{course.teacherName ? `GV: ${course.teacherName}` : ""}</p>
                  </td>
                  <td>
                    <p className="td-sub mb-0" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.courseDescription || ""}
                    </p>
                  </td>
                  <td className="fw-600">{new Date(course.createAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="action-button"
                      onClick={() => handleViewCourse(course.courseID)}
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => handleDeleteCourse(course.courseID)}
                      title="Xóa khóa học"
                      style={{ color: '#ec4899', marginLeft: '8px' }}
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className="admin-empty-data" style={{ padding: '3rem 0' }}>
                    Không tìm thấy khóa học nào phù hợp.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="management-modal-overlay" onClick={handleCloseModal}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Chi tiết khóa học</h3>
            </div>

            <div className="modal-body-custom" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              {isLoadingDetail ? (
                <div className="admin-loading-spinner" style={{ minHeight: '20vh' }}>
                  <div className="admin-spinner"></div>
                  <p>Đang tải thông tin...</p>
                </div>
              ) : selectedCourse ? (
                <>
                  <div className="info-row">
                    <span className="info-label">Mã khóa học:</span>
                    <span className="info-val" style={{ color: 'var(--primary)' }}>
                      #{selectedCourse.courseID || selectedCourse.id || selectedCourse._fallbackId || ""}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tên khóa học:</span>
                    <span className="info-val">{selectedCourse.courseName || ""}</span>
                  </div>
                  <div className="info-row" style={{ alignItems: 'flex-start' }}>
                    <span className="info-label">Mô tả:</span>
                    <span className="info-val" style={{ lineHeight: '1.5' }}>{selectedCourse.description || ""}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Giảng viên:</span>
                    <span className="info-val">
                      {selectedCourse.teacher?.teacherName || ""}
                      {selectedCourse.teacher?.teacherID ? ` (ID: ${selectedCourse.teacher.teacherID})` : ""}
                    </span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Thống kê:</span>
                    <span className="info-val">
                      {selectedCourse.chapters?.length || 0} chương • {' '}
                      {selectedCourse.chapters?.reduce((sum, ch) => sum + (ch.videos?.length || 0), 0) || 0} video • {' '}
                      <span style={{color: 'var(--primary)', fontWeight: 800}}>{quizCount}</span> bài luyện tập
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Ngày tạo:</span>
                    <span className="info-val">{new Date(selectedCourse.createAt || selectedCourse.createdAt).toLocaleString('vi-VN')}</span>
                  </div>

                  {selectedCourse.chapters && selectedCourse.chapters.length > 0 && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-dark)' }}>Danh sách chương</h4>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-body)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedCourse.chapters.map((chapter, index) => (
                          <li key={chapter.chapterID || index}>
                            {chapter.chapterName || chapter.title || ""}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px', fontWeight: 500 }}>
                              ({chapter.videos?.length || 0} video)
                            </span>
                            {chapter.videos && chapter.videos.length > 0 && (
                               <ul style={{ paddingLeft: '1rem', marginTop: '6px', listStyleType: 'circle', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  {chapter.videos.map(vid => (
                                     <li key={vid.videoID || vid.videoId} style={{ marginBottom: '4px' }}>
                                        {vid.videoName}
                                     </li>
                                  ))}
                               </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="admin-empty-data">Không thể tải dữ liệu chi tiết.</div>
              )}
            </div>
            
            {/* --- NÚT TRẢI NGHIỆM NHƯ HỌC VIÊN --- */}
            {selectedCourse && (
              <div className="modal-foot">
                <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={handleCloseModal}>
                  Đóng
                </button>
                <button 
                  className="primary-button" 
                  onClick={() => navigate(`/course/${selectedCourse.courseID || selectedCourse.id || selectedCourse._fallbackId}`)}
                >
                  <Eye size={16} style={{marginRight: '8px'}} /> Xem chi tiết toàn bộ khóa học
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseManagement;