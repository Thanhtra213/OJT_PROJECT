import React, { useState, useEffect } from "react";
import AIChat from "../AIChat/AI";
import { Container, Row, Col, Card, ProgressBar, Button, Badge, Modal, Table } from "react-bootstrap";
import "./Home.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { getCourses } from "../../middleware/courseAPI";
import { checkMembership } from "../../middleware/membershipAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
<<<<<<< HEAD
  faTrophy,
  faFire,
  faBookOpen,
  faCheckCircle,
  faClock,
  faLock,
  faGraduationCap,
  faLayerGroup,
  faMicrophone,
  faHeadphones,
  faPencilAlt,
  faFileAlt,
  faComments,
  faTrash,
  faPlay,
  faVideo,
  faListCheck
} from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  // ===== State =====
  const [showAIChat, setShowAIChat] = useState(false);
  const [user, setUser] = useState(null);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [lessonHistory, setLessonHistory] = useState([]);
  const [streakDays, setStreakDays] = useState(0);
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [activeTab, setActiveTab] = useState("baihoc");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courses, setCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const navigate = useNavigate();

  const emptyData = {
    user: {
      name: "Student",
      xp: 0,
      streak: 0,
      level: 1,
      progress: 0
    },
    stats: {
      khoahoc: { currentLevel: "Level 1", xpToNext: 0 },
      streak: { days: 0, message: "Bắt đầu học ngay hôm nay!" },
      luyentap: { lessonsCompleted: 0, averageScore: "0%" },
      timeSpent: { time: "0h 0m", times: "This week" },
      weeklyGoal: {
        lessons: { completed: 0, total: 7 },
        studyTime: { completed: 0, total: 300, unit: "min" }
      }
    }
  };

  // ===== Helpers =====
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      Accept: "*/*",
      Authorization: token ? `Bearer ${token}` : undefined,
      "ngrok-skip-browser-warning": "true"
    };
  };

  const formatVNDateTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  };

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  };

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined || isNaN(minutes)) {
      return "0 phút";
    }
    const totalMinutes = Math.max(0, Math.round(Number(minutes)));
    if (totalMinutes === 0) {
      return "0 phút";
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      if (mins > 0) {
        return `${hours} giờ ${mins} phút`;
      }
      return `${hours} giờ`;
    }
    return `${mins} phút`;
  };

  const toHM = (minutes) => {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return "0 phút";
    const totalMinutes = Math.max(0, Math.round(Number(minutes)));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      if (mins > 0) return `${hours} giờ ${mins} phút`;
      return `${hours} giờ`;
    }
    return `${mins} phút`;
  };

  const cleanVideoHistoryData = () => {
    try {
      const userId = localStorage.getItem("userID");
      const historyKey = userId ? `videoWatchHistory_${userId}` : "videoWatchHistory";
      const historyStr = localStorage.getItem(historyKey);
      if (!historyStr) return;

      const history = JSON.parse(historyStr);
      if (!Array.isArray(history)) return;

      const cleanedHistory = history.map(entry => {
        const duration = Number(entry.duration) || 0;
        const watchedMinutes = Number(entry.watchedMinutes) || 0;
        const progress = Number(entry.progress) || 0;
        const finalProgress = progress >= 95 ? 100 : Math.min(progress, 100);

        return {
          ...entry,
          duration: Math.round(duration),
          watchedMinutes: Math.round(Math.min(watchedMinutes, duration)),
          progress: finalProgress,
        };
      });

      localStorage.setItem(historyKey, JSON.stringify(cleanedHistory));
      console.log("✅ Cleaned video history data for user:", userId);
      return cleanedHistory;
    } catch (error) {
      console.error("❌ Error cleaning video history:", error);
      return null;
    }
  };

  const openAttemptModal = () => setShowAttemptModal(true);
  const closeAttemptModal = () => setShowAttemptModal(false);

  const calculateStreak = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const getDateStr = (d) => new Date(d).toDateString();
    const uniqueDates = [
      ...new Set(arr.map((x) => getDateStr(x.submittedAt || x.lastWatched)))
    ].sort((a, b) => new Date(b) - new Date(a));

    if (uniqueDates.length === 0) return 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let streak = 1;
    let currentDate = new Date(uniqueDates[0]);
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor((currentDate - prevDate) / 86400000);
      if (dayDiff === 1) {
        streak++;
        currentDate = prevDate;
      } else break;
    }
    return streak;
  };

  // ===== Video History (localStorage) - USER SPECIFIC =====
  const loadLessonHistory = () => {
    try {
      cleanVideoHistoryData();

      const userId = localStorage.getItem("userID");
      const historyKey = userId ? `videoWatchHistory_${userId}` : "videoWatchHistory";
      const historyStr = localStorage.getItem(historyKey);
      
      if (historyStr) {
        const history = JSON.parse(historyStr);
        const historyArray = Array.isArray(history) ? history : [];
        historyArray.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
        console.log(`📚 Loaded lesson history for user ${userId}:`, historyArray);
        setLessonHistory(historyArray);
      } else {
        setLessonHistory([]);
      }
    } catch (error) {
      console.error("❌ Error loading history:", error);
      setLessonHistory([]);
    }
  };

  const loadStatsFromHistory = () => {
    try {
      const userId = localStorage.getItem("userID");
      const historyKey = userId ? `videoWatchHistory_${userId}` : "videoWatchHistory";
      const historyStr = localStorage.getItem(historyKey);
      
      if (historyStr) {
        const history = JSON.parse(historyStr);
        const calculatedStreak = calculateStreak(history);
        setStreakDays(calculatedStreak);

        const totalVideos = history.length;
        const completedVideos = history.filter(h => h.progress >= 100).length;
        const completionRate = totalVideos > 0 ? ((completedVideos / totalVideos) * 100).toFixed(1) : 0;

        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const thisWeek = history.filter(h => new Date(h.lastWatched) >= weekAgo);
        const weeklyVideos = thisWeek.length;
        const weeklyMinutes = thisWeek.reduce((sum, h) => sum + (Number(h.watchedMinutes) || 0), 0);

        setStatsData({
          khoahoc: {
            currentLevel: `Level ${Math.floor(totalVideos / 10) + 1}`,
            xpToNext: 100 - (totalVideos % 10) * 10
          },
          streak: {
            days: calculatedStreak,
            message: calculatedStreak > 0
              ? `Tuyệt vời! Bạn đã học ${calculatedStreak} ngày liên tiếp!`
              : "Bắt đầu học ngay hôm nay!"
          },
          luyentap: {
            lessonsCompleted: totalVideos,
            averageScore: `${completionRate}%`
          },
          timeSpent: {
            time: toHM(weeklyMinutes),
            times: "Tuần này"
          },
          weeklyGoal: {
            lessons: { completed: weeklyVideos, total: 7 },
            studyTime: { completed: Math.round(weeklyMinutes), total: 300, unit: "min" }
          }
        });
      } else {
        setStreakDays(0);
        setStatsData(emptyData.stats);
      }
    } catch (error) {
      console.error("❌ Error loading stats:", error);
      setStreakDays(0);
      setStatsData(emptyData.stats);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem video?")) {
      const userId = localStorage.getItem("userID");
      const historyKey = userId ? `videoWatchHistory_${userId}` : "videoWatchHistory";
      localStorage.removeItem(historyKey);
      console.log(`🗑️ Cleared history for user: ${userId}`);
      loadLessonHistory();
      loadStatsFromHistory();
    }
  };

  // ===== Attempts + Stats từ API (quiz) =====
  const loadAttemptsAndStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/attempts`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const attemptsArray = Array.isArray(data) ? data : [];
        setAttempts(attemptsArray);
      } else {
        setAttempts([]);
      }
    } catch (error) {
      console.error("❌ Error loading attempts:", error);
      setAttempts([]);
    }
  };

  // ===== Effects =====
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const userName = localStorage.getItem("userName") || "Student";
        const token = localStorage.getItem("accessToken");

        setUser({ ...emptyData.user, name: userName });
        setStatsData(emptyData.stats);

        if (token) {
          const membershipData = await checkMembership();
          setHasMembership(membershipData.hasMembership);
          setMembershipInfo(membershipData);

          loadLessonHistory();
          loadStatsFromHistory();
          await loadAttemptsAndStats();
        } else {
          setHasMembership(false);
          setMembershipInfo(null);
          setLessonHistory([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setUser(emptyData.user);
        setStatsData(emptyData.stats);
        setLessonHistory([]);
        setHasMembership(false);
        setMembershipInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "khoahoc") {
      setLoadingCourses(true);
      getCourses()
        .then((res) => setCourses(res.courses || []))
        .catch((err) => console.error(err))
        .finally(() => setLoadingCourses(false));
    }
  }, [activeTab]);

  useEffect(() => {
    const handleHistoryUpdate = () => {
      console.log("🔄 Video history updated from CourseDetail!");
      loadLessonHistory();
      loadStatsFromHistory();
    };

    window.addEventListener('videoHistoryUpdated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('videoHistoryUpdated', handleHistoryUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "baihoc") {
      console.log("🔄 Reloading history for baihoc tab");
      loadLessonHistory();
      loadStatsFromHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ===== UI Helpers =====
  const handleLevelChange = (level) => setSelectedLevel(level);

  const tabs = [
    { id: "luyentap", label: "Luyện tập" },
    { id: "khoahoc", label: "Khóa học" },
    { id: "baihoc", label: "Lịch sử xem" },
    { id: "thongke", label: "Thống kê" }
  ];

  const levels = [
    { id: "all", label: "Tất cả" },
    { id: "watching", label: "Đang xem" },
    { id: "completed", label: "Đã hoàn thành" }
  ];

  const getFilteredLessons = () => {
    if (!lessonHistory || lessonHistory.length === 0) return [];
    if (selectedLevel === "all") return lessonHistory;
    if (selectedLevel === "watching") return lessonHistory.filter((l) => l.progress < 100);
    if (selectedLevel === "completed") return lessonHistory.filter((l) => l.progress >= 100);
    return lessonHistory;
  };

  const filteredLessons = getFilteredLessons();

  // ===== Render =====
  return (
    <div className="home-page">
      <Container>
        {isLoading ? (
          <div className="loading text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            <Row className="welcome-section">
              <Col>
                <h1>Chào mừng trở lại, {user?.name || "User"}!</h1>
              </Col>
            </Row>

            <Row className="stats-row">
              <Card className="stat-card">
                <Card.Body>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(255, 193, 7, 0.1)" }}>
                    <FontAwesomeIcon icon={faFire} className="stat-icon" style={{ color: "#ffc107" }} />
                  </div>
                  <h3 className="stat-value">{streakDays}</h3>
                  <p className="stat-label">Chuỗi ngày học</p>
                </Card.Body>
              </Card>
            </Row>

            <Row className="lessons-nav">
              <Col>
                <div className="tab-navigation mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
=======
  faTrophy, faFire, faBookOpen, faCheckCircle, faClock,
  faLock, faGraduationCap, faLayerGroup, faMicrophone,
  faHeadphones, faPencilAlt, faFileAlt, faComments,
  faTrash, faPlay, faVideo, faListCheck, faUsers,
  faChevronRight, faEdit, faEllipsisV, faRocket, faStar
} from "@fortawesome/free-solid-svg-icons";

// ── Level configs ─────────────────────────────────────────────────────────────
const LEVELS = {
  1: { label: "Beginner",     color: "#f97316", badge: "#fff7ed", text: "#c2410c" },
  2: { label: "Intermediate", color: "#ec4899", badge: "#fdf2f8", text: "#be185d" },
  3: { label: "Intermediate", color: "#10b981", badge: "#ecfdf5", text: "#065f46" },
  4: { label: "Advanced",     color: "#8b5cf6", badge: "#f5f3ff", text: "#5b21b6" },
  5: { label: "Expert",       color: "#3b82f6", badge: "#eff6ff", text: "#1d4ed8" },
};
const getLevel = (n) => LEVELS[Number(n)] || LEVELS[1];

// Skill cards config
const SKILLS = [
  { title:"Flashcards",  icon:faLayerGroup, color:"#00c896", bg:"#e6faf4", path:"/flashcards",        premium:false },
  { title:"Luyện nói",   icon:faMicrophone, color:"#ec4899", bg:"#fdf2f8", path:"/speakingpractice",  premium:true  },
  { title:"Luyện nghe",  icon:faHeadphones, color:"#8b5cf6", bg:"#f5f3ff", path:"/listeningpractice", premium:true  },
  { title:"Luyện viết",  icon:faPencilAlt,  color:"#f97316", bg:"#fff7ed", path:"/writingpractice",   premium:false },
  { title:"Ngữ pháp",    icon:faFileAlt,    color:"#3b82f6", bg:"#eff6ff", path:"/grammar",           premium:false },
  { title:"Quizz",       icon:faComments,   color:"#f59e0b", bg:"#fefce8", path:"/quiz/publish",      premium:true  },
];

// Mint button inline style helpers
const mintBtn = (extra = {}) => ({
  background: "#00c896", color: "#fff", border: "none",
  borderRadius: "50px", fontWeight: 800, fontFamily: "'Nunito',sans-serif",
  cursor: "pointer", transition: "all .22s", ...extra,
});
const mintBtnHover = { background: "#00a87c", boxShadow: "0 6px 20px rgba(0,200,150,.35)", transform: "translateY(-1px)" };

// ─────────────────────────────────────────────────────────────────────────────
const Home = () => {
  const [showAIChat,        setShowAIChat]        = useState(false);
  const [user,              setUser]              = useState(null);
  const [showAttemptModal,  setShowAttemptModal]  = useState(false);
  const [lessonHistory,     setLessonHistory]     = useState([]);
  const [streakDays,        setStreakDays]        = useState(0);
  const [statsData,         setStatsData]         = useState(null);
  const [isLoading,         setIsLoading]         = useState(true);
  const [hasMembership,     setHasMembership]     = useState(false);
  const [membershipInfo,    setMembershipInfo]    = useState(null);
  const [selectedLevel,     setSelectedLevel]     = useState("all");
  const [activeTab,         setActiveTab]         = useState("baihoc");
  const [loadingCourses,    setLoadingCourses]    = useState(true);
  const [courses,           setCourses]           = useState([]);
  const [attempts,          setAttempts]          = useState([]);
  const navigate = useNavigate();

  const emptyData = {
    user:  { name:"Student", xp:0, streak:0, level:1, progress:0 },
    stats: {
      khoahoc:    { currentLevel:"Level 1", xpToNext:0 },
      streak:     { days:0, message:"Bắt đầu học ngay hôm nay!" },
      luyentap:   { lessonsCompleted:0, averageScore:"0%" },
      timeSpent:  { time:"0h 0m", times:"This week" },
      weeklyGoal: { lessons:{ completed:0, total:7 }, studyTime:{ completed:0, total:300, unit:"min" } },
    },
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getAuthHeaders = () => {
    const t = localStorage.getItem("accessToken");
    return { Accept:"*/*", Authorization: t?`Bearer ${t}`:undefined, "ngrok-skip-browser-warning":"true" };
  };
  const fmtVN = (iso) => iso ? new Intl.DateTimeFormat("vi-VN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(iso)) : "-";
  const fmtDT = (iso) => iso ? new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso)) : "-";
  const fmtDur = (m) => {
    if (m==null||isNaN(m)) return "0 phút";
    const t=Math.max(0,Math.round(Number(m))); if(!t) return "0 phút";
    const h=Math.floor(t/60),mn=t%60;
    return h>0?(mn>0?`${h} giờ ${mn} phút`:`${h} giờ`):`${mn} phút`;
  };
  const toHM = fmtDur;

  const cleanHistory = () => {
    try {
      const s=localStorage.getItem("videoWatchHistory"); if(!s) return;
      const h=JSON.parse(s); if(!Array.isArray(h)) return;
      const c=h.map(e=>{const d=Number(e.duration)||0,w=Number(e.watchedMinutes)||0,p=Number(e.progress)||0;
        return{...e,duration:Math.round(d),watchedMinutes:Math.round(Math.min(w,d)),progress:p>=95?100:Math.min(p,100)};});
      localStorage.setItem("videoWatchHistory",JSON.stringify(c)); return c;
    } catch { return undefined; }
  };

  const calcStreak = (arr) => {
    if(!arr||!arr.length) return 0;
    const ds=d=>new Date(d).toDateString();
    const dates=[...new Set(arr.map(x=>ds(x.submittedAt||x.lastWatched)))].sort((a,b)=>new Date(b)-new Date(a));
    if(!dates.length) return 0;
    const today=new Date().toDateString(), yest=new Date(Date.now()-86400000).toDateString();
    if(dates[0]!==today&&dates[0]!==yest) return 0;
    let s=1,cur=new Date(dates[0]);
    for(let i=1;i<dates.length;i++){const p=new Date(dates[i]);if(Math.floor((cur-p)/86400000)===1){s++;cur=p;}else break;}
    return s;
  };

  const loadHistory = () => {
    try {
      cleanHistory();
      const s=localStorage.getItem("videoWatchHistory");
      if(s){const a=JSON.parse(s);(Array.isArray(a)?a:[]).sort((a,b)=>new Date(b.lastWatched)-new Date(a.lastWatched));setLessonHistory(Array.isArray(a)?a:[]);}
      else setLessonHistory([]);
    } catch { setLessonHistory([]); }
  };

  const loadStats = () => {
    try {
      const s=localStorage.getItem("videoWatchHistory");
      if(s){
        const h=JSON.parse(s); const streak=calcStreak(h); setStreakDays(streak);
        const tot=h.length,comp=h.filter(x=>x.progress>=100).length,rate=tot>0?((comp/tot)*100).toFixed(1):0;
        const wa=new Date(Date.now()-7*86400000),wk=h.filter(x=>new Date(x.lastWatched)>=wa);
        const wm=wk.reduce((s,x)=>s+(Number(x.watchedMinutes)||0),0);
        setStatsData({
          khoahoc:{currentLevel:`Level ${Math.floor(tot/10)+1}`,xpToNext:100-(tot%10)*10},
          streak:{days:streak,message:streak>0?`Tuyệt vời! Bạn đã học ${streak} ngày liên tiếp!`:"Bắt đầu học ngay hôm nay!"},
          luyentap:{lessonsCompleted:tot,averageScore:`${rate}%`},
          timeSpent:{time:toHM(wm),times:"Tuần này"},
          weeklyGoal:{lessons:{completed:wk.length,total:7},studyTime:{completed:Math.round(wm),total:300,unit:"min"}},
        });
      } else { setStreakDays(0); setStatsData(emptyData.stats); }
    } catch { setStreakDays(0); setStatsData(emptyData.stats); }
  };

  const handleClearHistory = () => {
    if(window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem video?")){
      localStorage.removeItem("videoWatchHistory"); loadHistory(); loadStats();
    }
  };

  const loadAttempts = async () => {
    try {
      const r=await fetch(`${process.env.REACT_APP_API_URL}/api/attempts`,{headers:getAuthHeaders()});
      if(r.ok){const d=await r.json();setAttempts(Array.isArray(d)?d:[]);}else setAttempts([]);
    } catch { setAttempts([]); }
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    const init=async()=>{
      try{
        setIsLoading(true);
        const name=localStorage.getItem("userName")||"Student";
        const token=localStorage.getItem("accessToken");
        setUser({...emptyData.user,name});setStatsData(emptyData.stats);
        if(token){
          const md=await checkMembership();setHasMembership(md.hasMembership);setMembershipInfo(md);
          loadHistory();loadStats();await loadAttempts();
        } else {setHasMembership(false);setMembershipInfo(null);setLessonHistory([]);}
      } catch {setUser(emptyData.user);setStatsData(emptyData.stats);setLessonHistory([]);setHasMembership(false);setMembershipInfo(null);}
      finally{setIsLoading(false);}
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(activeTab==="khoahoc"){setLoadingCourses(true);getCourses().then(r=>setCourses(r.courses||[])).catch(console.error).finally(()=>setLoadingCourses(false));}
  },[activeTab]);

  useEffect(()=>{
    const h=()=>{loadHistory();loadStats();};
    window.addEventListener("videoHistoryUpdated",h);
    return()=>window.removeEventListener("videoHistoryUpdated",h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(activeTab==="baihoc"){loadHistory();loadStats();}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeTab]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const tabs = [
    {id:"luyentap",label:"Luyện tập"},
    {id:"khoahoc", label:"Khóa học"},
    {id:"baihoc",  label:"Lịch sử xem"},
    {id:"thongke", label:"Thống kê"},
  ];
  const filterLevels = [
    {id:"all",label:"Tất cả"},
    {id:"watching",label:"Đang xem"},
    {id:"completed",label:"Đã hoàn thành"},
  ];
  const filtered = !lessonHistory.length ? [] :
    selectedLevel==="watching"  ? lessonHistory.filter(l=>l.progress<100) :
    selectedLevel==="completed" ? lessonHistory.filter(l=>l.progress>=100) : lessonHistory;

  // ── Render ────────────────────────────────────────────────────────────────
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
                    <FontAwesomeIcon icon={faStar} style={{color:"#f9c74f"}} />
                    Nền tảng học tập thông minh
                  </div>
                  <h1>
                    Chào mừng trở lại,{" "}
                    <span className="highlight">{user?.name || "User"}!</span>
                  </h1>
                  <p className="welcome-sub">Tiếp tục hành trình học tập của bạn hôm nay nhé 🚀</p>
                </div>

                {/* Floating 3D-style illustration */}
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
            {/* ─ Streak card ──────────────────────────────────────────── */}
            {/* ─ Tabs ─────────────────────────────────────────────────── */}
            <Row className="lessons-nav">
              <Col>
                <div className="tab-navigation mb-4">
                  {tabs.map(t=>(
                    <button key={t.id} className={`tab-item${activeTab===t.id?" active":""}`} onClick={()=>setActiveTab(t.id)}>
                      {t.label}
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                    </button>
                  ))}
                </div>
              </Col>
            </Row>

<<<<<<< HEAD
            {activeTab === "baihoc" && (
=======
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: Lịch sử xem                                           */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab==="baihoc" && (
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
              <div className="lessons-section">
                {hasMembership ? (
                  <>
                    <div className="lessons-header">
                      <div className="header-left">
                        <h4>Lịch sử xem video</h4>
                        <p>Các video bài học bạn đã và đang xem trong các khóa học.</p>
                      </div>
                      <div className="header-right">
<<<<<<< HEAD
                        {lessonHistory.length > 0 && (
                          <Button variant="outline-danger" size="sm" onClick={handleClearHistory} className="me-2">
                            <FontAwesomeIcon icon={faTrash} className="me-1" />
                            Xóa lịch sử
                          </Button>
                        )}
                        <div className="membership-badge">
                          <FontAwesomeIcon icon={faTrophy} />
                          <span>{membershipInfo?.planName || "Premium"}</span>
=======
                        {lessonHistory.length>0&&(
                          <Button variant="outline-danger" size="sm" onClick={handleClearHistory}>
                            <FontAwesomeIcon icon={faTrash} className="me-1"/>Xóa lịch sử
                          </Button>
                        )}
                        <div className="membership-badge">
                          <FontAwesomeIcon icon={faTrophy}/><span>{membershipInfo?.planName||"Premium"}</span>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                        </div>
                      </div>
                    </div>

                    <div className="level-filters">
<<<<<<< HEAD
                      {levels.map((level) => (
                        <button
                          key={level.id}
                          className={`level-filter-item ${selectedLevel === level.id ? "active" : ""}`}
                          onClick={() => handleLevelChange(level.id)}
                        >
                          {level.label}
=======
                      {filterLevels.map(lv=>(
                        <button key={lv.id} className={`level-filter-item${selectedLevel===lv.id?" active":""}`} onClick={()=>setSelectedLevel(lv.id)}>
                          {lv.label}
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                        </button>
                      ))}
                    </div>

<<<<<<< HEAD
                    <div className="lessons-grid">
                      {filteredLessons.length > 0 ? (
                        <Row className="g-4">
                          {filteredLessons.map((lesson) => (
                            <Col md={6} lg={4} key={lesson.id}>
                              <Card className="h-100 shadow-sm border-0" style={{ overflow: "hidden", cursor: "pointer" }}>
                                <div
                                  style={{
                                    height: "180px",
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    position: "relative"
                                  }}
                                  onClick={() => navigate(`/course/${lesson.courseID}`)}
                                >
                                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.2 }}>
                                    <FontAwesomeIcon icon={faVideo} size="4x" style={{ color: "#fff" }} />
                                  </div>

                                  <div className="play-overlay" style={{
                                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                                    background: "rgba(0,0,0,0.6)", borderRadius: "50%", width: "60px", height: "60px",
                                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease"
                                  }}>
                                    <FontAwesomeIcon icon={faPlay} size="lg" style={{ color: "#fff", marginLeft: "3px" }} />
                                  </div>

                                  <Badge bg={lesson.progress >= 100 ? "success" : "warning"} style={{ position: "absolute", top: "12px", right: "12px", padding: "6px 12px" }}>
                                    {lesson.progress >= 100 ? (
                                      <>
                                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                        Hoàn thành
                                      </>
                                    ) : (
                                      `${lesson.progress}%`
                                    )}
                                  </Badge>

                                  {lesson.progress < 100 && (
                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "rgba(255,255,255,0.3)" }}>
                                      <div style={{ height: "100%", width: `${lesson.progress}%`, background: "#ffc107", transition: "width 0.3s ease" }} />
                                    </div>
                                  )}
                                </div>

                                <Card.Body>
                                  <div className="d-flex align-items-center gap-2 mb-2">
                                    <FontAwesomeIcon icon={faBookOpen} style={{ color: "#667eea", fontSize: "14px" }} />
                                    <small className="text-muted text-truncate">{lesson.courseName}</small>
                                  </div>

                                  <h6 className="mb-2" style={{ fontWeight: 600, fontSize: "15px" }}>
                                    {lesson.lessonTitle}
                                  </h6>

                                  <p className="text-muted small mb-3">
                                    <FontAwesomeIcon icon={faClock} className="me-1" />
                                    {formatDateTime(lesson.lastWatched)}
                                  </p>

                                  <div className="d-flex justify-content-between align-items-center text-muted small mb-2">
                                    <span>
                                      <FontAwesomeIcon icon={faVideo} className="me-1" />
                                      Thời lượng: <strong>{formatDuration(lesson.duration)}</strong>
                                    </span>
                                    <span className={lesson.progress >= 100 ? "text-success fw-bold" : ""}>
                                      {lesson.progress}%
                                    </span>
                                  </div>

                                  <div className="text-muted small mb-3">
                                    <FontAwesomeIcon icon={faClock} className="me-1" />
                                    Đã xem: <strong className={lesson.progress >= 100 ? "text-success" : ""}>
                                      {formatDuration(lesson.watchedMinutes)}
                                    </strong>
                                    {lesson.progress >= 100 && (
                                      <Badge bg="success" className="ms-2">
                                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                        Hoàn thành
                                      </Badge>
                                    )}
                                  </div>

                                  {lesson.progress < 100 && lesson.progress > 0 && (
                                    <div className="mb-3">
                                      <div className="progress" style={{ height: "6px" }}>
                                        <div
                                          className="progress-bar bg-primary"
                                          role="progressbar"
                                          style={{ width: `${lesson.progress}%` }}
                                          aria-valuenow={lesson.progress}
                                          aria-valuemin="0"
                                          aria-valuemax="100"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <Button
                                    variant={lesson.progress >= 100 ? "outline-success" : "primary"}
                                    size="sm"
                                    className="w-100"
                                    onClick={() => navigate(`/course/${lesson.courseID}`)}
                                  >
                                    <FontAwesomeIcon icon={lesson.progress >= 100 ? faCheckCircle : faPlay} className="me-2" />
                                    {lesson.progress >= 100 ? "Xem lại" : lesson.progress > 0 ? "Tiếp tục xem" : "Bắt đầu xem"}
                                  </Button>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <div className="no-lessons text-center py-5">
                          <FontAwesomeIcon icon={faBookOpen} size="3x" className="mb-3 text-muted" />
                          <p className="text-muted">
                            {lessonHistory.length === 0
                              ? "Bạn chưa xem video nào. Hãy bắt đầu học ngay!"
                              : selectedLevel === "watching"
                                ? "Không có video đang xem dở."
                                : "Không có video đã hoàn thành."}
                          </p>
                          {lessonHistory.length === 0 ? (
                            <Button variant="primary" onClick={() => setActiveTab("khoahoc")}>
                              Xem khóa học
                            </Button>
                          ) : (
                            <Button variant="outline-primary" onClick={() => setSelectedLevel("all")}>
                              Xem tất cả
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="membership-required-section text-center">
                    <div className="membership-message">
                      <FontAwesomeIcon icon={faLock} className="lock-icon mb-3" />
                      <h5>Cần có gói Membership để truy cập khóa học</h5>
                      <p className="mb-4">Đăng ký để mở khóa toàn bộ khóa học và xem video bài học.</p>
                      <Button variant="primary" size="lg" onClick={() => navigate("/membership")}>
                        Xem các gói Membership
                      </Button>
                    </div>
=======
                    {filtered.length>0 ? (
                      <Row className="g-3">
                        {filtered.map(lesson=>(
                          <Col md={6} lg={4} key={lesson.id}>
                            <div style={{background:"#fff",borderRadius:"20px",overflow:"hidden",border:"1.5px solid #e5e7eb",boxShadow:"0 4px 24px rgba(0,0,0,.07)",height:"100%",display:"flex",flexDirection:"column",transition:"transform .22s,box-shadow .22s,border-color .22s"}}
                              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-7px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,200,150,.18)";e.currentTarget.style.borderColor="#00c896";}}
                              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,.07)";e.currentTarget.style.borderColor="#e5e7eb";}}
                            >
                              {/* Thumbnail */}
                              <div style={{height:"175px",background:"linear-gradient(135deg,#00c896,#1a73e8)",position:"relative",cursor:"pointer"}} onClick={()=>navigate(`/course/${lesson.courseID}`)}>
                                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <FontAwesomeIcon icon={faVideo} size="4x" style={{color:"rgba(255,255,255,.22)"}}/>
                                </div>
                                {/* Play */}
                                <div className="play-overlay" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(255,255,255,.22)",backdropFilter:"blur(4px)",border:"2px solid rgba(255,255,255,.7)",borderRadius:"50%",width:"54px",height:"54px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .22s"}}>
                                  <FontAwesomeIcon icon={faPlay} style={{color:"#fff",marginLeft:"3px"}}/>
                                </div>
                                {/* Status badge */}
                                <div style={{position:"absolute",top:"12px",right:"12px",background:"rgba(255,255,255,.96)",color:lesson.progress>=100?"#059669":"#00a87c",fontWeight:800,fontSize:".76rem",padding:"5px 13px",borderRadius:"100px",boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
                                  {lesson.progress>=100?<><FontAwesomeIcon icon={faCheckCircle} className="me-1"/>Hoàn thành</>:`${lesson.progress}%`}
                                </div>
                                {/* Progress bar */}
                                {lesson.progress<100&&(
                                  <div style={{position:"absolute",bottom:0,left:0,right:0,height:"4px",background:"rgba(255,255,255,.25)"}}>
                                    <div style={{height:"100%",width:`${lesson.progress}%`,background:"#f9c74f",transition:"width .3s"}}/>
                                  </div>
                                )}
                              </div>
                              {/* Body */}
                              <div style={{padding:"1.2rem 1.35rem 1.4rem",display:"flex",flexDirection:"column",flex:1}}>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <FontAwesomeIcon icon={faBookOpen} style={{color:"#00c896",fontSize:"13px"}}/>
                                  <small style={{color:"#9ca3af"}} className="text-truncate">{lesson.courseName}</small>
                                </div>
                                <h6 style={{fontWeight:800,fontSize:"15px",marginBottom:".55rem",color:"#111827"}}>{lesson.lessonTitle}</h6>
                                <p style={{color:"#9ca3af",fontSize:".8rem",marginBottom:".75rem"}}>
                                  <FontAwesomeIcon icon={faClock} className="me-1"/>{fmtDT(lesson.lastWatched)}
                                </p>
                                <div className="d-flex justify-content-between mb-1" style={{fontSize:".8rem",color:"#374151"}}>
                                  <span><FontAwesomeIcon icon={faVideo} className="me-1"/>Thời lượng: <strong>{fmtDur(lesson.duration)}</strong></span>
                                  <span style={{fontWeight:800,color:lesson.progress>=100?"#059669":"#00a87c"}}>{lesson.progress}%</span>
                                </div>
                                <div style={{fontSize:".8rem",color:"#374151",marginBottom:"1rem"}}>
                                  <FontAwesomeIcon icon={faClock} className="me-1"/>Đã xem: <strong style={{color:lesson.progress>=100?"#059669":"inherit"}}>{fmtDur(lesson.watchedMinutes)}</strong>
                                </div>
                                {lesson.progress>0&&lesson.progress<100&&(
                                  <div style={{height:"7px",background:"#e6faf4",borderRadius:"99px",marginBottom:"1rem",overflow:"hidden"}}>
                                    <div style={{height:"100%",width:`${lesson.progress}%`,background:"#00c896",borderRadius:"99px"}}/>
                                  </div>
                                )}
                                <button
                                  style={{...mintBtn({padding:".6rem 1rem",fontSize:".88rem",width:"100%",background:lesson.progress>=100?"transparent":"#00c896",border:lesson.progress>=100?"2px solid #10b981":"none",color:lesson.progress>=100?"#059669":"#fff"})}
                                  }
                                  onMouseEnter={e=>{if(lesson.progress<100){e.currentTarget.style.background="#00a87c";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,200,150,.35)";}}}
                                  onMouseLeave={e=>{if(lesson.progress<100){e.currentTarget.style.background="#00c896";e.currentTarget.style.boxShadow="";}}}
                                  onClick={()=>navigate(`/course/${lesson.courseID}`)}
                                >
                                  <FontAwesomeIcon icon={lesson.progress>=100?faCheckCircle:faPlay} style={{marginRight:"8px"}}/>
                                  {lesson.progress>=100?"Xem lại":lesson.progress>0?"Tiếp tục xem":"Bắt đầu xem"}
                                </button>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div className="text-center py-5">
                        <FontAwesomeIcon icon={faBookOpen} size="3x" style={{color:"#d1d5db",marginBottom:"1rem"}}/>
                        <p style={{color:"#9ca3af",fontWeight:600}}>
                          {lessonHistory.length===0?"Bạn chưa xem video nào. Hãy bắt đầu học ngay!":selectedLevel==="watching"?"Không có video đang xem dở.":"Không có video đã hoàn thành."}
                        </p>
                        {lessonHistory.length===0
                          ?<button style={mintBtn({padding:".7rem 2rem",fontSize:".9rem"})} onClick={()=>setActiveTab("khoahoc")} onMouseEnter={e=>{Object.assign(e.currentTarget.style,mintBtnHover);}} onMouseLeave={e=>{e.currentTarget.style.background="#00c896";e.currentTarget.style.boxShadow="";e.currentTarget.style.transform="";}}>Xem khóa học</button>
                          :<button style={{...mintBtn({padding:".65rem 2rem",fontSize:".9rem",background:"transparent",border:"2px solid #00c896",color:"#00a87c"})}} onClick={()=>setSelectedLevel("all")}>Xem tất cả</button>
                        }
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faLock} size="3x" style={{color:"#d1d5db"}}/>
                    <h5 style={{fontWeight:800,color:"#111827",marginTop:"1rem"}}>Cần có gói Membership để truy cập khóa học</h5>
                    <p style={{color:"#9ca3af",maxWidth:"400px",margin:".5rem auto 1.5rem"}}>Đăng ký để mở khóa toàn bộ khóa học và xem video bài học.</p>
                    <button style={mintBtn({padding:".8rem 2.5rem",fontSize:"1rem"})} onClick={()=>navigate("/membership")} onMouseEnter={e=>{Object.assign(e.currentTarget.style,mintBtnHover);}} onMouseLeave={e=>{e.currentTarget.style.background="#00c896";e.currentTarget.style.boxShadow="";e.currentTarget.style.transform="";}}>
                      Xem các gói Membership
                    </button>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                  </div>
                )}
              </div>
            )}

<<<<<<< HEAD
            {activeTab === "khoahoc" && (
              <div className="course-list">
                {loadingCourses ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Đang tải dữ liệu khóa học...</p>
                  </div>
                ) : !courses || courses.length === 0 ? (
                  <div className="text-center py-4">
                    <FontAwesomeIcon icon={faGraduationCap} size="3x" className="mb-3" style={{ color: "#ccc" }} />
                    <p className="text-muted">Hiện chưa có khóa học nào</p>
                  </div>
                ) : (
                  <Row>
                    {courses.map((course) => (
                      <Col md={6} lg={4} key={course.courseID} className="mb-4">
                        <Card className="h-100 shadow-sm border-0" style={{ overflow: "hidden" }}>
                          <div style={{ height: "120px", background: "#3b82f6", position: "relative", padding: "20px", borderBottom: '5px solid #ff9800' }}>
                            <div className="d-flex justify-content-between align-items-start">
                              <h5 className="text-white mb-0" style={{ fontWeight: 600 }}>
                                {course.courseName}
                              </h5>
                              <Badge bg="white" text="primary" style={{ fontSize: "12px", padding: "6px 12px", color: '#3b82f6', border: 'none', background: '#fff' }}>
                                Level {course.courseLevel}
                              </Badge>
                            </div>
                          </div>

                          <Card.Body>
                            <p className="text-muted mb-3" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                              {course.description || "Mô tả khóa học"}
                            </p>

                            {course.teacherID && (
                              <div
                                className="teacher-info-section mb-3 p-3 rounded"
                                style={{
                                  backgroundColor: "#f8f9fa",
                                  border: "1px solid #e3eafc",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease"
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/teacherinfo/${course.teacherID}`);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#e3eafc";
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                                  e.currentTarget.style.transform = "translateY(0)";
                                }}
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center",
                                      color: "white",
                                      fontWeight: "600",
                                      fontSize: "18px"
                                    }}
                                  >
                                    {course.teacherName ? course.teacherName.charAt(0).toUpperCase() : "T"}
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <FontAwesomeIcon
                                        icon={faGraduationCap}
                                        style={{ color: "#ff9800", fontSize: "14px" }}
                                      />
                                      <span style={{ fontSize: "13px", color: "#ff9800", fontWeight: 500 }}>
                                        Giảng viên
                                      </span>
                                    </div>
                                  </div>
                                  <FontAwesomeIcon
                                    icon={faPlay}
                                    style={{ color: "#3b82f6", fontSize: "12px" }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Action Button */}
                            <Button
                              variant="primary"
                              className="w-100 course-btn-blue-orange"
                              onClick={() => navigate(`/course/${course.courseID}`)}
                              style={{
                                background: "#3b82f6",
                                border: "none",
                                padding: "10px",
                                fontWeight: 500,
                                transition: 'background 0.2s, color 0.2s'
                              }}
                            >
                              <FontAwesomeIcon icon={faBookOpen} className="me-2" />
                              Xem chi tiết
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
=======
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: Khóa học                                              */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab==="khoahoc"&&(
              <div style={{marginBottom:"2rem"}}>
                {loadingCourses?(
                  <div className="text-center py-5">
                    <div className="spinner-border" style={{color:"#00c896"}} role="status"><span className="visually-hidden">Loading...</span></div>
                    <p style={{color:"#374151",fontWeight:600,marginTop:"1rem"}}>Đang tải dữ liệu khóa học...</p>
                  </div>
                ):!courses||courses.length===0?(
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faGraduationCap} size="3x" style={{color:"#d1d5db"}}/>
                    <p style={{color:"#9ca3af",fontWeight:600,marginTop:"1rem"}}>Hiện chưa có khóa học nào</p>
                  </div>
                ):(
                  <Row className="g-3">
                    {courses.map(course=>{
                      const lv=getLevel(course.courseLevel);
                      return(
                        <Col md={6} lg={4} key={course.courseID}>
                          <div
                            className="course-card"
                            data-level={Number(course.courseLevel)||1}
                            style={{borderRadius:"20px",overflow:"hidden",background:"#fff",height:"100%",display:"flex",flexDirection:"column",border:"1.5px solid #e5e7eb",boxShadow:"0 4px 24px rgba(0,0,0,.07)",transition:"transform .22s,box-shadow .22s,border-color .22s"}}
                            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-7px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,200,150,.18)";e.currentTarget.style.borderColor="#00c896";}}
                            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,.07)";e.currentTarget.style.borderColor="#e5e7eb";}}
                          >
                            {/* Thumbnail */}
                            <div style={{position:"relative",height:"178px",overflow:"hidden",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>navigate(`/course/${course.courseID}`)}>
                              <div className="thumb-overlay" style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${lv.color}cc,${lv.color})`}}/>
                              <FontAwesomeIcon icon={faGraduationCap} style={{fontSize:"3.5rem",color:"rgba(255,255,255,.25)",position:"relative",zIndex:1}}/>
                              {/* Level badge */}
                              <div style={{position:"absolute",top:"14px",right:"14px",background:lv.badge,color:lv.text,fontWeight:800,fontSize:".76rem",padding:"5px 15px",borderRadius:"100px",boxShadow:"0 2px 10px rgba(0,0,0,.1)",zIndex:2,border:`1px solid ${lv.color}30`}}>
                                {lv.label}
                              </div>
                            </div>

                            {/* Body */}
                            <div style={{padding:"1.3rem 1.4rem 1.5rem",display:"flex",flexDirection:"column",flex:1}}>
                              <h5 style={{fontWeight:800,fontSize:"1.02rem",color:"#111827",marginBottom:".2rem"}}>{course.courseName}</h5>
                              <p style={{fontSize:".82rem",color:"#9ca3af",marginBottom:".85rem"}}>
                                Level {course.courseLevel}{course.description?`: ${course.description}`:""}
                              </p>

                              {/* Meta */}
                              <div style={{display:"flex",gap:"1.1rem",marginBottom:".9rem"}}>
                                {[{icon:faUsers,label:"0 học viên"},{icon:faBookOpen,label:"0 bài học"}].map((m,i)=>(
                                  <div key={i} style={{display:"flex",alignItems:"center",gap:".35rem",fontSize:".8rem",color:"#374151"}}>
                                    <FontAwesomeIcon icon={m.icon} style={{color:"#00c896",fontSize:".82rem"}}/><span>{m.label}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Teacher */}
                              {course.teacherID&&(
                                <div
                                  style={{display:"flex",alignItems:"center",gap:".55rem",padding:".5rem .85rem",background:"#e6faf4",borderRadius:"12px",marginBottom:".9rem",cursor:"pointer",transition:"all .22s"}}
                                  onClick={e=>{e.stopPropagation();navigate(`/teacherinfo/${course.teacherID}`);}}
                                  onMouseEnter={e=>{e.currentTarget.style.background="#b3f0de";e.currentTarget.style.transform="translateY(-1px)";}}
                                  onMouseLeave={e=>{e.currentTarget.style.background="#e6faf4";e.currentTarget.style.transform="";}}
                                >
                                  <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#00c896",color:"#fff",fontWeight:800,fontSize:".85rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                    {course.teacherName?course.teacherName.charAt(0).toUpperCase():"T"}
                                  </div>
                                  <div style={{flex:1}}>
                                    <span style={{fontSize:".7rem",color:"#00a87c",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",display:"block"}}>Giảng viên</span>
                                    {course.teacherName&&<span style={{fontSize:".86rem",color:"#111827",fontWeight:700}}>{course.teacherName}</span>}
                                  </div>
                                  <FontAwesomeIcon icon={faChevronRight} style={{color:"#00a87c",fontSize:".72rem"}}/>
                                </div>
                              )}

                              {/* Actions */}
                              <div style={{display:"flex",alignItems:"center",gap:".55rem",marginTop:"auto"}}>
                                <button
                                  style={mintBtn({flex:1,padding:".65rem 1rem",fontSize:".88rem"})}
                                  onClick={()=>navigate(`/course/${course.courseID}`)}
                                  onMouseEnter={e=>{Object.assign(e.currentTarget.style,mintBtnHover);}}
                                  onMouseLeave={e=>{e.currentTarget.style.background="#00c896";e.currentTarget.style.boxShadow="";e.currentTarget.style.transform="";}}
                                >
                                  Xem chi tiết
                                </button>
                                {[{icon:faEdit,danger:false},{icon:faTrash,danger:true},{icon:faEllipsisV,danger:false}].map(({icon,danger},i)=>(
                                  <button key={i}
                                    style={{width:"38px",height:"38px",borderRadius:"12px",border:"1.5px solid #e5e7eb",background:"transparent",color:"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .22s",fontSize:".85rem"}}
                                    onMouseEnter={e=>{e.currentTarget.style.borderColor=danger?"#ef4444":"#00c896";e.currentTarget.style.color=danger?"#ef4444":"#00a87c";e.currentTarget.style.background=danger?"#fef2f2":"#e6faf4";}}
                                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#9ca3af";e.currentTarget.style.background="transparent";}}
                                  >
                                    <FontAwesomeIcon icon={icon}/>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                  </Row>
                )}
              </div>
            )}
<<<<<<< HEAD
            {/* Tab: Luyện tập */}
            {activeTab === "luyentap" && (
              <div className="practice-section">
                <h4 className="mb-4">Luyện tập kỹ năng</h4>
                <Row>
                  {[
                    { title: "Flashcards", icon: faLayerGroup, color: "#4A90E2", available: true, path: "/flashcards" },
                    { title: "Luyện nói", icon: faMicrophone, color: "#50E3C2", available: hasMembership, path: "/speakingpractice" },
                    { title: "Luyện nghe", icon: faHeadphones, color: "#9013FE", available: hasMembership, path: "/listeningpractice" },
                    { title: "Luyện viết", icon: faPencilAlt, color: "#F5A623", available: true, path: "/writingpractice" },
                    { title: "Ngữ pháp", icon: faFileAlt, color: "#D0021B", available: true, path: "/grammar" },
                    { title: "Quizz", icon: faComments, color: "#4A90E2", available: hasMembership, path: "/quiz/publish" }
                  ].map((skill, index) => (
                    <Col md={4} key={index} className="mb-4">
                      <div
                        className={`skill-card ${!skill.available ? "skill-locked" : ""}`}
                        onClick={() => {
                          if (skill.available) navigate(skill.path);
                          else navigate("/membership");
                        }}
                      >
                        <div className="skill-icon-wrapper" style={{ backgroundColor: `${skill.color}20` }}>
                          <FontAwesomeIcon icon={skill.icon} className="skill-icon" style={{ color: skill.color }} />
                        </div>
                        <h6 className="skill-title">{skill.title}</h6>
                        {!skill.available && (
                          <div className="premium-lock">
                            <FontAwesomeIcon icon={faLock} />
                          </div>
                        )}
=======

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: Luyện tập                                             */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab==="luyentap"&&(
              <div className="practice-section">
                <h4>Luyện tập kỹ năng</h4>
                <Row className="g-3">
                  {SKILLS.map((skill,i)=>(
                    <Col md={4} key={i}>
                      <div
                        className={`skill-card${(!skill.premium||hasMembership)?"":" skill-locked"}`}
                        onClick={()=>{if(!skill.premium||hasMembership)navigate(skill.path);else navigate("/membership");}}
                      >
                        <div className="skill-icon-wrapper" style={{backgroundColor:skill.bg}}>
                          <FontAwesomeIcon icon={skill.icon} className="skill-icon" style={{color:skill.color}}/>
                        </div>
                        <h6 className="skill-title">{skill.title}</h6>
                        {skill.premium&&!hasMembership&&<div className="premium-lock"><FontAwesomeIcon icon={faLock}/></div>}
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

<<<<<<< HEAD
            {/* Tab: Thống kê (có Attempts + Modal) */}
            {activeTab === "thongke" && (
              <div className="new-stats-section">
                <h4 className="mb-4">Tổng quan thành tích</h4>
                <Row>
                  {[
                    {
                      title: "Cấp độ hiện tại",
                      icon: faGraduationCap,
                      color: "#667eea",
                      value: statsData?.khoahoc?.currentLevel || "Level 1",
                      label: `${statsData?.khoahoc?.xpToNext || 0} XP để lên cấp`
                    },
                    {
                      title: "Chuỗi ngày học",
                      icon: faFire,
                      color: "#ffc107",
                      value: `${streakDays} ngày`,
                      label: statsData?.streak?.message || "Bắt đầu học ngay!"
                    },
                    {
                      title: "Bài làm hoàn thành",
                      icon: faCheckCircle,
                      color: "#28a745",
                      value: statsData?.luyentap?.lessonsCompleted || 0,
                      label: `Điểm trung bình: ${statsData?.luyentap?.averageScore || "0%"}`
                    },
                    {
                      title: "Thời gian học",
                      icon: faClock,
                      color: "#17a2b8",
                      value: statsData?.timeSpent?.time || "0h 0m",
                      label: statsData?.timeSpent?.times || "Tuần này"
                    }
                  ].map((stat, index) => (
                    <Col md={6} lg={3} key={index} className="mb-4">
                      <div className="stat-overview-card">
                        <div className="icon-wrapper" style={{ backgroundColor: `${stat.color}20` }}>
                          <FontAwesomeIcon icon={stat.icon} className="stat-icon" style={{ color: stat.color }} />
                        </div>
                        <h6 className="stat-title">{stat.title}</h6>
                        <p className="stat-value">{stat.value}</p>
                        <p className="stat-label">{stat.label}</p>
=======
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: Thống kê                                              */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab==="thongke"&&(
              <div className="new-stats-section">
                <h4>Tổng quan thành tích</h4>
                <Row className="g-3">
                  {[
                    {title:"Cấp độ hiện tại",   icon:faGraduationCap, color:"#00c896", bg:"#e6faf4", value:statsData?.khoahoc?.currentLevel||"Level 1", label:`${statsData?.khoahoc?.xpToNext||0} XP để lên cấp`},
                    {title:"Chuỗi ngày học",     icon:faFire,          color:"#f97316", bg:"#fff7ed", value:`${streakDays} ngày`,                          label:statsData?.streak?.message||"Bắt đầu học ngay!"},
                    {title:"Bài làm hoàn thành", icon:faCheckCircle,   color:"#10b981", bg:"#ecfdf5", value:statsData?.luyentap?.lessonsCompleted||0,       label:`Điểm TB: ${statsData?.luyentap?.averageScore||"0%"}`},
                    {title:"Thời gian học",      icon:faClock,         color:"#3b82f6", bg:"#eff6ff", value:statsData?.timeSpent?.time||"0h 0m",            label:statsData?.timeSpent?.times||"Tuần này"},
                  ].map((s,i)=>(
                    <Col md={6} lg={3} key={i}>
                      <div className="stat-overview-card">
                        <div className="icon-wrapper" style={{backgroundColor:s.bg}}>
                          <FontAwesomeIcon icon={s.icon} className="stat-icon" style={{color:s.color}}/>
                        </div>
                        <h6 className="stat-title">{s.title}</h6>
                        <p className="stat-value">{s.value}</p>
                        <p className="stat-label">{s.label}</p>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                      </div>
                    </Col>
                  ))}
                </Row>

<<<<<<< HEAD
                <Row>
                  <Col md={12} lg={6} className="mb-4">
                    <Card className="h-100 detail-card">
                      <Card.Body>
                        <h5>Mục tiêu hàng tuần</h5>
                        <p className="text-muted">Duy trì đà học tập của bạn!</p>

                        <div className="weekly-goal-item mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Hoàn thành bài làm</span>
                            <span>
                              {statsData?.weeklyGoal?.lessons?.completed || 0}/
                              {statsData?.weeklyGoal?.lessons?.total || 7}
                            </span>
                          </div>
                          <ProgressBar
                            now={
                              ((statsData?.weeklyGoal?.lessons?.completed || 0) /
                                (statsData?.weeklyGoal?.lessons?.total || 7)) *
                              100
                            }
                            className="custom-progress-bar"
                          />
                        </div>

                        <div className="weekly-goal-item">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Thời gian học</span>
                            <span>
                              {statsData?.weeklyGoal?.studyTime?.completed || 0}/
                              {statsData?.weeklyGoal?.studyTime?.total || 300}{" "}
                              {statsData?.weeklyGoal?.studyTime?.unit || "min"}
                            </span>
                          </div>
                          <ProgressBar
                            now={
                              ((statsData?.weeklyGoal?.studyTime?.completed || 0) /
                                (statsData?.weeklyGoal?.studyTime?.total || 300)) *
                              100
                            }
                            className="custom-progress-bar"
                          />
=======
                <Row className="g-3 mt-1">
                  <Col md={12} lg={6}>
                    <Card className="detail-card h-100">
                      <Card.Body>
                        <h5>Mục tiêu hàng tuần</h5>
                        <p className="text-muted">Duy trì đà học tập của bạn!</p>
                        <div className="weekly-goal-item mb-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span>Hoàn thành bài làm</span>
                            <span style={{fontWeight:800,color:"#00a87c"}}>{statsData?.weeklyGoal?.lessons?.completed||0}/{statsData?.weeklyGoal?.lessons?.total||7}</span>
                          </div>
                          <ProgressBar now={((statsData?.weeklyGoal?.lessons?.completed||0)/(statsData?.weeklyGoal?.lessons?.total||7))*100} className="custom-progress-bar"/>
                        </div>
                        <div className="weekly-goal-item">
                          <div className="d-flex justify-content-between mb-2">
                            <span>Thời gian học</span>
                            <span style={{fontWeight:800,color:"#00a87c"}}>{statsData?.weeklyGoal?.studyTime?.completed||0}/{statsData?.weeklyGoal?.studyTime?.total||300} {statsData?.weeklyGoal?.studyTime?.unit||"min"}</span>
                          </div>
                          <ProgressBar now={((statsData?.weeklyGoal?.studyTime?.completed||0)/(statsData?.weeklyGoal?.studyTime?.total||300))*100} className="custom-progress-bar"/>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

<<<<<<< HEAD
                  <Col md={12} lg={6} className="mb-4">
                    <Card className="h-100 detail-card">
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex align-items-center justify-content-between mb-2">
=======
                  <Col md={12} lg={6}>
                    <Card className="detail-card h-100">
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex align-items-center justify-content-between mb-3">
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                          <div>
                            <h5 className="mb-1">Lịch sử làm bài</h5>
                            <p className="text-muted mb-0">Các bài quiz bạn đã hoàn thành</p>
                          </div>
                          <div className="d-flex align-items-center gap-2">
<<<<<<< HEAD
                            <div
                              className="d-inline-flex align-items-center px-3 py-1 rounded"
                              style={{ backgroundColor: "rgba(102,126,234,0.1)" }}
                            >
                              <FontAwesomeIcon icon={faListCheck} className="me-2" style={{ color: "#667eea" }} />
                              <strong>{attempts.length}</strong>
                            </div>
                            <Button variant="primary" size="sm" onClick={openAttemptModal}>
                              Xem chi tiết
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3">
                          {attempts && attempts.length > 0 ? (
                            attempts.slice(0, 3).map((a) => (
                              <div
                                key={a.attemptID}
                                className="d-flex align-items-center justify-content-between border rounded p-2 mb-2"
                              >
                                <div>
                                  <div className="fw-semibold">{a.quizTitle || "Quiz"}</div>
                                  <div className="text-muted small">#{a.attemptID} • {formatVNDateTime(a.submittedAt)}</div>
                                </div>
                                <div className="text-end">
                                  <div className="badge bg-light text-dark">{a.status || "SUBMITTED"}</div>
                                  <div className="small text-muted mt-1">Điểm: {a.autoScore ?? 0}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted py-3">Chưa có bài làm nào. Hãy bắt đầu làm quiz!</div>
=======
                            <div style={{background:"#e6faf4",color:"#00a87c",borderRadius:"100px",padding:".3rem .9rem",fontWeight:800,display:"flex",alignItems:"center",gap:".4rem"}}>
                              <FontAwesomeIcon icon={faListCheck}/><strong>{attempts.length}</strong>
                            </div>
                            <button style={mintBtn({padding:".4rem 1rem",fontSize:".84rem"})} onClick={()=>setShowAttemptModal(true)}
                              onMouseEnter={e=>{Object.assign(e.currentTarget.style,mintBtnHover);}} onMouseLeave={e=>{e.currentTarget.style.background="#00c896";e.currentTarget.style.boxShadow="";e.currentTarget.style.transform="";}}>
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                        <div>
                          {attempts.length>0?attempts.slice(0,3).map(a=>(
                            <div key={a.attemptID} className="d-flex align-items-center justify-content-between p-2 mb-2 rounded" style={{background:"#f0fdf9",border:"1.5px solid #b3f0de"}}>
                              <div>
                                <div style={{fontWeight:700,fontSize:".9rem"}}>{a.quizTitle||"Quiz"}</div>
                                <div style={{color:"#9ca3af",fontSize:".8rem"}}>#{a.attemptID} • {fmtVN(a.submittedAt)}</div>
                              </div>
                              <div className="text-end">
                                <div style={{background:"#e6faf4",color:"#00a87c",borderRadius:"100px",padding:".25rem .75rem",fontWeight:800,fontSize:".78rem"}}>{a.status||"SUBMITTED"}</div>
                                <div style={{color:"#9ca3af",fontSize:".78rem",marginTop:".2rem"}}>Điểm: {a.autoScore??0}</div>
                              </div>
                            </div>
                          )):(
                            <div className="text-center py-3" style={{color:"#9ca3af",fontWeight:600}}>Chưa có bài làm nào. Hãy bắt đầu làm quiz!</div>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Attempt Modal */}
<<<<<<< HEAD
            <Modal show={showAttemptModal} onHide={closeAttemptModal} size="lg" centered>
              <Modal.Header closeButton>
                <Modal.Title>Lịch sử làm bài chi tiết</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {attempts.length === 0 ? (
                  <div className="text-center text-muted py-3">Chưa có bài làm nào để hiển thị.</div>
                ) : (
                  <div className="table-responsive">
                    <Table hover bordered>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Quiz</th>
                          <th>Nộp lúc</th>
                          <th>Điểm</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((a) => (
                          <tr key={a.attemptID}>
                            <td>#{a.attemptID}</td>
                            <td>{a.quizTitle || "—"}</td>
                            <td>{formatVNDateTime(a.submittedAt)}</td>
                            <td>
                              <Badge
                                bg={
                                  (a.autoScore ?? 0) >= 80
                                    ? "success"
                                    : (a.autoScore ?? 0) >= 50
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {a.autoScore ?? 0}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={a.status === "SUBMITTED" ? "info" : "secondary"}>
                                {a.status || "SUBMITTED"}
                              </Badge>
                            </td>
=======
            <Modal show={showAttemptModal} onHide={()=>setShowAttemptModal(false)} size="lg" centered>
              <Modal.Header closeButton>
                <Modal.Title style={{fontWeight:800,color:"#111827"}}>Lịch sử làm bài chi tiết</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {attempts.length===0?(
                  <div className="text-center py-3" style={{color:"#9ca3af",fontWeight:600}}>Chưa có bài làm nào.</div>
                ):(
                  <div className="table-responsive">
                    <Table hover bordered>
                      <thead><tr><th>ID</th><th>Quiz</th><th>Nộp lúc</th><th>Điểm</th><th>Trạng thái</th></tr></thead>
                      <tbody>
                        {attempts.map(a=>(
                          <tr key={a.attemptID}>
                            <td>#{a.attemptID}</td><td>{a.quizTitle||"—"}</td><td>{fmtVN(a.submittedAt)}</td>
                            <td><Badge bg={(a.autoScore??0)>=80?"success":(a.autoScore??0)>=50?"warning":"danger"}>{a.autoScore??0}</Badge></td>
                            <td><Badge bg={a.status==="SUBMITTED"?"primary":"secondary"}>{a.status||"SUBMITTED"}</Badge></td>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
<<<<<<< HEAD
                <Button variant="secondary" onClick={closeAttemptModal}>
                  Đóng
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </Container>

      {/* Floating AI Chat Button */}
      {!showAIChat && (
        <button
          className="ai-fab-btn ai-fab-round"
          onClick={() => setShowAIChat(true)}
          title="Chat với EMT AI"
        >
          <span className="ai-fab-label" style={{fontSize: '1.13rem'}}>
            AI
            <span className="ai-fab-star" style={{marginLeft: 2, display: 'inline-block', verticalAlign: 'middle'}}>
              <svg width="15" height="15" viewBox="0 0 15 15" style={{position:'relative', left:'-2px', top:'-2px'}}><polygon points="7.5,1.5 9.3,5.6 14,5.8 10.5,8.6 11.7,12.8 7.5,10.4 3.3,12.8 4.5,8.6 1,5.8 5.7,5.6" fill="#FFD600" stroke="#FFD600" strokeWidth="0.5"/></svg>
            </span>
=======
                <button style={mintBtn({padding:".5rem 1.5rem",fontSize:".9rem",background:"#e5e7eb",color:"#374151"})} onClick={()=>setShowAttemptModal(false)}>Đóng</button>
              </Modal.Footer>
            </Modal>
          </Container>
        </>
      )}

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      {!showAIChat&&(
        <button className="ai-fab-btn" onClick={()=>setShowAIChat(true)} title="Chat với AI">
          <span className="ai-fab-label">
            AI
            <svg width="14" height="14" viewBox="0 0 15 15" style={{marginLeft:"2px",verticalAlign:"middle",position:"relative",top:"-1px"}}>
              <polygon points="7.5,1.5 9.3,5.6 14,5.8 10.5,8.6 11.7,12.8 7.5,10.4 3.3,12.8 4.5,8.6 1,5.8 5.7,5.6" fill="#f9c74f" stroke="#f9c74f" strokeWidth="0.5"/>
            </svg>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
          </span>
        </button>
      )}

      <style>{`
        .ai-fab-btn {
<<<<<<< HEAD
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1100;
          background: linear-gradient(135deg, #007aff 60%, #00c6fb 100%);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          min-width: 56px;
          min-height: 56px;
          max-width: 56px;
          max-height: 56px;
          box-shadow: 0 8px 32px rgba(0,42,120,0.18), 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.13rem;
          cursor: pointer;
          padding: 0;
          transition: box-shadow 0.18s, background 0.18s, transform 0.18s;
          animation: ai-fab-pop 1.2s cubic-bezier(.68,-0.55,.27,1.55);
        }
        .ai-fab-round .ai-fab-label {
          font-weight: 700;
          font-size: 1.13rem;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-fab-btn:hover {
          background: linear-gradient(135deg, #0056b3 60%, #00aaff 100%);
          box-shadow: 0 12px 40px rgba(0,42,120,0.22), 0 2px 8px rgba(0,0,0,0.10);
          transform: translateY(-2px) scale(1.06);
        }
        .ai-fab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          animation: ai-fab-bounce 1.2s infinite alternate;
        }
        .ai-fab-label {
          font-weight: 700;
          font-size: 1.13rem;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-fab-star {
          font-size: 1.1em;
          font-weight: 700;
          color: #FFD600;
          position: relative;
        }
        .ai-fab-plus-star {
          font-size: 1.1em;
          font-weight: 700;
          color: #fff;
          position: relative;
        }
        @keyframes ai-fab-pop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ai-fab-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-5px); }
        }
        @media (max-width: 600px) {
          .ai-fab-btn { right: 10px; bottom: 10px; min-width: 44px; height: 48px; padding: 0 10px 0 8px; }
          .ai-fab-label { font-size: 0.98rem; }
          .ai-fab-icon { font-size: 1.3rem; }
        }
      `}</style>
      {/* AI Chat Widget */}
      {showAIChat && (
        <AIChat isVisible={showAIChat} onClose={() => setShowAIChat(false)} />
      )}

      <style>{`
        .play-overlay:hover {
          transform: translate(-50%, -50%) scale(1.15) !important;
          background: rgba(0,0,0,0.8) !important;
        }
        .fa-robot {
          font-family: 'FontAwesome';
        }
      `}</style>
=======
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
        .play-overlay:hover{transform:translate(-50%,-50%) scale(1.15)!important;background:rgba(255,255,255,0.32)!important;}
        @media(max-width:600px){.ai-fab-btn{right:12px;bottom:12px;}}
      `}</style>

      {showAIChat&&<AIChat isVisible={showAIChat} onClose={()=>setShowAIChat(false)}/>}
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
    </div>
  );
};

<<<<<<< HEAD
export default Home;
=======
export default Home;
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
