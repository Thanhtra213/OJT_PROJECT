import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash, X, RefreshCw, Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { getAllCourses, deleteCourse, getCourseDetail } from "../../middleware/admin/courseManagementAPI";
import { getQuizById } from "../../middleware/admin/quizManagementAPI";
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
  const [quizzes, setQuizzes] = useState([]);

  // Quiz detail modal state
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

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
      setQuizzes([]);
      setQuizCount(0);

      const data = await getCourseDetail(courseId);
      setSelectedCourse({ ...data, _fallbackId: courseId });

      // Lấy quiz từ detail trả về (không gọi API bị chặn nữa)
      let courseQuizzes = data.quizzes || [];
      let count = courseQuizzes.length;

      if (count === 0 && data.chapters) {
        count = data.chapters.reduce((sum, ch) => sum + (ch.quizzes?.length || 0), 0);
        courseQuizzes = data.chapters.flatMap((ch) => ch.quizzes || []);
      }

      setQuizCount(count);
      setQuizzes(courseQuizzes);
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
    setQuizzes([]);
    setQuizCount(0);
  };

  // Mở modal xem chi tiết quiz (view only, không start)
  const handleViewQuizDetail = async (quizId) => {
    try {
      setIsLoadingQuiz(true);
      setIsQuizModalOpen(true);
      setExpandedGroups({});
      const data = await getQuizById(quizId);
      setSelectedQuiz(data);
    } catch (error) {
      console.error("Error loading quiz detail:", error);
      showPopup("Không thể tải chi tiết bài quiz", "error");
      setIsQuizModalOpen(false);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleCloseQuizModal = () => {
    setIsQuizModalOpen(false);
    setSelectedQuiz(null);
    setExpandedGroups({});
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getQuizTypeLabel = (type) => {
    if (type === 1 || type === "1") return "Trắc nghiệm";
    if (type === 2 || type === "2") return "Điền vào chỗ trống";
    if (type === 3 || type === "3") return "Tự luận";
    return "Hỗn hợp";
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
        <div
          style={{
            position: "fixed", top: "20px", right: "20px", zIndex: 9999,
            background: toast.type === "success" ? "#00c896" : "#ec4899",
            color: "#fff", padding: "12px 24px", borderRadius: "99px",
            fontWeight: 700, boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}
        >
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
        <div className="search-bar" style={{ width: "320px" }}>
          <Search size={18} style={{ color: "var(--text-muted)" }} />
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
              <th style={{ textAlign: "right" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.courseID}>
                  <td className="fw-800" style={{ color: "var(--primary)" }}>
                    {course.courseID ? `#${course.courseID}` : ""}
                  </td>
                  <td>
                    <p className="td-title fw-800 mb-0">{course.courseName}</p>
                    <p className="td-sub mb-0">
                      {course.teacherName ? `GV: ${course.teacherName}` : ""}
                    </p>
                  </td>
                  <td>
                    <p
                      className="td-sub mb-0"
                      style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {course.courseDescription || ""}
                    </p>
                  </td>
                  <td className="fw-600">
                    {new Date(course.createAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={{ textAlign: "right" }}>
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
                      style={{ color: "#ec4899", marginLeft: "8px" }}
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className="admin-empty-data" style={{ padding: "3rem 0" }}>
                    Không tìm thấy khóa học nào phù hợp.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL CHI TIẾT KHÓA HỌC ===== */}
      {isModalOpen && (
        <div className="management-modal-overlay" onClick={handleCloseModal}>
          <div className="management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Chi tiết khóa học</h3>
            </div>

            <div
              className="modal-body-custom"
              style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
            >
              {isLoadingDetail ? (
                <div className="admin-loading-spinner" style={{ minHeight: "20vh" }}>
                  <div className="admin-spinner"></div>
                  <p>Đang tải thông tin...</p>
                </div>
              ) : selectedCourse ? (
                <>
                  <div className="info-row">
                    <span className="info-label">Mã khóa học:</span>
                    <span className="info-val" style={{ color: "var(--primary)" }}>
                      #{selectedCourse.courseID || selectedCourse.id || selectedCourse._fallbackId || ""}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tên khóa học:</span>
                    <span className="info-val">{selectedCourse.courseName || ""}</span>
                  </div>
                  <div className="info-row" style={{ alignItems: "flex-start" }}>
                    <span className="info-label">Mô tả:</span>
                    <span className="info-val" style={{ lineHeight: "1.5" }}>
                      {selectedCourse.description || ""}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Giảng viên:</span>
                    <span className="info-val">
                      {selectedCourse.teacher?.teacherName || ""}
                      {selectedCourse.teacher?.teacherID
                        ? ` (ID: ${selectedCourse.teacher.teacherID})`
                        : ""}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Thống kê:</span>
                    <span className="info-val">
                      {selectedCourse.chapters?.length || 0} chương •{" "}
                      {selectedCourse.chapters?.reduce(
                        (sum, ch) => sum + (ch.videos?.length || 0), 0
                      ) || 0}{" "}
                      video •{" "}
                      <span style={{ color: "var(--primary)", fontWeight: 800 }}>
                        {quizCount}
                      </span>{" "}
                      bài luyện tập
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Ngày tạo:</span>
                    <span className="info-val">
                      {new Date(
                        selectedCourse.createAt || selectedCourse.createdAt
                      ).toLocaleString("vi-VN")}
                    </span>
                  </div>

                  {/* Danh sách chương */}
                  {selectedCourse.chapters && selectedCourse.chapters.length > 0 && (
                    <div
                      style={{
                        marginTop: "1.5rem", paddingTop: "1rem",
                        borderTop: "1px dashed var(--border)",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.95rem", fontWeight: 800,
                          marginBottom: "0.75rem", color: "var(--text-dark)",
                        }}
                      >
                        Danh sách chương
                      </h4>
                      <ul
                        style={{
                          paddingLeft: "1.2rem", margin: 0,
                          color: "var(--text-body)", fontWeight: 600,
                          fontSize: "0.9rem", display: "flex",
                          flexDirection: "column", gap: "8px",
                        }}
                      >
                        {selectedCourse.chapters.map((chapter, index) => (
                          <li key={chapter.chapterID || index}>
                            {chapter.chapterName || chapter.title || ""}
                            <span
                              style={{
                                color: "var(--text-muted)", fontSize: "0.8rem",
                                marginLeft: "8px", fontWeight: 500,
                              }}
                            >
                              ({chapter.videos?.length || 0} video)
                            </span>
                            {chapter.videos && chapter.videos.length > 0 && (
                              <ul
                                style={{
                                  paddingLeft: "1rem", marginTop: "6px",
                                  listStyleType: "circle", color: "var(--text-muted)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {chapter.videos.map((vid) => (
                                  <li
                                    key={vid.videoID || vid.videoId}
                                    style={{ marginBottom: "4px" }}
                                  >
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

                  {/* ===== DANH SÁCH QUIZ (VIEW ONLY) ===== */}
                  {quizzes && quizzes.length > 0 && (
                    <div
                      style={{
                        marginTop: "1.5rem", paddingTop: "1rem",
                        borderTop: "1px dashed var(--border)",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.95rem", fontWeight: 800,
                          marginBottom: "0.75rem", color: "var(--text-dark)",
                          display: "flex", alignItems: "center", gap: "8px",
                        }}
                      >
                        <BookOpen size={16} style={{ color: "var(--primary)" }} />
                        Bài luyện tập ({quizzes.length})
                      </h4>
                      <ul
                        style={{
                          paddingLeft: 0, margin: 0, listStyle: "none",
                          display: "flex", flexDirection: "column", gap: "8px",
                        }}
                      >
                        {quizzes.map((quiz, index) => (
                          <li
                            key={quiz.quizID || quiz.quizId || index}
                            style={{
                              display: "flex", alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              background: "var(--bg-soft)",
                              borderRadius: "8px",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span
                                style={{
                                  fontWeight: 700, fontSize: "0.9rem",
                                  color: "var(--text-dark)",
                                }}
                              >
                                {quiz.title || `Quiz #${quiz.quizID || quiz.quizId}`}
                              </span>
                              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                {getQuizTypeLabel(quiz.quizType)} •{" "}
                                <span
                                  style={{
                                    color: quiz.isActive ? "#059669" : "#dc2626",
                                    fontWeight: 600,
                                  }}
                                >
                                  {quiz.isActive ? "Đang hoạt động" : "Không hoạt động"}
                                </span>
                              </span>
                            </div>
                            <button
                              className="action-button"
                              onClick={() =>
                                handleViewQuizDetail(quiz.quizID || quiz.quizId)
                              }
                              title="Xem nội dung quiz"
                              style={{
                                display: "flex", alignItems: "center",
                                gap: "4px", fontSize: "0.8rem", whiteSpace: "nowrap",
                              }}
                            >
                              <Eye size={15} /> Xem
                            </button>
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

            {selectedCourse && (
              <div className="modal-foot">
                <button
                  className="secondary-button"
                  style={{ marginRight: "1rem" }}
                  onClick={handleCloseModal}
                >
                  Đóng
                </button>
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      `/course/${
                        selectedCourse.courseID ||
                        selectedCourse.id ||
                        selectedCourse._fallbackId
                      }`
                    )
                  }
                >
                  <Eye size={16} style={{ marginRight: "8px" }} />
                  Xem chi tiết toàn bộ khóa học
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL CHI TIẾT QUIZ (VIEW ONLY - KHÔNG CÓ NÚT START) ===== */}
      {isQuizModalOpen && (
        <div
          className="management-modal-overlay"
          onClick={handleCloseQuizModal}
          style={{ zIndex: 1100 }}
        >
          <div
            className="management-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px", width: "95%" }}
          >
            <div className="modal-head">
              <h3 className="modal-title">
                <BookOpen size={18} style={{ marginRight: "8px", color: "var(--primary)" }} />
                Nội dung bài quiz
              </h3>
            </div>

            <div
              className="modal-body-custom"
              style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "10px" }}
            >
              {isLoadingQuiz ? (
                <div className="admin-loading-spinner" style={{ minHeight: "20vh" }}>
                  <div className="admin-spinner"></div>
                  <p>Đang tải nội dung quiz...</p>
                </div>
              ) : selectedQuiz ? (
                <>
                  {/* Thông tin cơ bản quiz */}
                  <div className="info-row">
                    <span className="info-label">Tiêu đề:</span>
                    <span className="info-val" style={{ fontWeight: 800 }}>
                      {selectedQuiz.title}
                    </span>
                  </div>
                  {selectedQuiz.description && (
                    <div className="info-row">
                      <span className="info-label">Mô tả:</span>
                      <span className="info-val">{selectedQuiz.description}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Loại quiz:</span>
                    <span className="info-val">{getQuizTypeLabel(selectedQuiz.quizType)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Trạng thái:</span>
                    <span className="info-val">
                      <span
                        style={{
                          padding: "2px 10px", borderRadius: "99px",
                          fontSize: "0.8rem", fontWeight: 700,
                          background: selectedQuiz.isActive ? "#d1fae5" : "#fee2e2",
                          color: selectedQuiz.isActive ? "#059669" : "#dc2626",
                        }}
                      >
                        {selectedQuiz.isActive ? "Đang hoạt động" : "Không hoạt động"}
                      </span>
                    </span>
                  </div>

                  {/* Danh sách groups & câu hỏi */}
                  {(selectedQuiz.groups || []).length > 0 && (
                    <div
                      style={{
                        marginTop: "1.5rem", paddingTop: "1rem",
                        borderTop: "1px dashed var(--border)",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.95rem", fontWeight: 800,
                          marginBottom: "0.75rem", color: "var(--text-dark)",
                        }}
                      >
                        Nội dung câu hỏi (
                        {(selectedQuiz.groups || []).reduce(
                          (sum, g) => sum + (g.questions?.length || 0), 0
                        )}{" "}
                        câu)
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(selectedQuiz.groups || []).map((group, gi) => {
                          const gKey = group.groupID || gi;
                          const isExpanded = expandedGroups[gKey] !== false; // mặc định mở
                          return (
                            <div
                              key={gKey}
                              style={{
                                border: "1px solid var(--border)",
                                borderRadius: "10px",
                                overflow: "hidden",
                              }}
                            >
                              {/* Group header */}
                              <div
                                onClick={() => toggleGroup(gKey)}
                                style={{
                                  display: "flex", alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 14px",
                                  background: "var(--bg-soft)",
                                  cursor: "pointer",
                                  userSelect: "none",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700, fontSize: "0.9rem",
                                    color: "var(--text-dark)",
                                  }}
                                >
                                  {group.groupID === 0
                                    ? "(Không có nhóm)"
                                    : group.instruction || `Nhóm ${gi + 1}`}
                                  <span
                                    style={{
                                      marginLeft: "8px", fontSize: "0.78rem",
                                      color: "var(--text-muted)", fontWeight: 500,
                                    }}
                                  >
                                    {group.questions?.length || 0} câu hỏi
                                  </span>
                                </span>
                                {isExpanded ? (
                                  <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
                                ) : (
                                  <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                                )}
                              </div>

                              {/* Questions */}
                              {isExpanded && (
                                <div
                                  style={{
                                    padding: "12px 14px",
                                    display: "flex", flexDirection: "column", gap: "14px",
                                  }}
                                >
                                  {(group.questions || []).map((q, qi) => (
                                    <div key={q.questionID || qi}>
                                      <p
                                        style={{
                                          fontWeight: 700, fontSize: "0.88rem",
                                          color: "var(--text-dark)", marginBottom: "6px",
                                        }}
                                      >
                                        Câu {qi + 1}:{" "}
                                        <span style={{ fontWeight: 600 }}>{q.content}</span>
                                        <span
                                          style={{
                                            marginLeft: "8px", fontSize: "0.75rem",
                                            color: "var(--primary)", fontWeight: 500,
                                            background: "rgba(var(--primary-rgb), 0.08)",
                                            padding: "1px 8px", borderRadius: "99px",
                                          }}
                                        >
                                          {getQuizTypeLabel(q.questionType)}
                                        </span>
                                      </p>

                                      {/* Options cho trắc nghiệm */}
                                      {q.questionType === 1 && q.options?.length > 0 && (
                                        <ul
                                          style={{
                                            paddingLeft: "1.2rem", margin: 0,
                                            display: "flex", flexDirection: "column", gap: "4px",
                                          }}
                                        >
                                          {q.options.map((opt, oi) => (
                                            <li
                                              key={opt.optionID || oi}
                                              style={{
                                                fontSize: "0.85rem",
                                                color: opt.isCorrect ? "#059669" : "var(--text-body)",
                                                fontWeight: opt.isCorrect ? 700 : 500,
                                              }}
                                            >
                                              {opt.isCorrect && "✓ "}
                                              {opt.content}
                                            </li>
                                          ))}
                                        </ul>
                                      )}

                                      {/* Đáp án điền vào chỗ trống */}
                                      {q.questionType === 2 && q.metaJson && (() => {
                                        try {
                                          const meta = JSON.parse(q.metaJson);
                                          const ans = meta.answer || (meta.answers || []).join(" / ");
                                          return (
                                            <p
                                              style={{
                                                fontSize: "0.83rem", color: "#059669",
                                                fontWeight: 600, marginTop: "4px",
                                              }}
                                            >
                                              Đáp án: {ans}
                                            </p>
                                          );
                                        } catch {
                                          return null;
                                        }
                                      })()}
                                    </div>
                                  ))}
                                  {(!group.questions || group.questions.length === 0) && (
                                    <p
                                      style={{
                                        fontSize: "0.85rem", color: "var(--text-muted)",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Nhóm này chưa có câu hỏi.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!selectedQuiz.groups || selectedQuiz.groups.length === 0) && (
                    <div
                      className="admin-empty-data"
                      style={{ marginTop: "1.5rem", padding: "2rem 0" }}
                    >
                      Bài quiz này chưa có câu hỏi nào.
                    </div>
                  )}
                </>
              ) : (
                <div className="admin-empty-data">Không thể tải dữ liệu quiz.</div>
              )}
            </div>

            {/* Footer - CHỈ có nút Đóng, KHÔNG có nút Start Quiz */}
            <div className="modal-foot">
              <button className="secondary-button" onClick={handleCloseQuizModal}>
                <X size={16} style={{ marginRight: "6px" }} />
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