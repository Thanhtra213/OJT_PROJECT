import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Button, Accordion, Alert, Tabs, Tab, Spinner, Card, Badge } from "react-bootstrap";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getCourseById, getVideoById, getCourseRating, getCourseFeedbacks } from "../../middleware/courseAPI";
import { getQuizzesByCourse } from "../../middleware/QuizAPI";
import { checkMembership } from "../../middleware/membershipAPI";
import { getFlashcardSetsByCourseId } from "../../middleware/flashcardAPI";
import { updateVideoHistory, getVideoProgress } from '../../redux/videoWatchHelper';
import { saveVideoProgress as saveProgressToDB, getVideoProgressFromDB } from "../../middleware/videoProgressAPI";
import { FaPlayCircle, FaBook, FaQuestionCircle, FaLock, FaArrowLeft, FaCheckCircle, FaStar, FaLayerGroup } from "react-icons/fa";
import "./CourseDetail.scss";

const LEVELS = {
  1: { label:"Beginner",     color:"#f97316", bg:"#fff7ed", text:"#c2410c" },
  2: { label:"Intermediate", color:"#ec4899", bg:"#fdf2f8", text:"#be185d" },
  3: { label:"Intermediate", color:"#10b981", bg:"#ecfdf5", text:"#065f46" },
  4: { label:"Advanced",     color:"#8b5cf6", bg:"#f5f3ff", text:"#5b21b6" },
  5: { label:"Expert",       color:"#3b82f6", bg:"#eff6ff", text:"#1d4ed8" },
};
const getLevel = (n) => LEVELS[Number(n)] || LEVELS[1];

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const [activeTab,        setActiveTab]        = useState("video");
  const [course,           setCourse]           = useState(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [selectedVideo,    setSelectedVideo]    = useState(null);
  const [hasMembership,    setHasMembership]    = useState(false);
  const [videoError,       setVideoError]       = useState(null);
  const [loadingVideo,     setLoadingVideo]     = useState(false);
  const [videoProgress,    setVideoProgress]    = useState(0);
  const [videoDuration,    setVideoDuration]    = useState(0);
  const [currentTime,      setCurrentTime]      = useState(0);

  const [quizzes,          setQuizzes]          = useState([]);
  const [loadingQuizzes,   setLoadingQuizzes]   = useState(false);
  const [quizError,        setQuizError]        = useState(null);

  const [flashcardSets,    setFlashcardSets]    = useState([]);
  const [loadingFlashcards,setLoadingFlashcards]= useState(false);
  const [flashcardError,   setFlashcardError]   = useState(null);

  const [courseRating,     setCourseRating]     = useState(null);
  const [courseFeedbacks,  setCourseFeedbacks]  = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [membershipData, courseData] = await Promise.all([
          checkMembership(),
          getCourseById(id),
        ]);
        setHasMembership(membershipData.hasMembership || false);
        setCourse(courseData);
        // Trong loadData, sau setCourse(courseData):
        console.log("FIRST VIDEO:", courseData.chapters?.[0]?.videos?.[0]);

        try {
          const rating = await getCourseRating(id);
          setCourseRating(rating);
        } catch (err) { console.log("Could not load rating:", err); }

        const searchParams = new URLSearchParams(window.location.search);
        const targetVideoId = searchParams.get('videoId');

        if (targetVideoId && courseData.chapters?.length > 0) {
          let found = false;
          for (const chapter of courseData.chapters) {
            for (const v of chapter.videos || []) {
              const vidId = v.videoId ?? v.videoID;
              if (String(vidId) === String(targetVideoId)) {
                found = true;
                if (v.isPreview || membershipData.hasMembership) {
                  handleVideoSelect(vidId, v.videoName, chapter.chapterName);
                  return;
                }
              }
            }
          }
        }

        // Fallback: Tự động chạy video ĐẦU TIÊN (nếu không có targetVideoId hoặc nó không được phép xem)
        if (courseData.chapters?.length > 0) {
          for (const chapter of courseData.chapters) {
            if (chapter.videos?.length > 0) {
              const firstVideo = chapter.videos[0];
              
              const vid = firstVideo.videoId ?? firstVideo.videoID;
              if (firstVideo.isPreview || membershipData.hasMembership) {
                handleVideoSelect(vid, firstVideo.videoName, chapter.chapterName);
                return;
              }
            }
          }
        }
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Video URL helpers ──────────────────────────────────────────────────────
  const isYouTubeUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isGoogleDriveUrl = (url) => url && (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com'));

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    const m1 = url.match(/[?&]v=([^&]+)/);    if (m1) videoId = m1[1];
    const m2 = url.match(/youtu\.be\/([^?]+)/); if (m2) videoId = m2[1];
    const m3 = url.match(/\/embed\/([^?]+)/);   if (m3) videoId = m3[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
  };

  const getDirectVideoUrl = (url) => {
    if (!url) return null;
    if (isYouTubeUrl(url)) {
      const embedUrl = getYouTubeEmbedUrl(url);
      if (embedUrl) return { type:'iframe', url:embedUrl, platform:'youtube' };
    }
    if (isGoogleDriveUrl(url)) {
      let fileId = null;
      const m1 = url.match(/[?&]id=([^&]+)/);       if (m1) fileId = m1[1];
      const m2 = url.match(/\/file\/d\/([^\/]+)/);   if (m2) fileId = m2[1];
      const m3 = url.match(/open\?id=([^&]+)/);      if (m3) fileId = m3[1];
      if (fileId) return { type:'iframe', url:`https://drive.google.com/file/d/${fileId}/preview`, platform:'gdrive' };
    }
    return { type:'video', url, platform:'direct' };
  };

  const handleVideoSelect = async (videoId, videoName, chapterName) => {
    console.log("VIDEO ID:", videoId, typeof videoId);
    if (selectedVideo) {
      saveVideoProgressLocal();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    setLoadingVideo(true);
    setVideoError(null);
    try {
      const videoData = await getVideoById(videoId);
      const canWatch = videoData.canWatch || videoData.isPreview;
      if (canWatch) {
        const videoInfo = getDirectVideoUrl(videoData.videoURL);
        const newVideo = {
          videoID: videoId, videoName, videoURL: videoInfo.url,
          videoType: videoInfo.type, platform: videoInfo.platform,
          canWatch, chapterName
        };
        setSelectedVideo(newVideo);

        const dbProgress = await getVideoProgressFromDB(videoId);
        if (dbProgress) {
          const dur = dbProgress.watchDurationSec || 600;
          const pos = dbProgress.lastPositionSec || 0;
          const prog = dbProgress.isCompleted ? 100 : (dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0);
          setVideoProgress(prog);
          setCurrentTime(pos);
          setVideoDuration(dur);
        } else {
          setVideoProgress(0); setCurrentTime(0); setVideoDuration(600);
        }
        startProgressTracking();
      } else {
        setVideoError("Bạn cần đăng ký gói thành viên để xem video này.");
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error(err);
      setVideoError("Không thể tải video. Vui lòng thử lại.");
      setSelectedVideo(null);
    } finally { setLoadingVideo(false); }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setVideoDuration(dur);
      const saved = getVideoProgress(selectedVideo.videoID);
      if (saved?.currentTime > 0) videoRef.current.currentTime = saved.currentTime;
      startProgressTracking();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(cur); setVideoDuration(dur);
      setVideoProgress(dur > 0 ? Math.min(100, Math.round((cur/dur)*100)) : 0);
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current && selectedVideo) {
      const dur = videoRef.current.duration;
      updateVideoHistory({
        courseID: parseInt(id), courseName: course?.courseName || "Khóa học",
        lessonID: selectedVideo.videoID, lessonTitle: selectedVideo.videoName
      }, dur, dur);
      setVideoProgress(100);
      saveProgressToDB(selectedVideo.videoID, Math.round(dur), true);
    }
  };

  const saveVideoProgressLocal = () => {
    if (!selectedVideo || !course) return;
    let cur = 0, dur = 0;

    if (selectedVideo.videoType === "video" && videoRef.current) {
      cur = videoRef.current.currentTime;
      dur = videoRef.current.duration;
    } else {
      cur = currentTime;
      dur = videoDuration || 600;
    }

    if (dur > 0 && cur >= 0) {
      updateVideoHistory({
        courseID: parseInt(id), courseName: course.courseName,
        lessonID: selectedVideo.videoID, lessonTitle: selectedVideo.videoName
      }, cur, dur);
      window.dispatchEvent(new Event("videoHistoryUpdated"));

      const isCompleted = dur > 0 && (cur / dur) >= 0.95;
      saveProgressToDB(
        selectedVideo.videoID,
        Math.round(dur),
        isCompleted,
        Math.round(cur)  
      );
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (!selectedVideo) return;
    progressIntervalRef.current = setInterval(() => {
      if (selectedVideo.videoType === "iframe") {
        setCurrentTime(prev => {
          const nt = prev + 10;
          setVideoProgress(videoDuration > 0 ? Math.min(100, Math.round((nt / videoDuration) * 100)) : 0);
          return nt;
        });
      }
      saveVideoProgressLocal();
    }, 10000);
  };

  useEffect(() => {
    const onUnload = () => saveVideoProgressLocal();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      saveVideoProgressLocal();
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [selectedVideo, course, currentTime, videoDuration]);

  const markVideoAsCompleted = () => {
    if (!selectedVideo || !course) return;
    if (selectedVideo.videoType === "video" && videoRef.current) {
      const dur = videoRef.current.duration;
      updateVideoHistory({ courseID: parseInt(id), courseName: course.courseName, lessonID: selectedVideo.videoID, lessonTitle: selectedVideo.videoName }, dur, dur);
      setVideoProgress(100);
      videoRef.current.currentTime = dur;
      saveProgressToDB(selectedVideo.videoID, Math.round(dur), true);
    } else {
      const dur = videoDuration || 600;
      updateVideoHistory({ courseID: parseInt(id), courseName: course.courseName, lessonID: selectedVideo.videoID, lessonTitle: selectedVideo.videoName }, dur, dur);
      setVideoProgress(100); setCurrentTime(dur);
      saveProgressToDB(selectedVideo.videoID, Math.round(dur), true);
    }
    window.dispatchEvent(new Event("videoHistoryUpdated"));
    alert("✅ Đã đánh dấu hoàn thành!");
  };

  // ── Lazy loaders ──────────────────────────────────────────────────────────
  const handleLoadQuizzes = async () => {
    if (quizzes.length > 0) return;
    setLoadingQuizzes(true); setQuizError(null);
    try { const r=await getQuizzesByCourse(id); setQuizzes(Array.isArray(r.data||r)?r.data||r:[]); }
    catch { setQuizError("Không thể tải danh sách quiz."); }
    finally { setLoadingQuizzes(false); }
  };

  const handleLoadFlashcards = async () => {
    if (flashcardSets.length > 0) return;
    setLoadingFlashcards(true); setFlashcardError(null);
    try { const r=await getFlashcardSetsByCourseId(id); setFlashcardSets(Array.isArray(r.data||r)?r.data||r:[]); }
    catch { setFlashcardError("Không thể tải danh sách flashcard."); }
    finally { setLoadingFlashcards(false); }
  };

  const handleLoadFeedbacks = async () => {
    if (courseFeedbacks.length > 0) return;
    setLoadingFeedbacks(true);
    try { const r=await getCourseFeedbacks(id); setCourseFeedbacks(Array.isArray(r?.feedbacks)?r.feedbacks:[]); }
    catch { setCourseFeedbacks([]); }
    finally { setLoadingFeedbacks(false); }
  };

  useEffect(() => {
    if (activeTab==="quiz")      handleLoadQuizzes();
    if (activeTab==="flashcard") handleLoadFlashcards();
    if (activeTab==="feedback")  handleLoadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const formatTime = (s) => { if(!s||isNaN(s)) return "0:00"; const m=Math.floor(s/60),sc=Math.floor(s%60); return `${m}:${sc.toString().padStart(2,'0')}`; };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="page-loading-container">
      <Spinner animation="border" /><p>Đang tải khóa học...</p>
    </div>
  );

  if (!course) return (
    <Container className="py-5 text-center">
      <Alert variant="warning">Không tìm thấy khóa học.</Alert>
      <Button onClick={()=>navigate("/home")}>Quay về trang chủ</Button>
    </Container>
  );

  const totalVideos = course.chapters?.reduce((s,ch)=>s+(ch.videos?.length||0),0)||0;
  const lv = getLevel(course.courseLevel);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="course-detail-page">
      <Container fluid="xl">
        {/* Back */}
        <button className="back-button" onClick={()=>navigate("/home")}>
          <FaArrowLeft /><span>Quay lại</span>
        </button>

        <Row className="g-4">
          {/* ── LEFT: player + tabs ──────────────────────────────────── */}
          <Col lg={8} className="main-content-col">

            {/* Player */}
            <div className="video-player-wrapper">
              {loadingVideo ? (
                <div className="player-placeholder">
                  <Spinner animation="border" /><p>Đang tải video...</p>
                </div>
              ) : videoError ? (
                <div className="player-placeholder error">
                  <FaLock size={40}/><p>{videoError}</p>
                  {!hasMembership && (
                    <button
                      style={{background:"#00c896",color:"#fff",border:"none",borderRadius:"50px",padding:".65rem 1.75rem",fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",marginTop:".5rem"}}
                      onClick={()=>navigate('/membership')}
                    >
                      Nâng cấp tài khoản
                    </button>
                  )}
                </div>
              ) : selectedVideo ? (
                <div className="video-container">
                  {selectedVideo.videoType==='iframe' ? (
                    <iframe ref={iframeRef} src={selectedVideo.videoURL} title={selectedVideo.videoName}
                      frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  ) : (
                    <video ref={videoRef} src={selectedVideo.videoURL} controls controlsList="nodownload"
                      onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate}
                      onEnded={handleVideoEnded} onPause={saveVideoProgressLocal} />
                  )}
                </div>
              ) : (
                <div className="player-placeholder">
                  <FaPlayCircle size={50}/><p>Chọn một bài học để bắt đầu</p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="course-content-tabs">
              <Tabs activeKey={activeTab} onSelect={k=>setActiveTab(k)} id="course-tabs">

                {/* ── Tổng quan ── */}
                <Tab eventKey="video" title="Tổng quan">
                  <div className="tab-pane-content">
                    <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                      <div>
                        <h2>{course.courseName}</h2>
                        {/* Level badge */}
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          <span style={{background:lv.bg,color:lv.text,fontWeight:800,fontSize:".78rem",padding:"4px 14px",borderRadius:"100px",border:`1px solid ${lv.color}30`}}>
                            {lv.label}
                          </span>
                          {courseRating && (
                            <span style={{display:"flex",alignItems:"center",gap:".3rem",fontWeight:700,fontSize:".88rem",color:"#374151"}}>
                              <FaStar style={{color:"#f59e0b"}}/>{courseRating.averageRating||0}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        style={{background:"#00c896",color:"#fff",border:"none",borderRadius:"50px",padding:".55rem 1.3rem",fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",fontSize:".88rem",transition:"all .22s",whiteSpace:"nowrap"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#00a87c";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,200,150,.35)";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#00c896";e.currentTarget.style.boxShadow="";}}
                        onClick={()=>navigate(`/course/${course.courseID}/feedback`)}
                      >
                        Đánh giá khóa học
                      </button>
                    </div>

                    <p className="course-description">{course.description}</p>

                    {/* Current lesson bar */}
                    {selectedVideo && (
                      <div className="current-lesson-info mt-4">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div>
                            <h5 className="mb-1">▶ {selectedVideo.videoName}</h5>
                            <p className="text-muted mb-0">Chương: {selectedVideo.chapterName||"N/A"}</p>
                          </div>
                          {videoProgress < 100 ? (
                            <button
                              style={{background:"#00c896",color:"#fff",border:"none",borderRadius:"50px",padding:".5rem 1.2rem",fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",gap:".4rem",fontSize:".86rem",transition:"all .22s",flexShrink:0}}
                              onMouseEnter={e=>{e.currentTarget.style.background="#00a87c";}}
                              onMouseLeave={e=>{e.currentTarget.style.background="#00c896";}}
                              onClick={markVideoAsCompleted}
                            >
                              <FaCheckCircle/>Đánh dấu hoàn thành
                            </button>
                          ) : (
                            <span style={{background:"#e6faf4",color:"#00a87c",fontWeight:800,fontSize:".86rem",padding:".45rem 1.1rem",borderRadius:"100px",display:"flex",alignItems:"center",gap:".4rem"}}>
                              <FaCheckCircle/>Đã hoàn thành
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        {videoProgress > 0 && (
                          <div style={{marginTop:".85rem"}}>
                            <div style={{height:"7px",background:"#b3f0de",borderRadius:"99px",overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${videoProgress}%`,background:"#00c896",borderRadius:"99px",transition:"width .4s ease"}}/>
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",marginTop:".3rem"}}>
                              <small style={{color:"#9ca3af",fontSize:".76rem",fontWeight:600}}>
                                {formatTime(currentTime)} / {formatTime(videoDuration)}
                              </small>
                              <small style={{color:"#00a87c",fontWeight:700,fontSize:".76rem"}}>{videoProgress}%</small>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Tab>

                {/* ── Luyện tập ── */}
                <Tab eventKey="quiz" title={<><FaQuestionCircle style={{marginRight:"5px"}}/>Luyện tập</>}>
                  <div className="tab-pane-content">
                    {loadingQuizzes ? (
                      <div className="text-center py-4"><Spinner animation="border" style={{color:"#00c896"}}/></div>
                    ) : quizError ? (
                      <Alert variant="danger">{quizError}</Alert>
                    ) : quizzes.length > 0 ? (
                      <div className="resource-list">
                        {quizzes.map(quiz=>(
                          <div key={quiz.quizID} className="resource-item" onClick={()=>navigate(`/quiz/start/${quiz.quizID}`)}>
                            <FaQuestionCircle className="resource-icon"/>
                            <div className="resource-info"><strong>{quiz.title}</strong></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{color:"#9ca3af",fontWeight:600}}>Không có bài luyện tập nào cho khóa học này.</p>
                    )}
                  </div>
                </Tab>

                {/* ── Flashcard ── */}
                <Tab eventKey="flashcard" title={<><FaBook style={{marginRight:"5px"}}/>Flashcard</>}>
                  <div className="tab-pane-content">
                    {loadingFlashcards ? (
                      <div className="text-center py-4"><Spinner animation="border" style={{color:"#00c896"}}/></div>
                    ) : flashcardError ? (
                      <Alert variant="danger">{flashcardError}</Alert>
                    ) : flashcardSets.length > 0 ? (
                      <div className="resource-list">
                        {flashcardSets.map(set=>(
                          <div key={set.setID} className="resource-item" onClick={()=>navigate(`/flashcard/${set.setID}`)}>
                            <FaLayerGroup className="resource-icon"/>
                            <div className="resource-info"><strong>{set.title}</strong></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{color:"#9ca3af",fontWeight:600}}>Không có bộ flashcard nào cho khóa học này.</p>
                    )}
                  </div>
                </Tab>

                {/* ── Đánh giá ── */}
                <Tab eventKey="feedback" title={<><FaStar style={{marginRight:"5px"}}/>Đánh giá</>}>
                  <div className="tab-pane-content">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h5 style={{fontWeight:800,color:"#111827",margin:0}}>Đánh giá từ học viên</h5>
                      <button
                        style={{background:"#00c896",color:"#fff",border:"none",borderRadius:"50px",padding:".5rem 1.2rem",fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",fontSize:".86rem",transition:"all .22s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#00a87c";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#00c896";}}
                        onClick={()=>navigate(`/course/${course.courseID}/feedback`)}
                      >
                        Viết đánh giá
                      </button>
                    </div>

                    {loadingFeedbacks ? (
                      <div className="text-center py-4"><Spinner animation="border" style={{color:"#00c896"}}/></div>
                    ) : courseFeedbacks.length > 0 ? (
                      <div className="feedback-list">
                        {courseFeedbacks.map((fb,i)=>(
                          <Card key={i}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <strong>{fb.userName||"Học viên"}</strong>
                                  <div className="mt-1">
                                    {[...Array(5)].map((_,j)=>(
                                      <FaStar key={j} size={13} className={j<fb.rating?"text-warning":"text-muted"}/>
                                    ))}
                                  </div>
                                </div>
                                <small className="text-muted">{fb.createdAt?new Date(fb.createdAt).toLocaleDateString('vi-VN'):''}</small>
                              </div>
                              <p className="mb-0">{fb.comment}</p>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="info">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</Alert>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </div>
          </Col>

          {/* ── RIGHT: playlist sidebar ──────────────────────────────── */}
          <Col lg={4}>
            <div className="course-playlist-card">
              <div className="card-header">
                <h5>Nội dung khóa học</h5>
                <span>{totalVideos} bài giảng</span>
              </div>

              <Accordion alwaysOpen defaultActiveKey={course.chapters?.[0]?.chapterID?.toString()}>
                {course.chapters?.map((chapter) => (
                  <Accordion.Item eventKey={chapter.chapterID?.toString()} key={chapter.chapterID}> 
                    <Accordion.Header>
                      <div className="chapter-header">
                        <strong>{chapter.chapterName}</strong>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <ul className="video-list">
                        {chapter.videos?.map(video => {
                          const vid = video.videoId;
                          const canWatch  = video.isPreview || hasMembership;
                          const isPlaying = selectedVideo?.videoId === video.videoID;
                          const saved     = getVideoProgress(video.videoID);
                          const hasWatched  = saved && saved.progress > 0;
                          const isCompleted = saved && saved.progress >= 100;

                          return (
                            <li
                              key={video.videoID}
                              className={`${canWatch?'watchable':'locked'} ${isPlaying?'playing':''}`}
                              onClick={()=>canWatch&&handleVideoSelect(vid,video.videoName,chapter.chapterName)}
                            >
                              <div className="video-icon">
                                {isPlaying    ? <FaPlayCircle className="playing-icon"/>
                                 : isCompleted? <FaCheckCircle style={{color:"#00c896"}}/>
                                 : canWatch   ? <FaPlayCircle/>
                                 :              <FaLock/>}
                              </div>
                              <div className="video-name">
                                {video.videoName}
                                {hasWatched && !isCompleted && (
                                  <small style={{color:"#9ca3af",display:"block",fontSize:".76rem"}}>
                                    {saved.progress}% đã xem
                                  </small>
                                )}
                              </div>
                              <div className="video-badges">
                                {video.isPreview
                                  ? <Badge pill bg="info">Xem trước</Badge>
                                  : <Badge pill bg="warning" text="dark">Membership</Badge>
                                }
                                {isCompleted && (
                                  <Badge pill bg="success" className="ms-1"><FaCheckCircle size={10}/></Badge>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CourseDetail;