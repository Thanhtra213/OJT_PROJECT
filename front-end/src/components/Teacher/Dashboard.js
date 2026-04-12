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
  ClipboardCheck,
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
import { TeacherReviewManagement } from "./TeacherReviewManagement";
import { jwtDecode } from "jwt-decode";
import AIChat from "../AIChat/AI";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [showAIChat, setShowAIChat] = useState(false);

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
              filteredCourses.map((c) =>
                getFlashcardSetsByCourse(c.courseID).catch((err) => {
                  console.warn(`Lỗi lấy flashcard cho course ${c.courseID}:`, err);
                  return [];
                })
              )
            ),
            Promise.all(
              filteredCourses.map((c) =>
                getQuizzesByCourse(c.courseID).catch((err) => {
                  console.warn(`Lỗi lấy quiz cho course ${c.courseID}:`, err);
                  return [];
                })
              )
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
    
    if (s.includes("nền tảng") || s.includes("beginner") || s.includes("level 1") || s.includes("lớp 1")) return "Nền tảng";
    if (s.includes("cơ bản") || s.includes("intermediate") || s.includes("level 2") || s.includes("elementary")) return "Cơ bản";
    if (s.includes("tiền trung cấp") || s.includes("advanced") || s.includes("level 3")) return "Tiền trung cấp";
    if (s.includes("trung cấp") || s.includes("expert") || s.includes("level 4")) return "Trung cấp";
    if (s.includes("cao cấp") || s.includes("level 5") || s.includes("level 6")) return "Cao cấp";
    
    return "Tổng quát";
  };

  const getLevelClass = (level, name) => {
    const s = (String(level || "") + String(name || "")).toLowerCase();
    
    if (s.includes("nền tảng") || s.includes("beginner") || s.includes("level 1")) return "theme-beginner";
    if (s.includes("cơ bản") || s.includes("intermediate") || s.includes("level 2") || s.includes("elementary")) return "theme-intermediate";
    if (s.includes("tiền trung cấp") || s.includes("advanced") || s.includes("level 3")) return "theme-pre-intermediate";
    if (s.includes("trung cấp") || s.includes("expert") || s.includes("level 4")) return "theme-advanced";
    if (s.includes("cao cấp") || s.includes("level 5")) return "theme-expert";
    
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
      case "review":
        return {
          title: "Chấm điểm bài làm",
          subtitle: "Xem và đánh giá bài nộp từ học viên (hỗ trợ AI preview)",
          buttonText: null,
          onButtonClick: null,
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
      key: "review",
      icon: ClipboardCheck,
      label: "Review",
      sub: "Chấm điểm bài làm",
    },
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
        {courses.map((course, index) => {
          const levelClass = getLevelClass(course.courseLevel || course.CourseLevel, course.courseName || course.CourseName);
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
            <div key={course.courseID || course.CourseID || index} className={`course-card origin-course-card ${levelClass}`}>
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
                        navigate("/teacher/create-quiz", { state: { courses, preSelectedCourseId: course.courseID } })
                      }
                      className="icon-action-btn"
                      style={{ color: '#8b5cf6' }}
                      title="Tạo Quiz cho khóa này"
                    >
                      <Brain size={16} />
                    </button>
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
        {flashcards.map((set, index) => {
          const themeClass = getLevelClass(set.courseLevel || set.CourseLevel, set.courseName || set.CourseName || set.title || set.Title);

          return (
            <div
              key={set.setID || set.SetID || index}
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
            {quizzes.map((quiz, index) => {
              const themeClass = getLevelClass(quiz.courseLevel || quiz.CourseLevel, quiz.courseName || quiz.CourseName || quiz.title || quiz.Title);

              return (
                <div
                  key={quiz.quizID || quiz.QuizID || index}
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
      case "review":
        return <TeacherReviewManagement />;
      case "danhgia":
        return <TeacherFeedbackView />;
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

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      {!showAIChat&&(
        <button className="ai-fab-btn" onClick={()=>setShowAIChat(true)} title="Chat với AI">
          <span className="ai-fab-label">
            AI
            <svg width="14" height="14" viewBox="0 0 15 15" style={{marginLeft:"2px",verticalAlign:"middle",position:"relative",top:"-1px"}}>
              <polygon points="7.5,1.5 9.3,5.6 14,5.8 10.5,8.6 11.7,12.8 7.5,10.4 3.3,12.8 4.5,8.6 1,5.8 5.7,5.6" fill="#f9c74f" stroke="#f9c74f" strokeWidth="0.5"/>
            </svg>
          </span>
        </button>
      )}

      <style>{`
        .ai-fab-btn {
          position:fixed;bottom:30px;right:30px;z-index:1100;
          background:#00c896;color:#fff;border:none;border-radius:50%;
          width:56px;height:56px;
          box-shadow:0 8px 32px rgba(0,200,150,0.4);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;padding:0;font-family:'Nunito',sans-serif;
          transition:box-shadow .18s,transform .18s,background .18s;
          animation:fab-pop 1.2s cubic-bezier(.68,-.55,.27,1.55);
        }
        .ai-fab-btn:hover{background:#00a87c;box-shadow:0 12px 40px rgba(0,200,150,.55);transform:translateY(-2px) scale(1.06);}
        .ai-fab-label{font-weight:900;font-size:1.05rem;display:flex;align-items:center;}
        @keyframes fab-pop{0%{transform:scale(0.7);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}
        @media(max-width:600px){.ai-fab-btn{right:12px;bottom:12px;}}
      `}</style>

      {showAIChat&&<AIChat isVisible={showAIChat} onClose={()=>setShowAIChat(false)}/>}
    </div>
  );
};

export default TeacherDashboard;