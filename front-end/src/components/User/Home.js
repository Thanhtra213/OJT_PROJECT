import React, { useState, useEffect } from "react";
import AIChat from "../AIChat/AI";
import { getVideoProgressFromDB } from "../../middleware/videoProgressAPI";
import { getUserHistoryKey } from "../../redux/videoWatchHelper";
import { Container, Row, Col, Card, Badge, Modal, Button } from "react-bootstrap";
import "./Home.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { getCourses } from "../../middleware/courseAPI";
import { checkMembership } from "../../middleware/membershipAPI";
import { getReviewList, getReviewDetail, isSpeakingSubmission } from "../../middleware/practiceReviewAPI";
import { getPlacementTests, getPlacementRecommendation } from "../../middleware/placementTestAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy, faFire, faBookOpen, faCheckCircle, faClock,
  faLock, faGraduationCap, faLayerGroup, faMicrophone,
  faHeadphones, faPencilAlt, faFileAlt, faComments,
  faTrash, faPlay, faVideo, faUsers,
  faChevronRight, faEdit, faEllipsisV, faRocket, faStar
} from "@fortawesome/free-solid-svg-icons";

// ══════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════════
const getCourseImage = (courseId) => {
  const images = [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop"
  ];
  return images[(Number(courseId) || 0) % images.length];
};

const getYtThumb = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : null;
};

const getVideoThumbnail = (lesson) => {
  if (lesson.videoURL && (lesson.platform === 'youtube' || lesson.videoURL.includes('youtube') || lesson.videoURL.includes('youtu.be'))) {
    const thumb = getYtThumb(lesson.videoURL);
    if (thumb) return thumb;
  }
  return getCourseImage(lesson.courseID);
};

const LEVELS = {
  1: { label: "Beginner", color: "#f97316", badge: "#fff7ed", text: "#c2410c" },
  2: { label: "Intermediate", color: "#ec4899", badge: "#fdf2f8", text: "#be185d" },
  3: { label: "Intermediate", color: "#10b981", badge: "#ecfdf5", text: "#065f46" },
  4: { label: "Advanced", color: "#8b5cf6", badge: "#f5f3ff", text: "#5b21b6" },
  5: { label: "Expert", color: "#3b82f6", badge: "#eff6ff", text: "#1d4ed8" },
};
const getLevel = (n) => LEVELS[Number(n)] || LEVELS[1];

const SKILLS = [
  { title: "Flashcards", icon: faLayerGroup, color: "#00c896", bg: "#e6faf4", path: "/flashcards", premium: false },
  { title: "Luyện nói", icon: faMicrophone, color: "#ec4899", bg: "#fdf2f8", path: "/speakingpractice", premium: true },
  { title: "Luyện nghe", icon: faHeadphones, color: "#8b5cf6", bg: "#f5f3ff", path: "/listeningpractice", premium: true },
  { title: "Luyện viết", icon: faPencilAlt, color: "#f97316", bg: "#fff7ed", path: "/writingpractice", premium: false },
  { title: "Ngữ pháp", icon: faFileAlt, color: "#3b82f6", bg: "#eff6ff", path: "/grammar", premium: false },
  { title: "Quizz", icon: faComments, color: "#f59e0b", bg: "#fefce8", path: "/quiz/publish", premium: true },
];

const mintBtn = (extra = {}) => ({
  background: "#00c896", color: "#fff", border: "none",
  borderRadius: "50px", fontWeight: 800, fontFamily: "'Nunito',sans-serif",
  cursor: "pointer", transition: "all .22s", ...extra,
});
const mintBtnHover = { background: "#00a87c", boxShadow: "0 6px 20px rgba(0,200,150,.35)", transform: "translateY(-1px)" };

const emptyData = {
  user: { name: "Student", xp: 0, streak: 0, level: 1, progress: 0 },
  stats: {
    khoahoc: { currentLevel: "Level 1", xpToNext: 0 },
    streak: { days: 0, message: "Bắt đầu học ngay hôm nay!" },
    luyentap: { lessonsCompleted: 0, averageScore: "0%" },
    timeSpent: { time: "0h 0m", times: "This week" },
    weeklyGoal: { lessons: { completed: 0, total: 7 }, studyTime: { completed: 0, total: 300, unit: "min" } },
  },
};

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
const Home = () => {
  // ─── States ─────────────────────────────────────────────────────
  const [showAIChat, setShowAIChat] = useState(false);
  const [user, setUser] = useState(null);
  const [lessonHistory, setLessonHistory] = useState([]);
  const [streakDays, setStreakDays] = useState(0);
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [activeTab, setActiveTab] = useState("luyentap");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courses, setCourses] = useState([]);
  const [dbLessonHistory, setDbLessonHistory] = useState([]);

  // Review states
  const [reviewList, setReviewList] = useState([]);
  const [placementTests, setPlacementTests] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDetail, setReviewDetail] = useState(null);

  // Placement recommendation states
  const [placementRecommendation, setPlacementRecommendation] = useState(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

  const navigate = useNavigate();

  // ─── Helpers ────────────────────────────────────────────────────
  const getAuthHeaders = () => {
    const t = localStorage.getItem("accessToken");
    return { Accept: "*/*", Authorization: t ? `Bearer ${t}` : undefined, "ngrok-skip-browser-warning": "true" };
  };

  const fmtVN = (iso) => iso ? new Intl.DateTimeFormat("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "-";
  const fmtDT = (iso) => iso ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "-";

  const fmtDur = (m) => {
    if (m == null || isNaN(m)) return "0 phút";
    const t = Math.max(0, Math.round(Number(m)));
    if (!t) return "0 phút";
    const h = Math.floor(t / 60), mn = t % 60;
    return h > 0 ? (mn > 0 ? `${h} giờ ${mn} phút` : `${h} giờ`) : `${mn} phút`;
  };
  const toHM = fmtDur;

  const cleanHistory = () => {
    try {
      const s = localStorage.getItem(getUserHistoryKey());
      if (!s) return;
      const h = JSON.parse(s);
      if (!Array.isArray(h)) return;
      const c = h.map(e => {
        const d = Number(e.duration) || 0, w = Number(e.watchedMinutes) || 0, p = Number(e.progress) || 0;
        return { ...e, duration: Math.round(d), watchedMinutes: Math.round(Math.min(w, d)), progress: p >= 95 ? 100 : Math.min(p, 100) };
      });
      localStorage.setItem(getUserHistoryKey(), JSON.stringify(c));
      return c;
    } catch { return undefined; }
  };

  const calcStreak = (arr) => {
    if (!arr || !arr.length) return 0;
    const ds = d => new Date(d).toDateString();
    const dates = [...new Set(arr.map(x => ds(x.submittedAt || x.lastWatched)))].sort((a, b) => new Date(b) - new Date(a));
    if (!dates.length) return 0;
    const today = new Date().toDateString(), yest = new Date(Date.now() - 86400000).toDateString();
    if (dates[0] !== today && dates[0] !== yest) return 0;
    let s = 1, cur = new Date(dates[0]);
    for (let i = 1; i < dates.length; i++) {
      const p = new Date(dates[i]);
      if (Math.floor((cur - p) / 86400000) === 1) { s++; cur = p; } else break;
    }
    return s;
  };

  const loadHistory = () => {
    try {
      cleanHistory();
      const s = localStorage.getItem(getUserHistoryKey());
      if (s) {
        const a = JSON.parse(s);
        (Array.isArray(a) ? a : []).sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
        setLessonHistory(Array.isArray(a) ? a : []);
      } else setLessonHistory([]);
    } catch { setLessonHistory([]); }
  };

  const loadDbHistory = async () => {
    try {
      const localHistory = JSON.parse(localStorage.getItem(getUserHistoryKey()) || "[]");
      if (!localHistory.length) return;

      const enriched = await Promise.all(
        localHistory.map(async (item) => {
          try {
            const dbData = await getVideoProgressFromDB(item.lessonID);
            if (dbData && (dbData.isCompleted || dbData.watchDurationSec > 0)) {
              let dbProgress = 0;
              if (dbData.isCompleted) {
                dbProgress = 100;
              } else if (dbData.totalDurationSec > 0) {
                dbProgress = Math.min(99, Math.round((dbData.lastPositionSec / dbData.totalDurationSec) * 100));
              }
              const finalProgress = Math.max(item.progress || 0, dbProgress);
              return { ...item, progress: finalProgress, isCompleted: dbData.isCompleted || finalProgress === 100 };
            }
            return item;
          } catch { return item; }
        })
      );
      setDbLessonHistory(enriched);
    } catch { }
  };

  const loadStats = () => {
    try {
      const s = localStorage.getItem(getUserHistoryKey());
      if (s) {
        const h = JSON.parse(s);
        const streak = calcStreak(h);
        setStreakDays(streak);
        const tot = h.length, comp = h.filter(x => x.progress >= 100).length, rate = tot > 0 ? ((comp / tot) * 100).toFixed(1) : 0;
        const wa = new Date(Date.now() - 7 * 86400000), wk = h.filter(x => new Date(x.lastWatched) >= wa);
        const wm = wk.reduce((s, x) => s + (Number(x.watchedMinutes) || 0), 0);
        setStatsData({
          khoahoc: { currentLevel: `Level ${Math.floor(tot / 10) + 1}`, xpToNext: 100 - (tot % 10) * 10 },
          streak: { days: streak, message: streak > 0 ? `Tuyệt vời! Bạn đã học ${streak} ngày liên tiếp!` : "Bắt đầu học ngay hôm nay!" },
          luyentap: { lessonsCompleted: tot, averageScore: `${rate}%` },
          timeSpent: { time: toHM(wm), times: "Tuần này" },
          weeklyGoal: { lessons: { completed: wk.length, total: 7 }, studyTime: { completed: Math.round(wm), total: 300, unit: "min" } },
        });
      } else { setStreakDays(0); setStatsData(emptyData.stats); }
    } catch { setStreakDays(0); setStatsData(emptyData.stats); }
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem video?")) {
      localStorage.removeItem(getUserHistoryKey());
      loadHistory();
      loadStats();
    }
  };

  const loadPlacementRecommendation = async (attemptId) => {
    try {
      const recommendation = await getPlacementRecommendation(attemptId);
      setPlacementRecommendation(recommendation);
      setShowRecommendationModal(true);
    } catch (error) {
      console.error('Error loading recommendation:', error);
      alert('Không thể tải đề xuất khóa học. Vui lòng thử lại!');
    }
  };

  // ─── Effects ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const name = localStorage.getItem("userName") || "Student";
        const token = localStorage.getItem("accessToken");
        setUser({ ...emptyData.user, name });
        setStatsData(emptyData.stats);
        if (token) {
          const md = await checkMembership();
          setHasMembership(md.hasMembership);
          setMembershipInfo(md);
          loadHistory();
          loadStats();
          await loadDbHistory();
        } else {
          setHasMembership(false);
          setMembershipInfo(null);
          setLessonHistory([]);
        }
      } catch {
        setUser(emptyData.user);
        setStatsData(emptyData.stats);
        setLessonHistory([]);
        setHasMembership(false);
        setMembershipInfo(null);
      } finally { setIsLoading(false); }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "khoahoc") {
      setLoadingCourses(true);
      getCourses().then(r => setCourses(r.courses || [])).catch(console.error).finally(() => setLoadingCourses(false));
    }
  }, [activeTab]);

  useEffect(() => {
    const h = () => { loadHistory(); loadStats(); };
    window.addEventListener("videoHistoryUpdated", h);
    return () => window.removeEventListener("videoHistoryUpdated", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "baihoc") { loadHistory(); loadStats(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "review") return;
    setReviewLoading(true);
    Promise.all([
      getReviewList().catch(() => []),
      getPlacementTests().catch(() => []),
    ]).then(([list, tests]) => {
      setReviewList(list);
      setPlacementTests(tests);
    }).finally(() => setReviewLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─── UI Data ────────────────────────────────────────────────────
  const tabs = [
    { id: "luyentap", label: "Luyện tập" },
    { id: "khoahoc", label: "Khóa học" },
    { id: "baihoc", label: "Lịch sử xem" },
    { id: "review", label: "Đánh giá & Review" },
  ];

  const filterLevels = [
    { id: "all", label: "Tất cả" },
    { id: "watching", label: "Đang xem" },
    { id: "completed", label: "Đã hoàn thành" },
  ];

  const filteredDB = !dbLessonHistory.length ? [] :
    selectedLevel === "watching" ? dbLessonHistory.filter(l => l.progress < 100) :
      selectedLevel === "completed" ? dbLessonHistory.filter(l => l.progress >= 100) :
        dbLessonHistory;

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="home-page">
      {isLoading ? (
        <Container>
          <div className="loading text-center py-5">
            <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        </Container>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HERO                                                           */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="welcome-section">
            <Container>
              <div className="hero-inner">
                <div className="hero-text">
                  <div className="hero-badge">
                    <FontAwesomeIcon icon={faStar} style={{ color: "#f9c74f" }} />
                    Nền tảng học tập thông minh
                  </div>
                  <h1>
                    Chào mừng trở lại,{" "}
                    <span className="highlight">{user?.name || "User"}!</span>
                  </h1>
                  <p className="welcome-sub">Tiếp tục hành trình học tập của bạn hôm nay nhé 🚀</p>
                </div>

                <div className="hero-illustration" aria-hidden="true">
                  <div className="blob-shape b1" />
                  <div className="blob-shape b2" />
                  <div className="blob-shape b3" />
                  <div className="blob-shape b4" />
                  <FontAwesomeIcon icon={faGraduationCap} className="hero-icon" />
                </div>
              </div>
            </Container>
          </div>

          <Container>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TABS NAVIGATION                                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Row className="lessons-nav">
              <Col>
                <div className="tab-navigation mb-4">
                  {tabs.map(t => (
                    <button key={t.id} className={`tab-item${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </Col>
            </Row>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB: Lịch sử xem                                               */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "baihoc" && (
              <div className="lessons-section">
                {hasMembership ? (
                  <>
                    <div className="lessons-header">
                      <div className="header-left">
                        <h4>Lịch sử xem video</h4>
                        <p>Các video bài học bạn đã và đang xem trong các khóa học.</p>
                      </div>
                      <div className="header-right">
                        {lessonHistory.length > 0 && (
                          <Button variant="outline-danger" size="sm" onClick={handleClearHistory}>
                            <FontAwesomeIcon icon={faTrash} className="me-1" />Xóa lịch sử
                          </Button>
                        )}
                        <div className="membership-badge">
                          <FontAwesomeIcon icon={faTrophy} /><span>{membershipInfo?.planName || "Premium"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="level-filters">
                      {filterLevels.map(lv => (
                        <button key={lv.id} className={`level-filter-item${selectedLevel === lv.id ? " active" : ""}`} onClick={() => setSelectedLevel(lv.id)}>
                          {lv.label}
                        </button>
                      ))}
                    </div>

                    {filteredDB.length > 0 ? (
                      <Row className="g-3">
                        {filteredDB.map(lesson => (
                          <Col md={6} lg={4} key={lesson.id}>
                            <div style={{
                              background: "#fff", borderRadius: "20px", overflow: "hidden", border: "1.5px solid #e5e7eb", boxShadow: "0 4px 24px rgba(0,0,0,.07)", height: "100%", display: "flex", flexDirection: "column", transition: "transform .22s,box-shadow .22s,border-color .22s"
                            }}
                              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-7px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,200,150,.18)"; e.currentTarget.style.borderColor = "#00c896"; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,.07)"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                            >
                              <div style={{ height: "175px", backgroundImage: `url(${getVideoThumbnail(lesson)})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative", cursor: "pointer" }} onClick={() => navigate(`/course/${lesson.courseID}`)}>
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.1))" }} />
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <FontAwesomeIcon icon={faVideo} size="4x" style={{ color: "rgba(255,255,255,.22)", zIndex: 1 }} />
                                </div>
                                <div className="play-overlay" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,.22)", backdropFilter: "blur(4px)", border: "2px solid rgba(255,255,255,.7)", borderRadius: "50%", width: "54px", height: "54px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .22s" }}>
                                  <FontAwesomeIcon icon={faPlay} style={{ color: "#fff", marginLeft: "3px" }} />
                                </div>
                                <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,255,255,.96)", color: lesson.progress >= 100 ? "#059669" : "#00a87c", fontWeight: 800, fontSize: ".76rem", padding: "5px 13px", borderRadius: "100px", boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
                                  {lesson.progress >= 100 ? <><FontAwesomeIcon icon={faCheckCircle} className="me-1" />Hoàn thành</> : `${lesson.progress}%`}
                                </div>
                                {lesson.progress < 100 && (
                                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "rgba(255,255,255,.25)" }}>
                                    <div style={{ height: "100%", width: `${lesson.progress}%`, background: "#f9c74f", transition: "width .3s" }} />
                                  </div>
                                )}
                              </div>

                              <div style={{ padding: "1.2rem 1.35rem 1.4rem", display: "flex", flexDirection: "column", flex: 1 }}>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <FontAwesomeIcon icon={faBookOpen} style={{ color: "#00c896", fontSize: "13px" }} />
                                  <small style={{ color: "#9ca3af" }} className="text-truncate">{lesson.courseName}</small>
                                </div>
                                <h6 style={{ fontWeight: 800, fontSize: "15px", marginBottom: ".55rem", color: "#111827" }}>{lesson.lessonTitle}</h6>
                                <p style={{ color: "#9ca3af", fontSize: ".8rem", marginBottom: ".75rem" }}>
                                  <FontAwesomeIcon icon={faClock} className="me-1" />{fmtDT(lesson.lastWatched)}
                                </p>
                                <div className="d-flex justify-content-between mb-1" style={{ fontSize: ".8rem", color: "#374151" }}>
                                  <span><FontAwesomeIcon icon={faVideo} className="me-1" />Thời lượng: <strong>{fmtDur(lesson.duration)}</strong></span>
                                  <span style={{ fontWeight: 800, color: lesson.progress >= 100 ? "#059669" : "#00a87c" }}>{lesson.progress}%</span>
                                </div>
                                <div style={{ fontSize: ".8rem", color: "#374151", marginBottom: "1rem" }}>
                                  <FontAwesomeIcon icon={faClock} className="me-1" />Đã xem: <strong style={{ color: lesson.progress >= 100 ? "#059669" : "inherit" }}>{fmtDur(lesson.watchedMinutes)}</strong>
                                </div>
                                {lesson.progress > 0 && lesson.progress < 100 && (
                                  <div style={{ height: "7px", background: "#e6faf4", borderRadius: "99px", marginBottom: "1rem", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${lesson.progress}%`, background: "#00c896", borderRadius: "99px" }} />
                                  </div>
                                )}
                                <button
                                  style={{
                                    ...mintBtn({ padding: ".6rem 1rem", fontSize: ".88rem", width: "100%", background: lesson.progress >= 100 ? "transparent" : "#00c896", border: lesson.progress >= 100 ? "2px solid #10b981" : "none", color: lesson.progress >= 100 ? "#059669" : "#fff" })
                                  }}
                                  onMouseEnter={e => { if (lesson.progress < 100) { e.currentTarget.style.background = "#00a87c"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,200,150,.35)"; } }}
                                  onMouseLeave={e => { if (lesson.progress < 100) { e.currentTarget.style.background = "#00c896"; e.currentTarget.style.boxShadow = ""; } }}
                                  onClick={() => navigate(`/course/${lesson.courseID}`)}
                                >
                                  <FontAwesomeIcon icon={lesson.progress >= 100 ? faCheckCircle : faPlay} style={{ marginRight: "8px" }} />
                                  {lesson.progress >= 100 ? "Xem lại" : lesson.progress > 0 ? "Tiếp tục xem" : "Bắt đầu xem"}
                                </button>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div className="text-center py-5">
                        <FontAwesomeIcon icon={faBookOpen} size="3x" style={{ color: "#d1d5db", marginBottom: "1rem" }} />
                        <p style={{ color: "#9ca3af", fontWeight: 600 }}>
                          {lessonHistory.length === 0 ? "Bạn chưa xem video nào. Hãy bắt đầu học ngay!" : selectedLevel === "watching" ? "Không có video đang xem dở." : "Không có video đã hoàn thành."}
                        </p>
                        {lessonHistory.length === 0
                          ? <button style={mintBtn({ padding: ".7rem 2rem", fontSize: ".9rem" })} onClick={() => setActiveTab("khoahoc")} onMouseEnter={e => { Object.assign(e.currentTarget.style, mintBtnHover); }} onMouseLeave={e => { e.currentTarget.style.background = "#00c896"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}>Xem khóa học</button>
                          : <button style={{ ...mintBtn({ padding: ".65rem 2rem", fontSize: ".9rem", background: "transparent", border: "2px solid #00c896", color: "#00a87c" }) }} onClick={() => setSelectedLevel("all")}>Xem tất cả</button>
                        }
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faLock} size="3x" style={{ color: "#d1d5db" }} />
                    <h5 style={{ fontWeight: 800, color: "#111827", marginTop: "1rem" }}>Cần có gói Membership để truy cập khóa học</h5>
                    <p style={{ color: "#9ca3af", maxWidth: "400px", margin: ".5rem auto 1.5rem" }}>Đăng ký để mở khóa toàn bộ khóa học và xem video bài học.</p>
                    <button style={mintBtn({ padding: ".8rem 2.5rem", fontSize: "1rem" })} onClick={() => navigate("/membership")} onMouseEnter={e => { Object.assign(e.currentTarget.style, mintBtnHover); }} onMouseLeave={e => { e.currentTarget.style.background = "#00c896"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}>
                      Xem các gói Membership
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB: Khóa học                                                  */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "khoahoc" && (
              <div style={{ marginBottom: "2rem" }}>
                {loadingCourses ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: "#00c896" }} role="status"><span className="visually-hidden">Loading...</span></div>
                    <p style={{ color: "#374151", fontWeight: 600, marginTop: "1rem" }}>Đang tải dữ liệu khóa học...</p>
                  </div>
                ) : !courses || courses.length === 0 ? (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faGraduationCap} size="3x" style={{ color: "#d1d5db" }} />
                    <p style={{ color: "#9ca3af", fontWeight: 600, marginTop: "1rem" }}>Hiện chưa có khóa học nào</p>
                  </div>
                ) : (
                  <Row className="g-3">
                    {courses.map(course => {
                      const lv = getLevel(course.courseLevel);
                      return (
                        <Col md={6} lg={4} key={course.courseID}>
                          <div
                            className="course-card"
                            data-level={Number(course.courseLevel) || 1}
                            style={{ borderRadius: "20px", overflow: "hidden", background: "#fff", height: "100%", display: "flex", flexDirection: "column", border: "1.5px solid #e5e7eb", boxShadow: "0 4px 24px rgba(0,0,0,.07)", transition: "transform .22s,box-shadow .22s,border-color .22s" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-7px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,200,150,.18)"; e.currentTarget.style.borderColor = "#00c896"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,.07)"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                          >
                            <div style={{ position: "relative", height: "178px", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: `url(${getCourseImage(course.courseID)})`, backgroundSize: "cover", backgroundPosition: "center" }} onClick={() => navigate(`/course/${course.courseID}`)}>
                              <div className="thumb-overlay" style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(0,0,0,0.4), transparent)` }} />
                              <div style={{ position: "absolute", top: "14px", left: "14px", background: lv.badge, color: lv.text, fontWeight: 800, fontSize: ".76rem", padding: "5px 15px", borderRadius: "100px", boxShadow: "0 2px 10px rgba(0,0,0,.1)", zIndex: 2 }}>
                                {lv.label}
                              </div>
                            </div>

                            <div style={{ padding: "1.3rem 1.4rem 1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>
                              <h5 style={{ fontWeight: 800, fontSize: "1.02rem", color: "#111827", marginBottom: ".2rem" }}>{course.courseName}</h5>
                              <p style={{ fontSize: ".82rem", color: "#9ca3af", marginBottom: ".85rem" }}>
                                Level {course.courseLevel}{course.description ? `: ${course.description}` : ""}
                              </p>

                              {/* Removed info section */}

                              {course.teacherID && (
                                <div
                                  style={{ display: "flex", alignItems: "center", gap: ".55rem", padding: ".5rem .85rem", background: "#e6faf4", borderRadius: "12px", marginBottom: ".9rem", cursor: "pointer", transition: "all .22s" }}
                                  onClick={e => { e.stopPropagation(); navigate(`/teacherinfo/${course.teacherID}`); }}
                                  onMouseEnter={e => { e.currentTarget.style.background = "#b3f0de"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "#e6faf4"; e.currentTarget.style.transform = ""; }}
                                >
                                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#00c896", color: "#fff", fontWeight: 800, fontSize: ".85rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {course.teacherName ? course.teacherName.charAt(0).toUpperCase() : "T"}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: ".7rem", color: "#00a87c", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" }}>Giảng viên</span>
                                    {course.teacherName && <span style={{ fontSize: ".86rem", color: "#111827", fontWeight: 700 }}>{course.teacherName}</span>}
                                  </div>
                                  <FontAwesomeIcon icon={faChevronRight} style={{ color: "#00a87c", fontSize: ".72rem" }} />
                                </div>
                              )}

                              <div style={{ display: "flex", alignItems: "center", gap: ".55rem", marginTop: "auto" }}>
                                <button
                                  style={mintBtn({ flex: 1, padding: ".65rem 1rem", fontSize: ".88rem" })}
                                  onClick={() => navigate(`/course/${course.courseID}`)}
                                  onMouseEnter={e => { Object.assign(e.currentTarget.style, mintBtnHover); }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "#00c896"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB: Luyện tập                                                 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "luyentap" && (
              <div className="practice-section">
                <h4>Luyện tập kỹ năng</h4>
                <Row className="g-3">
                  {SKILLS.map((skill, i) => (
                    <Col md={4} key={i}>
                      <div
                        className={`skill-card${(!skill.premium || hasMembership) ? "" : " skill-locked"}`}
                        onClick={() => { if (!skill.premium || hasMembership) navigate(skill.path); else navigate("/membership"); }}
                      >
                        <div className="skill-icon-wrapper" style={{ backgroundColor: skill.bg }}>
                          <FontAwesomeIcon icon={skill.icon} className="skill-icon" style={{ color: skill.color }} />
                        </div>
                        <h6 className="skill-title">{skill.title}</h6>
                        {skill.premium && !hasMembership && <div className="premium-lock"><FontAwesomeIcon icon={faLock} /></div>}
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB: Review & Placement Test                                   */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "review" && (
              <div className="review-section" style={{ padding: "1.5rem 0" }}>
                {reviewLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: "#00c896" }} role="status"><span className="visually-hidden">Loading...</span></div>
                    <p style={{ color: "#374151", fontWeight: 600, marginTop: "1rem" }}>Đang tải dữ liệu review...</p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 style={{ fontWeight: 800 }}>Phản hồi từ Giáo viên</h4>
                      <Badge bg="success" style={{ padding: '.5rem .8rem', borderRadius: '8px' }}>
                        {reviewList.filter(s => s.isTeacherReviewed).length} bài đã chấm
                      </Badge>
                    </div>

                    {(() => {
                      const writingList = reviewList.filter(s => !isSpeakingSubmission(s));
                      const speakingList = reviewList.filter(s => isSpeakingSubmission(s));

                      const openDetail = async (sub, type) => {
                        setReviewDetail({ _loading: true, _meta: sub, _type: type });
                        try {
                          const d = await getReviewDetail(sub.submissionId);
                          setReviewDetail({ ...d, _meta: sub, _type: type });
                        } catch {
                          setReviewDetail({ _error: true, _meta: sub, _type: type });
                        }
                      };

                      const renderCard = (list, type) => {
                        const isSpeak = type === 'speaking';
                        const accent = isSpeak ? '#ec4899' : '#f97316';
                        const bg = isSpeak ? '#fdf2f8' : '#fff7ed';
                        const brdr = isSpeak ? '#fce7f3' : '#d1fae5';
                        const icon = isSpeak ? faMicrophone : faPencilAlt;
                        return (
                          <Col md={12} lg={6} key={type}>
                            <Card className="detail-card h-100" style={{ borderTop: `4px solid ${accent}` }}>
                              <Card.Body>
                                <div className="d-flex align-items-center mb-4">
                                  <div style={{ background: bg, padding: '12px', borderRadius: '12px', marginRight: '12px' }}>
                                    <FontAwesomeIcon icon={icon} size="lg" style={{ color: accent }} />
                                  </div>
                                  <div>
                                    <h5 className="mb-0" style={{ fontWeight: 800 }}>{isSpeak ? 'Kỹ năng Nói (Speaking)' : 'Kỹ năng Viết (Writing)'}</h5>
                                    <small className="text-muted">{list.length} bài đã nộp</small>
                                  </div>
                                </div>

                                {list.length === 0 ? (
                                  <div className="text-center py-4" style={{ color: '#9ca3af' }}>
                                    <FontAwesomeIcon icon={icon} size="2x" className="mb-2" />
                                    <p>Bạn chưa nộp bài {isSpeak ? 'Speaking' : 'Writing'} nào.<br />Vào mục <strong>Luyện tập</strong> để bắt đầu!</p>
                                  </div>
                                ) : (
                                  list.slice(0, 3).map(sub => (
                                    <div key={sub.submissionId}
                                      className="p-3 mb-3"
                                      style={{
                                        background: sub.isTeacherReviewed ? '#fff' : '#f9fafb', borderRadius: '12px',
                                        border: `1px solid ${sub.isTeacherReviewed ? brdr : '#e5e7eb'}`,
                                        cursor: 'pointer', transition: 'all .2s'
                                      }}
                                      onClick={() => openDetail(sub, type)}
                                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                                    >
                                      <div className="d-flex justify-content-between align-items-start mb-1">
                                        <strong style={{ color: '#111827', fontSize: '.93rem' }}>{sub.prompt?.title || (isSpeak ? 'Speaking Task' : 'Writing Task')}</strong>
                                        {sub.isTeacherReviewed
                                          ? <Badge bg="success">Đã chấm</Badge>
                                          : <Badge bg="secondary">AI chấm</Badge>}
                                      </div>
                                      <div className="d-flex gap-3 mt-1 align-items-center">
                                        <small style={{ color: '#6b7280' }}>
                                          <FontAwesomeIcon icon={faStar} style={{ color: '#f59e0b', marginRight: 4 }} />
                                          Điểm: {sub.scoreOverall ?? '—'}
                                        </small>
                                        <small className="text-muted ms-auto">{fmtVN(sub.createdAt)}</small>
                                      </div>
                                    </div>
                                  ))
                                )}

                                {list.length > 3 && (
                                  <Button
                                    variant={isSpeak ? 'outline-danger' : 'outline-warning'}
                                    className="w-100 mt-2"
                                    style={{
                                      borderRadius: '10px', fontWeight: 600,
                                      color: isSpeak ? '#db2777' : '#d97706',
                                      borderColor: isSpeak ? '#db2777' : '#d97706'
                                    }}
                                    onClick={() => setReviewDetail({ _listMode: true, _type: type, _list: list })}>
                                    Xem tất cả {list.length} bài {isSpeak ? 'Nói' : 'Viết'}
                                  </Button>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      };

                      return (
                        <Row className="g-4 mb-5">
                          {renderCard(writingList, 'writing')}
                          {renderCard(speakingList, 'speaking')}
                        </Row>
                      );
                    })()}

                    {/* ─── Review Detail Modal ─── */}
                    <Modal show={!!reviewDetail} onHide={() => setReviewDetail(null)} size="lg" centered>
                      <Modal.Header closeButton style={{ background: reviewDetail?._type === "speaking" ? '#fdf2f8' : '#fff7ed', borderBottom: '2px solid #e5e7eb' }}>
                        <Modal.Title style={{ fontWeight: 800 }}>
                          <FontAwesomeIcon
                            icon={reviewDetail?._type === "speaking" ? faMicrophone : faPencilAlt}
                            style={{ color: reviewDetail?._type === "speaking" ? '#ec4899' : '#f97316', marginRight: 10 }} />
                          {reviewDetail?._listMode
                            ? `Tất cả bài ${reviewDetail._type === "speaking" ? 'Speaking' : 'Writing'}`
                            : (reviewDetail?.prompt?.title || reviewDetail?._meta?.prompt?.title || 'Chi tiết bài nộp')}
                        </Modal.Title>
                      </Modal.Header>
                      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {reviewDetail?._loading && (
                          <div className="text-center py-5">
                            <div className="spinner-border" style={{ color: '#00c896' }} role="status" />
                            <p className="mt-3">Đang tải chi tiết...</p>
                          </div>
                        )}
                        {reviewDetail?._error && (
                          <div className="text-center py-5 text-danger">Không thể tải dữ liệu. Vui lòng thử lại.</div>
                        )}
                        {reviewDetail?._listMode && (
                          <div>
                            {(reviewDetail._list || []).map(sub => {
                              const openDetail = async () => {
                                setReviewDetail({ _loading: true, _meta: sub, _type: reviewDetail._type });
                                try {
                                  const d = await getReviewDetail(sub.submissionId);
                                  setReviewDetail({ ...d, _meta: sub, _type: reviewDetail._type });
                                } catch { setReviewDetail({ _error: true, _meta: sub, _type: reviewDetail._type }); }
                              };
                              return (
                                <div key={sub.submissionId} className="p-3 mb-3"
                                  style={{ background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                  onClick={openDetail}>
                                  <div className="d-flex justify-content-between align-items-start">
                                    <strong>{sub.prompt?.title || 'Task'}</strong>
                                    {sub.isTeacherReviewed ? <Badge bg="success">Đã chấm</Badge> : <Badge bg="secondary">AI chấm</Badge>}
                                  </div>
                                  <small className="text-muted">{fmtVN(sub.createdAt)} • Điểm: {sub.scoreOverall ?? '—'}</small>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {reviewDetail && !reviewDetail._loading && !reviewDetail._error && !reviewDetail._listMode && (
                          <div>
                            <div className="d-flex gap-2 mb-3 flex-wrap">
                              {reviewDetail.teacherReview
                                ? <Badge bg="success" style={{ padding: '.4rem .7rem' }}>Đã chấm bởi Giáo viên</Badge>
                                : <Badge bg="secondary" style={{ padding: '.4rem .7rem' }}>AI chấm</Badge>}
                              <Badge bg="light" text="dark" style={{ padding: '.4rem .7rem', border: '1px solid #e5e7eb' }}>
                                Nộp lúc: {fmtVN(reviewDetail._meta?.createdAt)}
                              </Badge>
                            </div>

                            {reviewDetail.prompt && (
                              <div className="mb-3 p-3" style={{ background: '#f0f9ff', borderRadius: '10px', borderLeft: '3px solid #3b82f6' }}>
                                <strong style={{ color: '#1e40af' }}>Đề bài:</strong>
                                <p className="mb-0 mt-1" style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{reviewDetail.prompt.content}</p>
                              </div>
                            )}

                            {(reviewDetail.answer?.transcript || reviewDetail.answer?.answerText) && (
                              <div className="mb-3 p-3" style={{ background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                <strong>Bài làm / Transcript:</strong>
                                <p className="mb-0 mt-2" style={{ whiteSpace: 'pre-wrap', color: '#374151', fontSize: '.87rem', maxHeight: '160px', overflowY: 'auto' }}>
                                  {reviewDetail.answer.transcript || reviewDetail.answer.answerText}
                                </p>
                              </div>
                            )}

                            {reviewDetail.aiReview && (
                              <div className="mb-3">
                                <h6 style={{ fontWeight: 800, color: '#f97316', marginBottom: '10px' }}>Điểm AI chấm</h6>
                                <Row className="g-2">
                                  {[
                                    { label: 'Overall', v: reviewDetail.aiReview.scoreOverall, color: '#f59e0b' },
                                    { label: 'Fluency', v: reviewDetail.aiReview.scoreFluency, color: '#3b82f6' },
                                    { label: 'Lexical', v: reviewDetail.aiReview.scoreLexical, color: '#8b5cf6' },
                                    { label: 'Grammar', v: reviewDetail.aiReview.scoreGrammar, color: '#10b981' },
                                    { label: 'Pronunciation', v: reviewDetail.aiReview.scorePronunciation, color: '#ec4899' },
                                    { label: 'Coherence', v: reviewDetail.aiReview.scoreCoherence, color: '#06b6d4' },
                                  ].filter(s => s.v != null).map((s, i) => (
                                    <Col xs={6} md={4} key={i}>
                                      <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px', textAlign: 'center', border: `2px solid ${s.color}30` }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.v}</div>
                                        <div style={{ fontSize: '.78rem', color: '#6b7280' }}>{s.label}</div>
                                      </div>
                                    </Col>
                                  ))}
                                </Row>
                                {reviewDetail.aiReview.feedback && (
                                  <div className="mt-3 p-3" style={{ background: '#fff7ed', borderRadius: '10px', borderLeft: '3px solid #f97316' }}>
                                    <strong style={{ color: '#c2410c' }}>Nhận xét AI:</strong>
                                    <p className="mb-0 mt-1" style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{reviewDetail.aiReview.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {reviewDetail.teacherReview && (
                              <div className="mt-2">
                                <h6 style={{ fontWeight: 800, color: '#10b981', marginBottom: '10px' }}>Nhận xét của Giáo viên</h6>
                                <Row className="g-2 mb-3">
                                  {[
                                    { label: 'Overall', v: reviewDetail.teacherReview.scoreOverall, color: '#f59e0b' },
                                    { label: 'Task', v: reviewDetail.teacherReview.scoreTask, color: '#3b82f6' },
                                    { label: 'Lexical', v: reviewDetail.teacherReview.scoreLexial, color: '#8b5cf6' },
                                    { label: 'Grammar', v: reviewDetail.teacherReview.scoreGrammar, color: '#10b981' },
                                    { label: 'Pronunciation', v: reviewDetail.teacherReview.scorePronunciation, color: '#ec4899' },
                                    { label: 'Fluency', v: reviewDetail.teacherReview.scoreFluency, color: '#3b82f6' },
                                    { label: 'Coherence', v: reviewDetail.teacherReview.scoreCoherence, color: '#06b6d4' },
                                  ].filter(s => s.v != null && s.v !== 0).map((s, i) => (
                                    <Col xs={6} md={4} key={i}>
                                      <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '10px', textAlign: 'center', border: `2px solid ${s.color}30` }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.v}</div>
                                        <div style={{ fontSize: '.78rem', color: '#6b7280' }}>{s.label}</div>
                                      </div>
                                    </Col>
                                  ))}
                                </Row>
                                {reviewDetail.teacherReview.feedback && (
                                  <div className="p-3" style={{ background: '#f0fdf4', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                                    <strong style={{ color: '#065f46' }}>Nhận xét:</strong>
                                    <p className="mb-0 mt-1" style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{reviewDetail.teacherReview.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setReviewDetail(null)}>Đóng</Button>
                      </Modal.Footer>
                    </Modal>

                    {/* ─── Placement Test ─── */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 style={{ color: "#1e293b", fontWeight: 800 }}>Bài kiểm tra đầu vào (Placement Test)</h4>
                    </div>
                    <Card className="detail-card mb-4"
                      style={{ background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 100%)", border: "1px solid #bfdbfe", boxShadow: "0 10px 25px rgba(59,130,246,0.08)" }}>
                      <Card.Body className="p-4 p-md-5 d-flex flex-column flex-md-row align-items-center justify-content-between">
                        <div className="mb-4 mb-md-0 d-flex align-items-center">
                          <div style={{ background: "#fff", padding: "20px", borderRadius: "50%", marginRight: "28px", boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}>
                            <FontAwesomeIcon icon={faRocket} size="3x" style={{ color: "#3b82f6" }} />
                          </div>
                          <div>
                            <h3 style={{ fontWeight: 800, color: "#1e3a8a", marginBottom: "10px" }}>Placement Test</h3>
                            <p style={{ color: "#475569", fontSize: "1.05rem", maxWidth: "600px", marginBottom: "12px", lineHeight: "1.5" }}>
                              Đánh giá toàn diện năng lực trong 30 phút để AI và Giáo viên đề xuất lộ trình học tập phù hợp nhất.
                            </p>
                            {placementTests.length > 0 && (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {placementTests.map(t => (
                                  <Badge key={t.quizID} bg="light" text="dark"
                                    style={{ padding: ".4rem .7rem", border: "1px solid #bfdbfe", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                                    onClick={() => navigate(`/quiz/start/${t.quizID}`)}>
                                    {t.title}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 mt-md-0 text-center">
                          {placementTests.length > 0 ? (
                            <Button
                              style={{ background: "#2563eb", border: "none", padding: "14px 34px", fontSize: "1.1rem", fontWeight: 700, borderRadius: "14px", boxShadow: "0 8px 20px rgba(37,99,235,0.3)" }}
                              onClick={() => navigate(`/quiz/start/${placementTests[0].quizID}`)}>
                              Tham gia ngay <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
                            </Button>
                          ) : (
                            <Button style={{ background: "#94a3b8", border: "none", padding: "14px 34px", fontSize: "1.1rem", fontWeight: 700, borderRadius: "14px" }} disabled>
                              Chưa có bài test
                            </Button>
                          )}
                          <div className="mt-2 text-muted" style={{ fontSize: '0.8rem' }}>Hoàn toàn miễn phí</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Placement Test Recommendation Modal                            */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Modal show={showRecommendationModal} onHide={() => setShowRecommendationModal(false)} size="lg" centered>
              <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderBottom: 'none' }}>
                <Modal.Title style={{ fontWeight: 800 }}>
                  <FontAwesomeIcon icon={faRocket} className="me-2" />
                  Kết quả & Đề xuất khóa học
                </Modal.Title>
              </Modal.Header>
              <Modal.Body style={{ padding: '2rem' }}>
                {placementRecommendation && (
                  <>
                    <div className="text-center mb-4 p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '16px', border: '2px solid #bae6fd' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0284c7', marginBottom: '.5rem' }}>
                        {placementRecommendation.score.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0369a1' }}>
                        Trình độ: {placementRecommendation.levelName}
                      </div>
                      <Badge bg="info" style={{ marginTop: '.5rem', padding: '.4rem .8rem', fontSize: '.9rem' }}>
                        Level {placementRecommendation.level}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <h5 style={{ fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>
                        <FontAwesomeIcon icon={faGraduationCap} style={{ color: '#00c896', marginRight: '8px' }} />
                        Khóa học được đề xuất
                      </h5>
                      {placementRecommendation.recommendedCourses && placementRecommendation.recommendedCourses.length > 0 ? (
                        <div>
                          {placementRecommendation.recommendedCourses.map(course => (
                            <div key={course.courseID}
                              className="p-3 mb-3"
                              style={{
                                background: '#f0fdf4',
                                borderRadius: '12px',
                                border: '2px solid #bbf7d0',
                                cursor: 'pointer',
                                transition: 'all .2s'
                              }}
                              onClick={() => {
                                setShowRecommendationModal(false);
                                navigate(`/course/${course.courseID}`);
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#dcfce7';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.2)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#f0fdf4';
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '';
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 style={{ fontWeight: 800, color: '#111827', marginBottom: '.3rem' }}>
                                    {course.courseName}
                                  </h6>
                                  <p style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: 0 }}>
                                    {course.description}
                                  </p>
                                </div>
                                <Badge bg="success" style={{ padding: '.4rem .7rem' }}>
                                  Level {course.courseLevel}
                                </Badge>
                              </div>
                              <div className="d-flex align-items-center gap-2" style={{ fontSize: '.8rem', color: '#6b7280' }}>
                                <FontAwesomeIcon icon={faBookOpen} style={{ color: '#00c896' }} />
                                <span>Khóa học phù hợp với trình độ của bạn</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3" style={{ color: '#9ca3af' }}>
                          Chưa có đề xuất khóa học phù hợp
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowRecommendationModal(false)}
                  style={{ borderRadius: '10px', fontWeight: 600 }}
                >
                  Đóng
                </Button>
                <Button
                  style={{
                    background: '#00c896',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    padding: '.5rem 1.5rem'
                  }}
                  onClick={() => {
                    setShowRecommendationModal(false);
                    setActiveTab('khoahoc');
                  }}
                >
                  Xem tất cả khóa học
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AI FAB BUTTON                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!showAIChat && (
        <button className="ai-fab-btn" onClick={() => setShowAIChat(true)} title="Chat với AI">
          <span className="ai-fab-label">
            AI
            <svg width="14" height="14" viewBox="0 0 15 15" style={{ marginLeft: "2px", verticalAlign: "middle", position: "relative", top: "-1px" }}>
              <polygon points="7.5,1.5 9.3,5.6 14,5.8 10.5,8.6 11.7,12.8 7.5,10.4 3.3,12.8 4.5,8.6 1,5.8 5.7,5.6" fill="#f9c74f" stroke="#f9c74f" strokeWidth="0.5" />
            </svg>
          </span>
        </button>
      )}

      {showAIChat && <AIChat isVisible={showAIChat} onClose={() => setShowAIChat(false)} />}
    </div>
  );
};

export default Home;