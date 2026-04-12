import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Button, Accordion, Alert, Tabs, Tab, Spinner, Card, Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseById, getVideoById, getCourseRating, getCourseFeedbacks } from "../../middleware/courseAPI";
import { getQuizzesByCourse } from "../../middleware/QuizAPI";
import { checkMembership } from "../../middleware/membershipAPI";
import { getFlashcardSetsByCourseId } from "../../middleware/flashcardAPI";
import { updateVideoHistory, getVideoProgress } from '../../redux/videoWatchHelper';
import { saveVideoProgress as saveProgressToDB, getVideoProgressFromDB } from "../../middleware/videoProgressAPI";
import { FaPlayCircle, FaBook, FaQuestionCircle, FaLock, FaArrowLeft, FaCheckCircle, FaStar, FaLayerGroup } from "react-icons/fa";
import "./CourseDetail.scss";

const LEVELS = {
  1: { label: "Beginner",     color: "#f97316", bg: "#fff7ed", text: "#c2410c" },
  2: { label: "Intermediate", color: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
  3: { label: "Intermediate", color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  4: { label: "Advanced",     color: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  5: { label: "Expert",       color: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
};
const getLevel = (n) => LEVELS[Number(n)] || LEVELS[1];

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef            = useRef(null);
  const iframeRef           = useRef(null);
  const progressIntervalRef = useRef(null);
  const selectedVideoRef    = useRef(null);
  const currentTimeRef      = useRef(0);
  const videoDurationRef    = useRef(0);
  const courseRef           = useRef(null);
  const pendingResumeRef    = useRef(0);
  const bannerTimerRef      = useRef(null);

  // GDrive iframe tick
  const iframePlayingRef = useRef(false);
  const iframeTickRef    = useRef(null);
  const tickStartTimeRef = useRef(0);
  const tickStartOffset  = useRef(0);

  // YouTube IFrame Player API
  const ytPlayerRef  = useRef(null);
  const ytTickRef    = useRef(null);
  const ytTickCount  = useRef(0);
  const ytInitTimer  = useRef(null);

  // ── States ────────────────────────────────────────────────────────────────
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [resumeBannerTime, setResumeBannerTime] = useState(0);
  const [activeTab,         setActiveTab]         = useState("video");
  const [course,            setCourse]            = useState(null);
  const [isLoading,         setIsLoading]         = useState(true);
  const [selectedVideo,     setSelectedVideo]     = useState(null);
  const [hasMembership,     setHasMembership]     = useState(false);
  const [videoError,        setVideoError]        = useState(null);
  const [loadingVideo,      setLoadingVideo]      = useState(false);
  const [videoProgress,     setVideoProgress]     = useState(0);
  const [videoDuration,     setVideoDuration]     = useState(0);
  const [currentTime,       setCurrentTime]       = useState(0);
  const [quizzes,           setQuizzes]           = useState([]);
  const [loadingQuizzes,    setLoadingQuizzes]    = useState(false);
  const [quizError,         setQuizError]         = useState(null);
  const [flashcardSets,     setFlashcardSets]     = useState([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [flashcardError,    setFlashcardError]    = useState(null);
  const [courseRating,      setCourseRating]      = useState(null);
  const [courseFeedbacks,   setCourseFeedbacks]   = useState([]);
  const [loadingFeedbacks,  setLoadingFeedbacks]  = useState(false);

  // ── URL helpers ───────────────────────────────────────────────────────────
  const isYouTubeUrl     = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isGoogleDriveUrl = (url) => url && (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com'));

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const m1 = url.match(/[?&]v=([^&]+)/);     if (m1) return m1[1];
    const m2 = url.match(/youtu\.be\/([^?]+)/); if (m2) return m2[1];
    const m3 = url.match(/\/embed\/([^?]+)/);   if (m3) return m3[1];
    return null;
  };

  const getDirectVideoUrl = (url) => {
    if (!url) return null;
    if (isYouTubeUrl(url)) {
      const ytId = extractYouTubeId(url);
      if (ytId) return { type: 'iframe', url: ytId, platform: 'youtube' };
    }
    if (isGoogleDriveUrl(url)) {
      let fileId = null;
      const m1 = url.match(/[?&]id=([^&]+)/);     if (m1) fileId = m1[1];
      const m2 = url.match(/\/file\/d\/([^\/]+)/); if (m2) fileId = m2[1];
      const m3 = url.match(/open\?id=([^&]+)/);    if (m3) fileId = m3[1];
      if (fileId) return { type: 'iframe', url: `https://drive.google.com/file/d/${fileId}/preview`, platform: 'gdrive' };
    }
    return { type: 'video', url, platform: 'direct' };
  };

  // ── Save progress ─────────────────────────────────────────────────────────
  const saveVideoProgressLocal = (forceCurSec, forceDurSec) => {
    const video     = selectedVideoRef.current;
    const courseObj = courseRef.current;
    if (!video || !courseObj) return;

    let curSec = forceCurSec !== undefined ? forceCurSec : undefined;
    let durSec = forceDurSec !== undefined ? forceDurSec : undefined;

    if (curSec === undefined || durSec === undefined) {
      if (video.platform === 'youtube' && ytPlayerRef.current) {
        try {
          const c = ytPlayerRef.current.getCurrentTime();
          const d = ytPlayerRef.current.getDuration();
          if (!isNaN(c) && c >= 0) curSec = curSec ?? c;
          if (!isNaN(d) && d > 0)  durSec = durSec ?? d;
        } catch {}
      }
      if (video.videoType === 'video' && videoRef.current) {
        const elCur = videoRef.current.currentTime;
        const elDur = videoRef.current.duration;
        if (!isNaN(elCur) && elCur >= 0) curSec = curSec ?? elCur;
        if (!isNaN(elDur) && elDur > 0)  durSec = durSec ?? elDur;
      }
      if (curSec === undefined) curSec = currentTimeRef.current || 0;
      if (durSec === undefined) durSec = videoDurationRef.current || 0;
    }

    if (curSec < 0) return;

    if (durSec && durSec > 0) {
      updateVideoHistory({
        courseID:    parseInt(id),
        courseName:  courseObj.courseName,
        lessonID:    video.videoID,
        lessonTitle: video.videoName,
      }, curSec, durSec);
      window.dispatchEvent(new Event("videoHistoryUpdated"));

      const isCompleted = (curSec / durSec) >= 0.95;
      saveProgressToDB(
        video.videoID,
        Math.round(curSec),
        isCompleted,
        Math.round(curSec),
        Math.round(durSec),
      );
    } else {
      saveProgressToDB(
        video.videoID,
        Math.round(curSec),
        false,
        Math.round(curSec),
        undefined,
      );
    }
  };

  // ── YouTube IFrame API script ─────────────────────────────────────────────
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // ── YouTube Player init ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedVideo || selectedVideo.platform !== 'youtube') return;
    if (loadingVideo) return;

    const initPlayer = () => {
      if (ytInitTimer.current) { clearTimeout(ytInitTimer.current); ytInitTimer.current = null; }

      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }

      ytInitTimer.current = setTimeout(() => {
        const el = document.getElementById('yt-player-div');
        if (!el) {
          ytInitTimer.current = setTimeout(() => {
            const el2 = document.getElementById('yt-player-div');
            if (!el2) return;
            createYtPlayer();
          }, 200);
          return;
        }
        createYtPlayer();
      }, 100);
    };

    const createYtPlayer = () => {
      const startSec = Math.floor(pendingResumeRef.current) || 0;
      ytPlayerRef.current = new window.YT.Player('yt-player-div', {
        videoId: selectedVideo.videoURL,
        playerVars: { rel: 0, modestbranding: 1, start: startSec },
        events: {
          onReady: (e) => {
            const dur = e.target.getDuration();
            if (dur > 0) {
              videoDurationRef.current = dur;
              setVideoDuration(dur);
              const cur = currentTimeRef.current;
              if (cur > 0) setVideoProgress(Math.min(99, Math.round((cur / dur) * 100)));
            }
            pendingResumeRef.current = 0;
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              startYtTick();
            } else if (e.data === S.PAUSED) {
              stopYtTick(true);
            } else if (e.data === S.ENDED) {
              stopYtTick(false);
              const dur       = videoDurationRef.current;
              const video     = selectedVideoRef.current;
              const courseObj = courseRef.current;
              if (!video || !courseObj || dur <= 0) return;
              updateVideoHistory({
                courseID: parseInt(id), courseName: courseObj.courseName,
                lessonID: video.videoID, lessonTitle: video.videoName,
              }, dur, dur);
              setVideoProgress(100);
              setCurrentTime(dur);
              currentTimeRef.current = dur;
              saveProgressToDB(video.videoID, Math.round(dur), true, Math.round(dur), Math.round(dur));
              window.dispatchEvent(new Event("videoHistoryUpdated"));
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
    }

    return () => {
      if (ytInitTimer.current) { clearTimeout(ytInitTimer.current); ytInitTimer.current = null; }
      stopYtTick(false);
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo?.videoID, selectedVideo?.platform, loadingVideo]);

  // ── YouTube tick ──────────────────────────────────────────────────────────
  const startYtTick = () => {
    if (ytTickRef.current) return;
    ytTickCount.current = 0;
    ytTickRef.current = setInterval(() => {
      if (document.hidden || !ytPlayerRef.current) return;
      try {
        const cur = ytPlayerRef.current.getCurrentTime() || 0;
        const dur = ytPlayerRef.current.getDuration()    || videoDurationRef.current;
        currentTimeRef.current   = cur;
        videoDurationRef.current = dur;
        setCurrentTime(cur);
        if (dur > 0) setVideoProgress(Math.min(100, Math.round((cur / dur) * 100)));
        ytTickCount.current += 1;
        if (ytTickCount.current % 10 === 0) {
          const video = selectedVideoRef.current;
          if (video && dur > 0) {
            saveProgressToDB(video.videoID, Math.round(cur), false, Math.round(cur), Math.round(dur));
          }
        }
      } catch {}
    }, 1_000);
  };

  const stopYtTick = (save = true) => {
    if (ytTickRef.current) { clearInterval(ytTickRef.current); ytTickRef.current = null; }
    if (save) saveVideoProgressLocal();
  };

  // ── GDrive iframe tick ────────────────────────────────────────────────────
  const startIframeTick = () => {
    if (iframeTickRef.current) return;
    iframePlayingRef.current = true;
    tickStartTimeRef.current = Date.now();
    tickStartOffset.current  = currentTimeRef.current;

    let lastSaveCount = 0;

    iframeTickRef.current = setInterval(() => {
      if (document.hidden || !iframePlayingRef.current) return;

      const elapsed = Math.floor((Date.now() - tickStartTimeRef.current) / 1000);
      const cur     = tickStartOffset.current + elapsed;
      currentTimeRef.current = cur;
      setCurrentTime(cur);

      const dur = videoDurationRef.current;
      if (dur > 0) setVideoProgress(Math.min(100, Math.round((cur / dur) * 100)));

      lastSaveCount += 1;
      if (lastSaveCount % 10 === 0) {
        const video     = selectedVideoRef.current;
        const courseObj = courseRef.current;
        if (video) {
          saveProgressToDB(
            video.videoID,
            Math.round(cur),
            false,
            Math.round(cur),
            dur > 0 ? Math.round(dur) : undefined,
          );
          if (dur > 0 && courseObj) {
            updateVideoHistory({
              courseID:    parseInt(id),
              courseName:  courseObj.courseName,
              lessonID:    video.videoID,
              lessonTitle: video.videoName,
            }, cur, dur);
            window.dispatchEvent(new Event("videoHistoryUpdated"));
          }
        }
      }
    }, 1_000);
  };

  const stopIframeTick = () => {
    if (!iframePlayingRef.current && !iframeTickRef.current) return;
    iframePlayingRef.current = false;
    if (iframeTickRef.current) { clearInterval(iframeTickRef.current); iframeTickRef.current = null; }
    saveVideoProgressLocal();
  };

  // ── Select video ──────────────────────────────────────────────────────────
  const handleVideoSelect = async (videoId, videoName, chapterName) => {
    if (selectedVideoRef.current) {
      const snapCur = videoRef.current && !isNaN(videoRef.current.currentTime)
        ? videoRef.current.currentTime : currentTimeRef.current;
      const snapDur = videoRef.current && !isNaN(videoRef.current.duration) && videoRef.current.duration > 0
        ? videoRef.current.duration : videoDurationRef.current;
      stopYtTick(false);
      stopIframeTick();
      if (ytInitTimer.current) { clearTimeout(ytInitTimer.current); ytInitTimer.current = null; }
      if (snapDur > 0) saveVideoProgressLocal(snapCur, snapDur);
      else saveVideoProgressLocal(snapCur, 0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    setLoadingVideo(true);
    setVideoError(null);
    setShowResumeBanner(false);

    // Reset tất cả
    currentTimeRef.current   = 0;
    videoDurationRef.current = 0;
    pendingResumeRef.current = 0;
    tickStartTimeRef.current = 0;
    tickStartOffset.current  = 0;
    setCurrentTime(0);
    setVideoDuration(0);
    setVideoProgress(0);

    try {
      const videoData = await getVideoById(videoId);
      const canWatch  = videoData.canWatch || videoData.isPreview;

      if (canWatch) {
        const videoInfo = getDirectVideoUrl(videoData.videoURL);
        const newVideo  = {
          videoID:   videoId,
          videoName,
          videoURL:  videoInfo.url,
          videoType: videoInfo.type,
          platform:  videoInfo.platform,
          canWatch,
          chapterName,
        };
        setSelectedVideo(newVideo);
        selectedVideoRef.current = newVideo;

        const dbProgress = await getVideoProgressFromDB(videoId);
        if (dbProgress) {
          const totalDurSec = dbProgress.totalDurationSec || 0;
          const lastPosSec  = dbProgress.lastPositionSec  || 0;

          pendingResumeRef.current = lastPosSec;
          currentTimeRef.current   = lastPosSec;
          videoDurationRef.current = totalDurSec;
          setCurrentTime(lastPosSec);
          setVideoDuration(totalDurSec);

          const prog = dbProgress.isCompleted ? 100
            : totalDurSec > 0 && lastPosSec > 0
              ? Math.min(99, Math.round((lastPosSec / totalDurSec) * 100))
              : 0;
          setVideoProgress(prog);

          // ✅ FIX: Hiển thị banner cho TẤT CẢ platform (không chỉ gdrive)
          if (lastPosSec > 5) {
            setResumeBannerTime(lastPosSec);
            setShowResumeBanner(true);
            if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
            bannerTimerRef.current = setTimeout(() => setShowResumeBanner(false), 9000);
          }
        } else {
          currentTimeRef.current   = 0;
          videoDurationRef.current = 0;
          pendingResumeRef.current = 0;
          setVideoProgress(0);
          setCurrentTime(0);
          setVideoDuration(0);
        }

        // GDrive: start tick ngay
        if (videoInfo.platform === 'gdrive') {
          startIframeTick();
        }

        startProgressTracking(newVideo);
      } else {
        setVideoError("Bạn cần đăng ký gói thành viên để xem video này.");
        setSelectedVideo(null);
        selectedVideoRef.current = null;
      }
    } catch (err) {
      console.error(err);
      setVideoError("Không thể tải video. Vui lòng thử lại.");
      setSelectedVideo(null);
      selectedVideoRef.current = null;
    } finally {
      setLoadingVideo(false);
    }
  };

  // ── Native video events ───────────────────────────────────────────────────
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (!dur || isNaN(dur) || dur <= 0) return;
    videoDurationRef.current = dur;
    setVideoDuration(dur);
    const resumeAt = pendingResumeRef.current;
    if (resumeAt > 0 && resumeAt < dur) {
      videoRef.current.currentTime = resumeAt;
      setVideoProgress(Math.min(99, Math.round((resumeAt / dur) * 100)));
    }
    pendingResumeRef.current = 0;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    if (!dur || isNaN(dur) || isNaN(cur) || dur <= 0) return;
    currentTimeRef.current = cur;
    if (dur !== videoDurationRef.current) { videoDurationRef.current = dur; setVideoDuration(dur); }
    setCurrentTime(cur);
    setVideoProgress(Math.min(100, Math.round((cur / dur) * 100)));
  };

  const handleVideoEnded = () => {
    const video     = selectedVideoRef.current;
    const courseObj = courseRef.current;
    if (!video || !courseObj || !videoRef.current) return;
    const dur = videoRef.current.duration;
    if (!dur || isNaN(dur)) return;
    updateVideoHistory({
      courseID: parseInt(id), courseName: courseObj.courseName || "Khóa học",
      lessonID: video.videoID, lessonTitle: video.videoName,
    }, dur, dur);
    setVideoProgress(100);
    setCurrentTime(dur);
    currentTimeRef.current = dur;
    saveProgressToDB(video.videoID, Math.round(dur), true, Math.round(dur), Math.round(dur));
    window.dispatchEvent(new Event("videoHistoryUpdated"));
  };

  const handleVideoPause = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    if (!isNaN(cur) && !isNaN(dur) && dur > 0) saveVideoProgressLocal(cur, dur);
  };

  // ── Progress interval (native video only) ────────────────────────────────
  const startProgressTracking = (videoInfo) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (!videoInfo || videoInfo.videoType !== 'video') return;
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        if (!isNaN(cur) && !isNaN(dur) && dur > 0) saveVideoProgressLocal(cur, dur);
      }
    }, 10_000);
  };

  // ── Mark completed ────────────────────────────────────────────────────────
  const markVideoAsCompleted = () => {
    const video     = selectedVideoRef.current;
    const courseObj = courseRef.current;
    if (!video || !courseObj) return;

    let durSec = 0;
    if (video.platform === 'youtube' && ytPlayerRef.current) {
      try { durSec = ytPlayerRef.current.getDuration() || 0; } catch {}
    }
    if (!durSec && video.videoType === 'video' && videoRef.current) {
      const d = videoRef.current.duration;
      if (!isNaN(d) && d > 0) durSec = d;
    }
    if (!durSec) durSec = videoDurationRef.current;
    if (!durSec || isNaN(durSec)) durSec = 600;

    updateVideoHistory({
      courseID: parseInt(id), courseName: courseObj.courseName,
      lessonID: video.videoID, lessonTitle: video.videoName,
    }, durSec, durSec);

    setVideoProgress(100);
    setCurrentTime(durSec);
    currentTimeRef.current = durSec;

    if (video.videoType === 'video' && videoRef.current) {
      videoRef.current.currentTime = videoRef.current.duration || durSec;
    }

    saveProgressToDB(video.videoID, Math.round(durSec), true, Math.round(durSec), Math.round(durSec));
    window.dispatchEvent(new Event("videoHistoryUpdated"));
    alert("✅ Đã đánh dấu hoàn thành!");
  };

  // ── Load initial data ─────────────────────────────────────────────────────
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
        courseRef.current = courseData;
        try { const rating = await getCourseRating(id); setCourseRating(rating); } catch {}

        const searchParams  = new URLSearchParams(window.location.search);
        const targetVideoId = searchParams.get('videoId');

        if (targetVideoId && courseData.chapters?.length > 0) {
          for (const chapter of courseData.chapters) {
            for (const v of chapter.videos || []) {
              const vidId = v.videoId ?? v.videoID;
              if (String(vidId) === String(targetVideoId)) {
                if (v.isPreview || membershipData.hasMembership) {
                  handleVideoSelect(vidId, v.videoName, chapter.chapterName);
                  return;
                }
              }
            }
          }
        }

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

  // ── Visibility change ─────────────────────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopYtTick(true);
        stopIframeTick();
      } else {
        if (selectedVideoRef.current?.platform === 'gdrive' && !iframeTickRef.current) {
          startIframeTick();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onUnload = () => {
      if (ytInitTimer.current) { clearTimeout(ytInitTimer.current); ytInitTimer.current = null; }
      stopYtTick(false);
      stopIframeTick();
      if (selectedVideoRef.current?.videoType === 'video' && videoRef.current) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        if (!isNaN(cur) && !isNaN(dur) && dur > 0) { saveVideoProgressLocal(cur, dur); return; }
      }
      saveVideoProgressLocal();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (ytInitTimer.current) { clearTimeout(ytInitTimer.current); ytInitTimer.current = null; }
      stopYtTick(false);
      stopIframeTick();
      onUnload();
      window.removeEventListener("beforeunload", onUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lazy loaders ──────────────────────────────────────────────────────────
  const handleLoadQuizzes = async () => {
    if (quizzes.length > 0) return;
    setLoadingQuizzes(true); setQuizError(null);
    try { const r = await getQuizzesByCourse(id); setQuizzes(Array.isArray(r.data || r) ? r.data || r : []); }
    catch { setQuizError("Không thể tải danh sách quiz."); }
    finally { setLoadingQuizzes(false); }
  };

  const handleLoadFlashcards = async () => {
    if (flashcardSets.length > 0) return;
    setLoadingFlashcards(true); setFlashcardError(null);
    try { const r = await getFlashcardSetsByCourseId(id); setFlashcardSets(Array.isArray(r.data || r) ? r.data || r : []); }
    catch { setFlashcardError("Không thể tải danh sách flashcard."); }
    finally { setLoadingFlashcards(false); }
  };

  const handleLoadFeedbacks = async () => {
    if (courseFeedbacks.length > 0) return;
    setLoadingFeedbacks(true);
    try { const r = await getCourseFeedbacks(id); setCourseFeedbacks(Array.isArray(r?.feedbacks) ? r.feedbacks : []); }
    catch { setCourseFeedbacks([]); }
    finally { setLoadingFeedbacks(false); }
  };

  useEffect(() => {
    if (activeTab === "quiz")      handleLoadQuizzes();
    if (activeTab === "flashcard") handleLoadFlashcards();
    if (activeTab === "feedback")  handleLoadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const formatTime = (s) => {
    if (!s || isNaN(s) || s < 0) return "0:00";
    const m  = Math.floor(s / 60);
    const sc = Math.floor(s % 60);
    return `${m}:${sc.toString().padStart(2, '0')}`;
  };

  if (isLoading) return (
    <div className="page-loading-container">
      <Spinner animation="border" /><p>Đang tải khóa học...</p>
    </div>
  );
  if (!course) return (
    <Container className="py-5 text-center">
      <Alert variant="warning">Không tìm thấy khóa học.</Alert>
      <Button onClick={() => navigate("/home")}>Quay về trang chủ</Button>
    </Container>
  );

  const totalVideos = course.chapters?.reduce((s, ch) => s + (ch.videos?.length || 0), 0) || 0;
  const lv = getLevel(course.courseLevel);

  return (
    <div className="course-detail-page">
      <Container fluid="xl">
        <button className="back-button" onClick={() => navigate("/home")}>
          <FaArrowLeft /><span>Quay lại</span>
        </button>

        <Row className="g-4">
          <Col lg={8} className="main-content-col">

            {/* ── Player ── */}
            {/* ✅ FIX: video-player-wrapper có position:relative, banner nằm ngoài video-container */}
            <div className="video-player-wrapper" style={{ position: 'relative' }}>

              {/* ✅ FIX: Banner đặt ở đây — ngoài video-container, hiển thị cho mọi platform */}
              {showResumeBanner && !loadingVideo && (
                <div className="resume-banner">
                  <span>⏱</span>
                  <span className="resume-banner__text">Lần trước bạn đã xem đến</span>
                  <span className="resume-banner__time">{formatTime(resumeBannerTime)}</span>
                  <button
                    className="resume-banner__btn"
                    onClick={() => {
                      setShowResumeBanner(false);
                      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
                    }}
                  >
                    Đã hiểu
                  </button>
                </div>
              )}

              {loadingVideo ? (
                <div className="player-placeholder">
                  <Spinner animation="border" /><p>Đang tải video...</p>
                </div>
              ) : videoError ? (
                <div className="player-placeholder error">
                  <FaLock size={40} /><p>{videoError}</p>
                  {!hasMembership && (
                    <button
                      style={{ background: "#00c896", color: "#fff", border: "none", borderRadius: "50px", padding: ".65rem 1.75rem", fontWeight: 800, cursor: "pointer", marginTop: ".5rem" }}
                      onClick={() => navigate('/membership')}
                    >
                      Nâng cấp tài khoản
                    </button>
                  )}
                </div>
              ) : selectedVideo ? (
                <div className="video-container">
                  {selectedVideo.platform === 'youtube' ? (
                    <div className="iframe-wrapper">
                      <div id="yt-player-div" style={{ width: '100%', height: '100%' }} />
                    </div>
                  ) : selectedVideo.videoType === 'iframe' ? (
                    // ✅ FIX: Xóa banner cũ bên trong iframe-wrapper (đã chuyển lên trên)
                    <div className="iframe-wrapper">
                      <iframe
                        ref={iframeRef}
                        src={selectedVideo.videoURL}
                        title={selectedVideo.videoName}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      src={selectedVideo.videoURL}
                      controls
                      controlsList="nodownload"
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleVideoEnded}
                      onPause={handleVideoPause}
                    />
                  )}
                </div>
              ) : (
                <div className="player-placeholder">
                  <FaPlayCircle size={50} />
                  <p>Chọn một bài học để bắt đầu</p>
                </div>
              )}
            </div>

            {/* ── Tabs ── */}
            <div className="course-content-tabs">
              <Tabs activeKey={activeTab} onSelect={k => setActiveTab(k)} id="course-tabs">

                <Tab eventKey="video" title="Tổng quan">
                  <div className="tab-pane-content">
                    <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                      <div>
                        <h2>{course.courseName}</h2>
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          <span style={{ background: lv.bg, color: lv.text, fontWeight: 800, fontSize: ".78rem", padding: "4px 14px", borderRadius: "100px", border: `1px solid ${lv.color}30` }}>
                            {lv.label}
                          </span>
                          {courseRating && (
                            <span style={{ display: "flex", alignItems: "center", gap: ".3rem", fontWeight: 700, fontSize: ".88rem", color: "#374151" }}>
                              <FaStar style={{ color: "#f59e0b" }} />{courseRating.averageRating || 0}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        style={{ background: "#00c896", color: "#fff", border: "none", borderRadius: "50px", padding: ".55rem 1.3rem", fontWeight: 800, cursor: "pointer", fontSize: ".88rem", transition: "all .22s", whiteSpace: "nowrap" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#00a87c"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#00c896"; }}
                        onClick={() => navigate(`/course/${course.courseId}/feedback`)}
                      >
                        Đánh giá khóa học
                      </button>
                    </div>

                    <p className="course-description">{course.description}</p>

                    {selectedVideo && (
                      <div className="current-lesson-info mt-4">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div>
                            <h5 className="mb-1">▶ {selectedVideo.videoName}</h5>
                            <p className="text-muted mb-0">Chương: {selectedVideo.chapterName || "N/A"}</p>
                          </div>
                          {videoProgress < 100 ? (
                            <button
                              style={{ background: "#00c896", color: "#fff", border: "none", borderRadius: "50px", padding: ".5rem 1.2rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".86rem", transition: "all .22s", flexShrink: 0 }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#00a87c"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#00c896"; }}
                              onClick={markVideoAsCompleted}
                            >
                              <FaCheckCircle />Đánh dấu hoàn thành
                            </button>
                          ) : (
                            <span style={{ background: "#e6faf4", color: "#00a87c", fontWeight: 800, fontSize: ".86rem", padding: ".45rem 1.1rem", borderRadius: "100px", display: "flex", alignItems: "center", gap: ".4rem" }}>
                              <FaCheckCircle />Đã hoàn thành
                            </span>
                          )}
                        </div>

                        {videoDuration > 0 && (
                          <div style={{ marginTop: ".85rem" }}>
                            <div style={{ height: "7px", background: "#b3f0de", borderRadius: "99px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${videoProgress}%`, background: "#00c896", borderRadius: "99px", transition: "width .4s ease" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".3rem" }}>
                              <small style={{ color: "#9ca3af", fontSize: ".76rem", fontWeight: 600 }}>
                                {formatTime(currentTime)} / {formatTime(videoDuration)}
                              </small>
                              <small style={{ color: "#00a87c", fontWeight: 700, fontSize: ".76rem" }}>{videoProgress}%</small>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Tab>

                <Tab eventKey="quiz" title={<><FaQuestionCircle style={{ marginRight: "5px" }} />Luyện tập</>}>
                  <div className="tab-pane-content">
                    {loadingQuizzes
                      ? <div className="text-center py-4"><Spinner animation="border" style={{ color: "#00c896" }} /></div>
                      : quizError
                        ? <Alert variant="danger">{quizError}</Alert>
                        : quizzes.length > 0
                          ? <div className="resource-list">
                              {quizzes.map(quiz => (
                                <div key={quiz.quizID} className="resource-item" onClick={() => navigate(`/quiz/start/${quiz.quizID}`)}>
                                  <FaQuestionCircle className="resource-icon" />
                                  <div className="resource-info"><strong>{quiz.title}</strong></div>
                                </div>
                              ))}
                            </div>
                          : <p style={{ color: "#9ca3af", fontWeight: 600 }}>Không có bài luyện tập nào.</p>
                    }
                  </div>
                </Tab>

                <Tab eventKey="flashcard" title={<><FaBook style={{ marginRight: "5px" }} />Flashcard</>}>
                  <div className="tab-pane-content">
                    {loadingFlashcards
                      ? <div className="text-center py-4"><Spinner animation="border" style={{ color: "#00c896" }} /></div>
                      : flashcardError
                        ? <Alert variant="danger">{flashcardError}</Alert>
                        : flashcardSets.length > 0
                          ? <div className="resource-list">
                              {flashcardSets.map(set => (
                                <div key={set.setID} className="resource-item" onClick={() => navigate(`/flashcard/${set.setID}`)}>
                                  <FaLayerGroup className="resource-icon" />
                                  <div className="resource-info"><strong>{set.title}</strong></div>
                                </div>
                              ))}
                            </div>
                          : <p style={{ color: "#9ca3af", fontWeight: 600 }}>Không có bộ flashcard nào.</p>
                    }
                  </div>
                </Tab>

                <Tab eventKey="feedback" title={<><FaStar style={{ marginRight: "5px" }} />Đánh giá</>}>
                  <div className="tab-pane-content">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h5 style={{ fontWeight: 800, color: "#111827", margin: 0 }}>Đánh giá từ học viên</h5>
                      <button
                        style={{ background: "#00c896", color: "#fff", border: "none", borderRadius: "50px", padding: ".5rem 1.2rem", fontWeight: 800, cursor: "pointer", fontSize: ".86rem", transition: "all .22s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#00a87c"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#00c896"; }}
                        onClick={() => navigate(`/course/${course.courseId}/feedback`)}
                      >
                        Viết đánh giá
                      </button>
                    </div>
                    {loadingFeedbacks
                      ? <div className="text-center py-4"><Spinner animation="border" style={{ color: "#00c896" }} /></div>
                      : courseFeedbacks.length > 0
                        ? <div className="feedback-list">
                            {courseFeedbacks.map((fb, i) => (
                              <Card key={i}><Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <strong>{fb.userName || "Học viên"}</strong>
                                    <div className="mt-1">
                                      {[...Array(5)].map((_, j) => (
                                        <FaStar key={j} size={13} className={j < fb.rating ? "text-warning" : "text-muted"} />
                                      ))}
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('vi-VN') : ''}
                                  </small>
                                </div>
                                <p className="mb-0">{fb.comment}</p>
                              </Card.Body></Card>
                            ))}
                          </div>
                        : <Alert variant="info">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</Alert>
                    }
                  </div>
                </Tab>
              </Tabs>
            </div>
          </Col>

          {/* ── Playlist ── */}
          <Col lg={4}>
            <div className="course-playlist-card">
              <div className="card-header">
                <h5>Nội dung khóa học</h5><span>{totalVideos} bài giảng</span>
              </div>
              <Accordion alwaysOpen defaultActiveKey={course.chapters?.[0]?.chapterID?.toString()}>
                {course.chapters?.map(chapter => (
                  <Accordion.Item eventKey={chapter.chapterID?.toString()} key={chapter.chapterID}>
                    <Accordion.Header>
                      <div className="chapter-header"><strong>{chapter.chapterName}</strong></div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <ul className="video-list">
                        {chapter.videos?.map(video => {
                          const vid         = video.videoId ?? video.videoID;
                          const canWatch    = video.isPreview || hasMembership;
                          const isPlaying   = selectedVideo?.videoID === video.videoID;
                          const saved       = getVideoProgress(video.videoID);
                          const hasWatched  = saved && saved.progress > 0;
                          const isCompleted = saved && saved.progress >= 100;
                          return (
                            <li
                              key={video.videoID}
                              className={`${canWatch ? 'watchable' : 'locked'} ${isPlaying ? 'playing' : ''}`}
                              onClick={() => canWatch && handleVideoSelect(vid, video.videoName, chapter.chapterName)}
                            >
                              <div className="video-icon">
                                {isPlaying
                                  ? <FaPlayCircle className="playing-icon" />
                                  : isCompleted
                                    ? <FaCheckCircle style={{ color: "#00c896" }} />
                                    : canWatch
                                      ? <FaPlayCircle />
                                      : <FaLock />
                                }
                              </div>
                              <div className="video-name">
                                {video.videoName}
                                {hasWatched && !isCompleted && (
                                  <small style={{ color: "#9ca3af", display: "block", fontSize: ".76rem" }}>
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
                                  <Badge pill bg="success" className="ms-1">
                                    <FaCheckCircle size={10} />
                                  </Badge>
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