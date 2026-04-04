import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Layers3,
  Brain,
  Star,
  Plus,
  Edit,
  Trash,
  Users,
  FileText,
  MoreVertical,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import "../Admin/admin-dashboard-styles.scss";
import "./teacher-dashboard.scss";
import {
  getTeacherCourses,
  deleteTeacherCourse,
} from "../../middleware/teacher/courseTeacherAPI";
import {
  getFlashcardSetsByCourse,
  deleteFlashcardSet,
} from "../../middleware/teacher/flashcardTeacherAPI";
import {
  getQuizzesByCourse,
  deleteQuiz,
} from "../../middleware/teacher/quizTeacherAPI";
import { TeacherFeedbackView } from "./TeacherFeedbackView";
import { jwtDecode } from "jwt-decode";

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeMenu, setActiveMenu] = useState("khoahoc");
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  const token = localStorage.getItem("accessToken");

  const decodedUser = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (err) {
      console.error("❌ Lỗi giải mã token:", err);
      return null;
    }
  }, [token]);

  const teacherId =
    decodedUser?.id || decodedUser?.teacherId || decodedUser?.UserId || null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const courseData = await getTeacherCourses();
        const filteredCourses = teacherId
          ? courseData.filter((c) => c.teacherID === teacherId)
          : courseData;

        setCourses(filteredCourses);

        if (filteredCourses.length > 0) {
          const [flashcardData, quizData] = await Promise.all([
            Promise.all(
              filteredCourses.map((c) => getFlashcardSetsByCourse(c.courseID))
            ),
            Promise.all(
              filteredCourses.map((c) => getQuizzesByCourse(c.courseID))
            ),
          ]);

          const allFlashcards = flashcardData.flatMap((setList, idx) =>
            (setList || []).map((f) => ({
              ...f,
              courseID: f.courseID || filteredCourses[idx].courseID,
              courseName: filteredCourses[idx].courseName,
              courseLevel: f.courseLevel || f.level || filteredCourses[idx].courseLevel || 1,
            }))
          );

          const allQuizzes = quizData.flatMap((quizList, idx) =>
            (quizList || []).map((q) => ({
              ...q,
              courseID: q.courseID || filteredCourses[idx].courseID,
              courseName: filteredCourses[idx].courseName,
              courseLevel: q.courseLevel || q.level || filteredCourses[idx].courseLevel || 1,
            }))
          );

          setFlashcards(
            teacherId
              ? allFlashcards.filter((f) => f.teacherID === teacherId)
              : allFlashcards
          );

          setQuizzes(
            teacherId
              ? allQuizzes.filter((q) => q.teacherID === teacherId)
              : allQuizzes
          );
        } else {
          setFlashcards([]);
          setQuizzes([]);
        }
      } catch (err) {
        console.error("❌ Lỗi load dữ liệu:", err);
        setError(err.message || "Không thể tải dữ liệu");
        showPopup(err.message || "Không thể tải dữ liệu", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId, reloadTrigger]);

  const stats = useMemo(() => {
    const totalStudents = courses.reduce((sum, c) => {
      return (
        sum +
        Number(
          c.totalStudents ||
            c.studentCount ||
            c.enrolledStudents ||
            c.totalEnrollments ||
            0
        )
      );
    }, 0);

    const totalLessons = courses.reduce((sum, c) => {
      return (
        sum +
        Number(
          c.totalLessons ||
            c.lessonCount ||
            c.totalChapters ||
            c.totalUnits ||
            0
        )
      );
    }, 0);

    const avgScore =
      quizzes.length > 0
        ? (
            quizzes.reduce(
              (sum, q) =>
                sum +
                Number(q.averageScore || q.avgScore || q.averageResult || 0),
              0
            ) / quizzes.length
          ).toFixed(1)
        : "0.0";

    return {
      totalStudents,
      totalLessons,
      avgScore,
    };
  }, [courses, quizzes]);

  const quizStats = useMemo(() => {
    const totalQuiz = quizzes.length;
    const activeQuiz = quizzes.filter((q) => q.isActive !== false).length;
    const avgQuizScore =
      quizzes.length > 0
        ? (
            quizzes.reduce(
              (sum, q) =>
                sum +
                Number(q.averageScore || q.avgScore || q.averageResult || 0),
              0
            ) / quizzes.length
          ).toFixed(1)
        : "0.0";

    return {
      totalQuiz,
      activeQuiz,
      avgQuizScore,
    };
  }, [quizzes]);

  const getLevelLabel = (level, name) => {
    const s = (String(level || "") + String(name || "")).toLowerCase();
    if (s.includes("nền tảng") || s.includes("beginner") || s.includes("level 1") || s.includes("lớp 1")) return "Beginner";
    if (s.includes("cơ bản") || s.includes("intermediate") || s.includes("level 2") || s.includes("elementary")) return "Intermediate";
    if (s.includes("trung cấp") || s.includes("advanced") || s.includes("level 3")) return "Advanced";
    if (s.includes("chuyên sâu") || s.includes("expert") || s.includes("level 4") || s.includes("level 5")) return "Expert";
    return "General";
  };

  const getLevelClass = (level, name) => {
    const s = (String(level || "") + String(name || "")).toLowerCase();
    if (s.includes("nền tảng") || s.includes("beginner") || s.includes("level 1") || s.includes("lớp 1")) return "theme-beginner";
    if (s.includes("cơ bản") || s.includes("intermediate") || s.includes("level 2") || s.includes("elementary")) return "theme-intermediate";
    if (s.includes("trung cấp") || s.includes("advanced") || s.includes("level 3")) return "theme-advanced";
    if (s.includes("chuyên sâu") || s.includes("expert") || s.includes("level 4") || s.includes("level 5")) return "theme-expert";
    return "theme-beginner";
  };

  const getPageInfo = () => {
    switch (activeMenu) {
      case "khoahoc":
        return {
          title: "Quản lý Khóa học",
          subtitle: "Tạo và quản lý các khóa học tiếng Anh của bạn",
          buttonText: "Tạo khóa học mới",
          onButtonClick: () => navigate("/teacher/create-course"),
        };
      case "flashcards":
        return {
          title: "Quản lý Flashcards",
          subtitle: "Tổ chức bộ từ vựng và tài liệu ghi nhớ cho học viên",
          buttonText: "Tạo flashcard mới",
          onButtonClick: () => navigate("/teacher/create"),
        };
      case "quiz":
        return {
          title: "Quản lý Quiz",
          subtitle: "Tạo và theo dõi các bài kiểm tra cho từng khóa học",
          buttonText: "Tạo quiz mới",
          onButtonClick: () => navigate("/teacher/create-quiz"),
        };
      case "danhgia":
        return {
          title: "Đánh giá",
          subtitle: "Theo dõi phản hồi và kết quả học tập của học viên",
          buttonText: null,
          onButtonClick: null,
        };
      default:
        return {
          title: "Dashboard",
          subtitle: "",
          buttonText: null,
          onButtonClick: null,
        };
    }
  };

  const pageInfo = getPageInfo();

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Bạn có chắc muốn xóa khóa học này không?")) return;
    try {
      await deleteTeacherCourse(courseId);
      showPopup("Xóa khóa học thành công!", "success");
      setReloadTrigger((prev) => prev + 1);
    } catch (error) {
      showPopup(error.message || "Không thể xóa khóa học.", "error");
    }
  };

  const handleDeleteFlashcard = async (setId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bộ flashcard này không?")) return;
    try {
      await deleteFlashcardSet(setId);
      showPopup("Xóa flashcard thành công!", "success");
      setReloadTrigger((prev) => prev + 1);
    } catch (error) {
      showPopup(error.message || "Không thể xóa flashcard.", "error");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa quiz này không? Tất cả câu hỏi, nhóm và kết quả liên quan có thể bị ảnh hưởng!"
      )
    ) {
      return;
    }

    try {
      await deleteQuiz(quizId);
      showPopup("Xóa quiz thành công!", "success");
      setReloadTrigger((prev) => prev + 1);
    } catch (error) {
      const errorData = error.response?.data;
      const errorMsg = errorData?.error || errorData?.message || error.message;

      if (
        error.response?.status === 409 ||
        errorMsg?.includes("constraint") ||
        errorMsg?.includes("foreign key")
      ) {
        showPopup(
          "Không thể xóa quiz này vì đang có dữ liệu liên quan.",
          "error"
        );
      } else if (error.response?.status === 404) {
        showPopup("Quiz không tồn tại hoặc đã bị xóa.", "error");
        setReloadTrigger((prev) => prev + 1);
      } else if (error.response?.status === 403) {
        showPopup("Bạn không có quyền xóa quiz này.", "error");
      } else {
        showPopup(errorMsg || "Không thể xóa quiz.", "error");
      }
    }
  };

  const handleViewCourseDetail = (courseId) =>
    navigate(`/teacher/coursedetail/${courseId}`);

  const menuItems = [
    {
      key: "khoahoc",
      icon: BookOpen,
      label: "Khóa học",
      sub: "Quản lý khóa học",
    },
    {
      key: "flashcards",
      icon: Layers3,
      label: "Flashcards",
      sub: "Thẻ từ vựng",
    },
    { key: "quiz", icon: Brain, label: "Quiz", sub: "Bài kiểm tra" },
    {
      key: "danhgia",
      icon: Star,
      label: "Đánh giá",
      sub: "Kết quả học tập",
    },
  ];

  const renderCourseCards = () => {
    if (courses.length === 0) {
      return (
        <div className="empty-state-card">
          <GraduationCap size={48} />
          <h3>Bạn chưa có khóa học nào</h3>
          <p>Hãy tạo khóa học đầu tiên để bắt đầu quản lý nội dung giảng dạy.</p>
          <button
            onClick={() => navigate("/teacher/create-course")}
            className="primary-button"
          >
            <Plus size={18} /> Tạo khóa học mới
          </button>
        </div>
      );
    }

    return (
      <div className="course-grid">
        {courses.map((course) => {
          const levelClass = getLevelClass(course.courseLevel, course.courseName);
          const studentCount =
            course.totalStudents ||
            course.studentCount ||
            course.enrolledStudents ||
            course.totalEnrollments ||
            0;
          const lessonCount =
            course.totalLessons ||
            course.lessonCount ||
            course.totalChapters ||
            course.totalUnits ||
            0;

          return (
            <div key={course.courseID} className={`course-card origin-course-card ${levelClass}`}>
              <div className="course-cover">
                <span className="course-level-badge">
                  {getLevelLabel(course.courseLevel, course.courseName)}
                </span>
                <div className="course-cover-overlay" />
              </div>

              <div className="course-card-body">
                <h3 className="course-title">{course.courseName}</h3>
                <p className="course-description">
                  {course.description || "Chưa có mô tả cho khóa học này."}
                </p>

                <div className="course-meta">
                  <div className="meta-item">
                    <Users size={16} />
                    <span>{studentCount} học viên</span>
                  </div>
                  <div className="meta-item">
                    <FileText size={16} />
                    <span>{lessonCount} bài học</span>
                  </div>
                </div>

                <div className="course-card-actions">
                  <button
                    onClick={() => handleViewCourseDetail(course.courseID)}
                    className="course-detail-btn"
                  >
                    Xem chi tiết
                  </button>

                  <div className="course-icon-actions">
                    <button
                      onClick={() =>
                        navigate(`/teacher/edit-course/${course.courseID}`)
                      }
                      className="icon-action-btn"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.courseID)}
                      className="icon-action-btn danger"
                      title="Xóa khóa học"
                    >
                      <Trash size={16} />
                    </button>
                    <button className="icon-action-btn" title="Tùy chọn">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFlashcards = () => {
    if (flashcards.length === 0) {
      return (
        <div className="empty-state-card">
          <Layers3 size={48} />
          <h3>Bạn chưa có bộ flashcard nào</h3>
          <p>Hãy tạo bộ flashcard đầu tiên để quản lý từ vựng cho học viên.</p>
          <button
            onClick={() => navigate("/teacher/create")}
            className="primary-button"
          >
            <Plus size={18} /> Tạo flashcard mới
          </button>
        </div>
      );
    }

    const themeClasses = [
      "theme-beginner",
      "theme-intermediate",
      "theme-advanced",
      "theme-expert",
    ];

    return (
      <div className="course-grid">
        {flashcards.map((set) => {
          const themeClass = getLevelClass(set.courseLevel, set.courseName || set.title);

          return (
            <div
              key={set.setID}
              className={`course-card flashcard-card ${themeClass}`}
            >
              <div className="course-cover">
                <span className="course-level-badge">
                  {set.courseName || "Flashcards"}
                </span>
                <div className="course-cover-overlay" />
              </div>

              <div className="course-card-body">
                <h3 className="course-title">{set.title}</h3>
                <p className="course-description">
                  {set.description || "Chưa có mô tả cho bộ flashcard này."}
                </p>

                <div className="course-meta">
                  <div className="meta-item">
                    <Layers3 size={16} />
                    <span>{set.courseName || "Chưa rõ khóa học"}</span>
                  </div>
                </div>

                <div className="course-card-actions">
                  <button
                    onClick={() => navigate(`/teacher/flashcards/${set.setID}`)}
                    className="course-detail-btn"
                  >
                    Xem chi tiết
                  </button>

                  <div className="course-icon-actions">
                    <button
                      onClick={() => navigate(`/teacher/edit/${set.setID}`)}
                      className="icon-action-btn"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteFlashcard(set.setID)}
                      className="icon-action-btn danger"
                      title="Xóa bộ"
                    >
                      <Trash size={16} />
                    </button>
                    <button className="icon-action-btn" title="Tùy chọn">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuizzes = () => {
    const themeClasses = [
      "theme-beginner",
      "theme-intermediate",
      "theme-advanced",
      "theme-expert",
    ];

    return (
      <div className="quiz-page-stack">
        <div className="mini-stats-grid">
          <div className="mini-stat-card">
            <div className="mini-stat-icon">
              <BarChart3 size={18} />
            </div>
            <div className="mini-stat-content">
              <span>Tổng quiz</span>
              <strong>{quizStats.totalQuiz}</strong>
            </div>
          </div>

          <div className="mini-stat-card">
            <div className="mini-stat-icon">
              <Brain size={18} />
            </div>
            <div className="mini-stat-content">
              <span>Quiz hoạt động</span>
              <strong>{quizStats.activeQuiz}</strong>
            </div>
          </div>

          <div className="mini-stat-card">
            <div className="mini-stat-icon">
              <Star size={18} />
            </div>
            <div className="mini-stat-content">
              <span>Điểm trung bình</span>
              <strong>{quizStats.avgQuizScore}/10</strong>
            </div>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="empty-state-card">
            <Brain size={48} />
            <h3>Bạn chưa có quiz nào</h3>
            <p>Hãy tạo quiz đầu tiên để kiểm tra kiến thức của học viên.</p>
            <button
              onClick={() => navigate("/teacher/create-quiz")}
              className="primary-button"
            >
              <Plus size={18} /> Tạo quiz mới
            </button>
          </div>
        ) : (
          <div className="course-grid">
            {quizzes.map((quiz) => {
              const themeClass = getLevelClass(quiz.courseLevel, quiz.courseName || quiz.title);

              return (
                <div
                  key={quiz.quizID}
                  className={`course-card quiz-card ${themeClass}`}
                >
                  <div className="course-cover">
                    <span className="course-level-badge">
                      {getLevelLabel(quiz.courseLevel, quiz.courseName || quiz.title)}
                    </span>
                    <div className="course-cover-overlay" />
                  </div>

                  <div className="course-card-body">
                    <h3 className="course-title">{quiz.title}</h3>
                    <p className="course-description">
                      {quiz.description || "Chưa có mô tả cho quiz này."}
                    </p>

                    <div className="course-meta">
                      <div className="meta-item">
                        <Brain size={16} />
                        <span>{quiz.courseName || "Chưa rõ khóa học"}</span>
                      </div>
                    </div>

                    <div className="course-card-actions">
                      <button
                        onClick={() =>
                          navigate(`/teacher/quizdetail/${quiz.quizID}`)
                        }
                        className="course-detail-btn"
                      >
                        Xem chi tiết
                      </button>

                      <div className="course-icon-actions">
                        <button
                          onClick={() =>
                            navigate(`/teacher/edit-quiz/${quiz.quizID}`, { state: { courses } })
                          }
                          className="icon-action-btn"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteQuiz(quiz.quizID)}
                          className="icon-action-btn danger"
                          title="Xóa quiz"
                        >
                          <Trash size={16} />
                        </button>

                        <button className="icon-action-btn" title="Tùy chọn">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="dashboard-state">
          <div className="admin-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (error) {
      return <div className="dashboard-error">{error}</div>;
    }

    switch (activeMenu) {
      case "khoahoc":
        return renderCourseCards();
      case "flashcards":
        return renderFlashcards();
      case "quiz":
        return renderQuizzes();
      case "danhgia":
        return (
          <div className="feedback-page-card">
            <div className="feedback-page-inner">
              <TeacherFeedbackView />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="teacher-app-shell">
      <div className="teacher-dashboard-wrap">
        <div className="teacher-dashboard-page">
          <aside className="teacher-sidebar">
            <div className="sidebar-brand">
              <div className="brand-icon">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2>Bảng điều khiển</h2>
              </div>
            </div>

            <div className="sidebar-menu">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveMenu(item.key)}
                    className={`sidebar-menu-item ${isActive ? "active" : ""}`}
                  >
                    <div className="menu-icon-box">
                      <Icon size={20} />
                    </div>
                    <div className="menu-text">
                      <span className="menu-label">{item.label}</span>
                      <small className="menu-sub">{item.sub}</small>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="sidebar-stats-card">
              <div className="stats-icon">
                <Star size={20} />
              </div>
              <h4>Thống kê</h4>
              <p>Tháng này</p>

              <div className="stats-list">
                <div className="stats-row">
                  <span>Học viên hoạt động</span>
                  <strong>{stats.totalStudents}</strong>
                </div>
                <div className="stats-row">
                  <span>Bài học hoàn thành</span>
                  <strong>{stats.totalLessons}</strong>
                </div>
                <div className="stats-row">
                  <span>Điểm trung bình</span>
                  <strong>{stats.avgScore}/10</strong>
                </div>
              </div>
            </div>
          </aside>

          <main className="teacher-main">
            <div className="teacher-topbar">
              <div className="topbar-heading">
                <h1>{pageInfo.title}</h1>
                <p>{pageInfo.subtitle}</p>
              </div>

              {pageInfo.buttonText && (
                <button
                  onClick={pageInfo.onButtonClick}
                  className="header-create-btn"
                >
                  <Plus size={18} />
                  {pageInfo.buttonText}
                </button>
              )}
            </div>

            <div className="teacher-content">{renderContent()}</div>
          </main>
        </div>
      </div>

      {toast.show && (
        <div className="toast-overlay">
          <div className={`toast-popup ${toast.type}`}>
            <p>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;