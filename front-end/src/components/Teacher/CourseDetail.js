import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTeacherCourseDetail } from "../../middleware/teacher/courseTeacherAPI";
import {
  ChevronLeft,
  Plus,
  ChevronDown,
  Eye,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import "../Admin/admin-dashboard-styles.scss";
import "./CourseDetail.scss";

const getLevelLabel = (level) => {
  const lv = Number(level);
  switch (lv) {
    case 1:
      return "Beginner";
    case 2:
      return "Elementary";
    case 3:
      return "Intermediate";
    case 4:
      return "Upper Intermediate";
    case 5:
      return "Advanced";
    default:
      return "N/A";
  }
};

const AccordionItem = ({ chapter, index }) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const chapterVideos = chapter?.videos || chapter?.Videos || [];

  return (
    <div className={`course-chapter-item ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className="course-chapter-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="course-chapter-header-left">
          <span className="course-chapter-number">{index + 1}</span>

          <div className="course-chapter-heading">
            <span className="course-chapter-title">
              {chapter.chapterName || chapter.ChapterName || `Chương ${index + 1}`}
            </span>
            <span className="course-chapter-meta">
              {chapterVideos.length} video
            </span>
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`course-chapter-toggle-icon ${isOpen ? "open" : ""}`}
        />
      </button>

      <div className={`course-chapter-content ${isOpen ? "open" : ""}`}>
        <div className="course-chapter-content-inner">
          {chapter.videos?.length > 0 ? (
            <div className="course-video-list">
              {chapter.videos.map((video) => (
                <div key={video.videoID} className="course-video-item">
                  <div className="course-video-info">
                    <span className="course-video-icon-wrap">
                      <PlayCircle size={15} />
                    </span>

                    <div className="course-video-text">
                      <span className="course-video-name">
                        {video.videoName || "Chưa có tên video"}
                      </span>

                      <div className="course-video-meta-row">
                        {video.duration && (
                          <span className="course-video-duration">
                            {video.duration}
                          </span>
                        )}
                        {video.isPreview && (
                          <span className="course-preview-badge">Miễn phí</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {video.videoURL ? (
                    <a
                      href={video.videoURL}
                      target="_blank"
                      rel="noreferrer"
                      className="course-video-link"
                    >
                      Xem video
                    </a>
                  ) : (
                    <span className="course-no-video-badge">Chưa có video</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="course-empty-state course-empty-state-sm">
              Chưa có video nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId) fetchCourseDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseDetail = async () => {
    try {
      setIsLoading(true);
      const data = await getTeacherCourseDetail(courseId);
      console.log("📦 CourseDetail API response:", data);
      setCourse(data);
      setError(null);
    } catch (err) {
      console.error("❌ Lỗi khi tải chi tiết khóa học:", err);
      setError("Không thể tải thông tin khóa học");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const chapters = course?.chapters || course?.Chapters || [];
    const chapterCount = chapters.length;
    const videoCount =
      chapters.reduce((total, chapter) => {
        const videos = chapter?.videos || chapter?.Videos || [];
        return total + videos.length;
      }, 0) || 0;

    const studentCount =
      course?.studentCount ||
      course?.totalStudents ||
      course?.enrolledStudents ||
      0;

    return { chapterCount, videoCount, studentCount };
  }, [course]);

  if (isLoading) {
    return (
      <div className="admin-loading-spinner">
        <div className="admin-spinner"></div>
        <p>Đang tải dữ liệu khóa học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-card text-center">
        <p className="text-danger">{error}</p>
        <button className="primary-button mt-3" onClick={fetchCourseDetail}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="course-detail-page admin-content-area">
      <div className="course-detail-shell">
        <div className="course-topbar">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/teacher/dashboard");
            }}
            className="course-back-link"
          >
            <ChevronLeft size={16} />
            Quay lại Dashboard
          </a>

          <div className="course-topbar-actions">
            <button
              type="button"
              className="course-ghost-button"
              onClick={() => window.open(`/course/${course?.courseID}`, "_blank")}
            >
              <Eye size={16} />
              Xem trước
            </button>
          </div>
        </div>

        <header className="course-page-header">
          <h1 className="course-page-title">Chi tiết khóa học</h1>
          <p className="course-page-description">
            Xem thông tin khóa học và nội dung chương trình
          </p>
        </header>

        <div className="course-detail-grid">
          <aside className="course-info-column">
            <div className="course-info-card">
              <div className="course-card-title-row">
                <h3 className="course-card-header-title">Thông tin khóa học</h3>
                <span className="course-status-badge">ACTIVE</span>
              </div>

              <div className="course-info-form-group">
                <label>Tên khóa học</label>
                <div className="course-form-control-static">
                  {course?.courseName || "Chưa có tên khóa học"}
                </div>
              </div>

              <div className="course-info-form-group">
                <label>Mô tả</label>
                <div className="course-form-control-static course-textarea">
                  {course?.description || course?.Description || "Chưa có mô tả"}
                </div>
              </div>

              <div className="course-info-form-group">
                <label>Cấp độ</label>
                <div className="course-form-control-static course-level-box">
                  <BookOpen size={15} />
                  <span>
                    Level {course?.courseLevel || "N/A"} -{" "}
                    {getLevelLabel(course?.courseLevel)}
                  </span>
                </div>
              </div>

              <div className="course-info-form-group course-stats-group">
                <label>Thống kê</label>
                <div className="course-stats-box">
                  <div className="course-stat-row">
                    <span>Tổng số chương:</span>
                    <strong>{stats.chapterCount} chương</strong>
                  </div>
                  <div className="course-stat-row">
                    <span>Tổng số video:</span>
                    <strong>{stats.videoCount} video</strong>
                  </div>
                  <div className="course-stat-row">
                    <span>Học viên:</span>
                    <strong>{stats.studentCount} người</strong>
                  </div>
                </div>
              </div>

              <div className="course-card-actions">
                <button
                  className="course-primary-button"
                  onClick={() => navigate(`/teacher/editcourse/${course?.courseID}`)}
                >
                  Chỉnh sửa
                </button>

                <button
                  className="course-secondary-button"
                  onClick={() => navigate("/teacher/createcourse")}
                >
                  <Plus size={15} />
                  Tạo mới
                </button>
              </div>
            </div>
          </aside>

          <section className="course-content-card">
            <div className="course-content-card-head">
              <h3 className="course-card-header-title">Nội dung khóa học</h3>
            </div>

            {((course?.chapters || course?.Chapters) || []).length > 0 ? (
              <div className="course-chapter-accordion">
                {(course?.chapters || course?.Chapters || []).map((chapter, i) => (
                  <AccordionItem
                    chapter={chapter}
                    index={i}
                    key={chapter.chapterID || chapter.ChapterID || i}
                  />
                ))}
              </div>
            ) : (
              <div className="course-empty-state course-empty-state-lg">
                Chưa có chương nào trong khóa học.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;