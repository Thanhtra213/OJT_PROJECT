import React, { useState, useEffect } from "react";
import AIChat from "../AIChat/AI";
import "./HomePage.scss";
import { getAllCoursesWithDetails } from '../../middleware/courseAPI';
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { Play, Star, Users, BookOpen, Lock, Zap, Target, Award, MessageCircle, Film, Bot, BrainCircuit, LayoutDashboard } from 'lucide-react';

const HomePage = ({ onShowAuthModal }) => {
    // AI Chat widget state
    const [showAIChat, setShowAIChat] = useState(false);
  const [freeVideos, setFreeVideos] = useState([]);
  const [premiumCourses, setPremiumCourses] = useState([]);
  const navigate = useNavigate();

  const handleAuthAction = (tab = "register") => {
    if (onShowAuthModal) {
      onShowAuthModal(tab);
    } else {
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab } }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courses = await getAllCoursesWithDetails();
        
        // Process free videos
        const previews = [];
        courses.forEach(course => {
          course.chapters?.forEach(chapter => {
            chapter.videos?.forEach(video => {
              if (video.isPreview === 1 || video.isPreview === true) {
                // Extract YouTube video ID for thumbnail
                let thumbnailUrl = 'https://via.placeholder.com/300x170.png?text=No+Image';
                try {
                    const url = new URL(video.videoURL);
                    const videoId = url.searchParams.get('v');
                    if (videoId) {
                        thumbnailUrl = `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                    }
                } catch (e) {
                    console.error("Invalid video URL for thumbnail:", video.videoURL);
                }

                previews.push({
                  id: video.videoID,
                  title: video.videoName,
                  description: "Chào hỏi cơ bản trong tiếng Anh", // Placeholder description
                  duration: "5:30", // Placeholder
                  views: "1.2K",   // Placeholder
                  rating: 4.8,     // Placeholder
                  level: getCourseLevelText(course.courseLevel),
                  thumbnailUrl: thumbnailUrl,
                });
              }
            });
          });
        });
        setFreeVideos(previews.slice(0, 3));

        // Process premium courses
        const premium = courses.map(course => {
          let totalVideos = 0;
          course.chapters?.forEach(chapter => {
            totalVideos += chapter.videos?.length || 0;
          });
          return {
            id: course.courseID,
            title: course.courseName,
            description: course.description || "Khóa học tiếng Anh chất lượng cao.",
            lessons: totalVideos,
            students: "5.2K", // Placeholder
            level: getCourseLevelText(course.courseLevel),
=======
import {
  Play, Star, Users, BookOpen, Lock,
  Zap, Target, Award, MessageCircle, Film,
  Bot, BrainCircuit, LayoutDashboard
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
const LEVEL_TEXT  = { 0:"Beginner", 1:"Pre-Intermediate", 2:"Intermediate", 3:"Advanced", 4:"Expert" };
const LEVEL_CLASS = { 0:"beginner", 1:"pre-intermediate", 2:"intermediate", 3:"advanced", 4:"expert" };

const lvText  = l => LEVEL_TEXT[l]  ?? "Beginner";
const lvClass = l => LEVEL_CLASS[l] ?? "beginner";

// ─── component ────────────────────────────────────────────────────────────────
const HomePage = ({ onShowAuthModal }) => {
  const [showAIChat, setShowAIChat] = useState(false);
  const [freeVideos,     setFreeVideos]     = useState([]);
  const [premiumCourses, setPremiumCourses] = useState([]);
  const navigate = useNavigate();

  const openAuth = (tab = "register") => {
    if (onShowAuthModal) { onShowAuthModal(tab); }
    else window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab } }));
  };

  useEffect(() => {
    (async () => {
      try {
        const courses = await getAllCoursesWithDetails();

        // Free preview videos
        const previews = [];
        courses.forEach(course =>
          course.chapters?.forEach(ch =>
            ch.videos?.forEach(vid => {
              if (vid.isPreview === 1 || vid.isPreview === true) {
                let thumb = 'https://via.placeholder.com/300x170.png?text=Video';
                try {
                  const id = new URL(vid.videoURL).searchParams.get('v');
                  if (id) thumb = `https://i3.ytimg.com/vi/${id}/hqdefault.jpg`;
                } catch (_) {}
                previews.push({
                  id: vid.videoID, title: vid.videoName,
                  desc: "Bài học miễn phí — xem ngay, không cần đăng ký",
                  dur: "5:30", views: "1.2K", rating: 4.8,
                  level: lvText(course.courseLevel),
                  lvCls: lvClass(course.courseLevel),
                  thumb,
                });
              }
            })
          )
        );
        setFreeVideos(previews.slice(0, 3));

        // Premium courses
        const premium = courses.map(c => {
          const lessons = c.chapters?.reduce((s, ch) => s + (ch.videos?.length || 0), 0) ?? 0;
          return {
            id: c.courseID, title: c.courseName,
            desc: c.description || "Khóa học tiếng Anh chất lượng cao, lộ trình rõ ràng.",
            lessons, students: "5.2K",
            level: lvText(c.courseLevel), lvCls: lvClass(c.courseLevel),
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
          };
        });
        setPremiumCourses(premium.slice(0, 3));

<<<<<<< HEAD
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const getCourseLevelText = (level) => {
    const levelMap = { 0: "Beginner", 1: "Pre-Intermediate", 2: "Intermediate", 3: "Advanced" };
    return levelMap[level] || "Beginner";
  };

  return (
    <div className="new-homepage">
      <main className="main-content-new">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-left">
              <div className="hero-tag">
                <BrainCircuit size={16} /> Học thông minh với AI - Tiết kiệm 60% thời gian
              </div>
              <h1>
                Chinh phục tiếng Anh
                <span>không giới hạn</span>
              </h1>
              <p className="hero-subtitle">
                Phương pháp học tương tác với AI, feedback real-time và lộ trình được cá
                nhân hóa 100%. Từ zero tới hero chỉ trong 6 tháng.
              </p>
              <button className="cta-button-main" onClick={() => handleAuthAction('register')}>
                <Play size={18} /> Bắt đầu miễn phí
              </button>

              <div className="hero-stats-cards">
                <div className="stat-card">
                  <div className="icon-container orange">
                    <Star size={20} />
                  </div>
                  <p>4.9</p>
                  <span>Đánh giá</span>
                </div>
                <div className="stat-card">
                  <div className="icon-container purple">
                    <Users size={20} />
                  </div>
                  <p>2M+</p>
                  <span>Học viên</span>
                </div>
                <div className="stat-card">
                  <div className="icon-container green">
                    <BookOpen size={20} />
                  </div>
                  <p>1K+</p>
                  <span>Bài học</span>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="feature-card-large">
                <div className="icon-container purple-gradient">
                  <Zap size={24} />
                </div>
                <h3>AI Feedback</h3>
                <p>Nhận phản hồi chi tiết từ AI trong vài giây. Sửa lỗi ngay lập tức, tiến bộ nhanh gấp 3 lần.</p>
              </div>
              <div className="feature-card-large">
                <div className="icon-container blue-gradient">
                  <Target size={24} />
                </div>
                <h3>Lộ trình cá nhân</h3>
                <p>AI phân tích điểm mạnh/yếu của bạn, tạo lộ trình học riêng biệt. Học đúng cái bạn cần.</p>
              </div>
            </div>
          </div>
        </section>

        {/* General Features Section */}
        <section className="general-features">
           <div className="feature-item">
              <div className="icon-container green-gradient">
                <Award size={22}/>
              </div>
=======
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="new-homepage">

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="hp-hero">
        <div className="hero-inner">
          {/* Badge */}
          <div className="hero-badge">
            <BrainCircuit size={13} />
            Nền tảng học tiếng Anh với AI
          </div>

          {/* Headline */}
          <h1>
            Thành thạo tiếng Anh<br />
            <em>nhanh hơn gấp 3 lần</em>
          </h1>

          {/* Sub */}
          <p className="hero-sub">
            Lộ trình cá nhân hóa, phản hồi AI tức thì, hơn 1&nbsp;000 bài học
            từ Beginner đến Expert — tất cả trong một nền tảng.
          </p>

          {/* CTA */}
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => openAuth('register')}>
              <Play size={16} fill="currentColor" /> Bắt đầu miễn phí
            </button>
            <button className="btn-ghost" onClick={() => openAuth('login')}>
              Đăng nhập
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat"><strong>2M+</strong><span>Học viên</span></div>
            <div className="stat"><strong>4.9 ★</strong><span>Đánh giá</span></div>
            <div className="stat"><strong>1K+</strong><span>Bài học</span></div>
          </div>
        </div>
      </section>

      <div className="wrap">

        {/* ════════════════════════════════════════════
            FEATURE STRIP
        ════════════════════════════════════════════ */}
        <section style={{ paddingTop: '3rem', paddingBottom: '0' }}>
          <div className="hp-features__grid">
            <div className="hp-features__item">
              <div className="icon mint"><Award size={20} /></div>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
              <div>
                <h4>Chứng chỉ quốc tế</h4>
                <p>Được công nhận toàn cầu</p>
              </div>
            </div>
<<<<<<< HEAD
            <div className="feature-item">
              <div className="icon-container orange-gradient">
                <BrainCircuit size={22}/>
              </div>
=======
            <div className="hp-features__item">
              <div className="icon blue"><BrainCircuit size={20} /></div>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
              <div>
                <h4>100% tương tác</h4>
                <p>Không học thụ động nhàm chán</p>
              </div>
            </div>
<<<<<<< HEAD
            <div className="feature-item">
              <div className="icon-container pink-gradient">
                <MessageCircle size={22}/>
              </div>
              <div>
                <h4>Cộng đồng sôi động</h4>
                <p>Kết nối & học cùng nhau</p>
              </div>
            </div>
        </section>

        {/* Video Demo Section */}
        <section className="content-section">
          <div className="section-header">
            <h2>Video demo miễn phí</h2>
            <span className="section-tag free">Miễn phí</span>
          </div>
          <div className="card-grid">
            {freeVideos.map(video => (
              <div key={video.id} className="video-card-new" onClick={() => navigate(`/course/${video.id}`)}>
                <div className="video-thumbnail">
                  <img src={video.thumbnailUrl} alt={video.title} />
                  <div className="play-overlay">
                    <Play size={48} />
                  </div>
                  <span className={`level-tag ${video.level.toLowerCase().replace(' ', '-')}`}>{video.level}</span>
                </div>
                <div className="card-content">
                  <h4>{video.title}</h4>
                  <p>{video.description}</p>
                  <div className="card-meta">
                    <span><Play size={14} /> {video.duration}</span>
                    <span><Users size={14} /> {video.views}</span>
                    <span><Star size={14} /> {video.rating}</span>
                  </div>
                </div>
              </div>
=======
            <div className="hp-features__item">
              <div className="icon orange"><MessageCircle size={20} /></div>
              <div>
                <h4>Cộng đồng học viên</h4>
                <p>Kết nối &amp; học cùng nhau</p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FREE VIDEOS
        ════════════════════════════════════════════ */}
        <section>
          <div className="sec-head">
            <div className="sec-left">
              <span className="sec-label">Miễn phí · Không cần đăng ký</span>
              <h2>Video demo miễn phí</h2>
            </div>
          </div>

          <div className="card-grid">
            {freeVideos.map(v => (
              <article key={v.id} className="vcard"
                onClick={() => navigate(`/course/${v.id}`)}>
                <div className="thumb">
                  <img src={v.thumb} alt={v.title} loading="lazy" />
                  <span className={`lvl ${v.lvCls}`}>{v.level}</span>
                  <div className="play-ov"><Play size={40} /></div>
                </div>
                <div className="body">
                  <h4>{v.title}</h4>
                  <p>{v.desc}</p>
                  <div className="meta">
                    <span><Play size={12} /> {v.dur}</span>
                    <span><Users size={12} /> {v.views}</span>
                    <span><Star size={12} /> {v.rating}</span>
                  </div>
                </div>
              </article>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
            ))}
          </div>
        </section>

<<<<<<< HEAD
        {/* Premium Content Section */}
        <section className="content-section" id="courses">
          <div className="section-header">
            <div className="section-title">
              <h2>Khóa học Premium</h2>
              <span className="section-tag premium">Membership</span>
            </div>
            <button className="view-all-button" onClick={() => navigate('/courses')}>
              Xem tất cả &rarr;
            </button>
          </div>
          <div className="card-grid course-card-grid">
            {premiumCourses.map(course => (
              <div key={course.id} className="course-card-new" onClick={() => navigate(`/course-detail/${course.id}`)}>
                <div className="course-card-header">
                  <h4>{course.title}</h4>
                  <span className={`level-tag ${course.level.toLowerCase().replace(' ', '-')}`}>{course.level}</span>
                </div>
                <div className="card-content">
                  <p>{course.description}</p>
                  <div className="card-meta">
                    <span><BookOpen size={14} /> {course.lessons} bài học</span>
                    <span><Users size={14} /> {course.students} học viên</span>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="unlock-button" onClick={(e) => { e.stopPropagation(); handleAuthAction('register'); }}>
                    <Lock size={16} /> Mở khóa ngay
                  </button>
                </div>
              </div>
=======
        {/* ════════════════════════════════════════════
            PREMIUM COURSES
        ════════════════════════════════════════════ */}
        <section id="courses">
          <div className="sec-head">
            <div className="sec-left">
              <span className="sec-label">Membership · Truy cập không giới hạn</span>
              <h2>Khóa học Premium</h2>
            </div>
            <button className="sec-link" onClick={() => navigate('/courses')}>
              Xem tất cả →
            </button>
          </div>

          <div className="card-grid">
            {premiumCourses.map(c => (
              <article key={c.id} className="ccard"
                onClick={() => navigate(`/course-detail/${c.id}`)}>
                <div className="ccard-head">
                  <h4>{c.title}</h4>
                  <span className={`lvl ${c.lvCls}`}>{c.level}</span>
                </div>
                <div className="ccard-body"><p>{c.desc}</p></div>
                <div className="meta" style={{ padding: '0 1.5rem .85rem' }}>
                  <span><BookOpen size={12} /> {c.lessons} bài</span>
                  <span><Users size={12} /> {c.students}</span>
                </div>
                <div className="ccard-foot">
                  <button className="unlock-btn"
                    onClick={e => { e.stopPropagation(); openAuth('register'); }}>
                    <Lock size={14} /> Mở khóa ngay
                  </button>
                </div>
              </article>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
            ))}
          </div>
        </section>

<<<<<<< HEAD
        {/* Membership Features Section */}
        <section className="membership-features">
          <h2>Tính năng nổi bật khi có membership</h2>
          <div className="features-grid">
            <div className="feature-card-small">
              <div className="feature-icon-small blue">
                <Film size={24} />
              </div>
              <h4>Video HD chất lượng cao</h4>
              <p>Hàng trăm video bài giảng được sản xuất chuyên nghiệp</p>
            </div>
            <div className="feature-card-small">
              <div className="feature-icon-small purple">
                <Bot size={24} />
              </div>
              <h4>AI chấm bài viết</h4>
              <p>Hệ thống AI chấm điểm và góp ý chi tiết cho bài viết</p>
            </div>
            <div className="feature-card-small">
              <div className="feature-icon-small green">
                <BrainCircuit size={24} />
              </div>
              <h4>Luyện tập tương tác</h4>
              <p>Flashcard, quiz và game học tập thú vị</p>
            </div>
            <div className="feature-card-small">
              <div className="feature-icon-small yellow">
                <LayoutDashboard size={24} />
              </div>
              <h4>Theo dõi tiến độ</h4>
              <p>Dashboard cá nhân theo dõi quá trình học tập</p>
=======
        {/* ════════════════════════════════════════════
            MEMBERSHIP FEATURES
        ════════════════════════════════════════════ */}
        <section className="hp-membership">
          <div className="sec-head" style={{ marginBottom: '2.5rem' }}>
            <div className="sec-left">
              <span className="sec-label">Premium membership</span>
              <h2>Mọi thứ bạn cần trong một gói</h2>
            </div>
          </div>

          <div className="mem-grid">
            <div className="mem-card">
              <div className="mem-icon blue"><Film size={22} /></div>
              <h4>Video HD cao cấp</h4>
              <p>Hàng trăm bài giảng sản xuất chuyên nghiệp</p>
            </div>
            <div className="mem-card">
              <div className="mem-icon mint"><Bot size={22} /></div>
              <h4>AI chấm bài viết</h4>
              <p>Chấm điểm và góp ý chi tiết tức thì</p>
            </div>
            <div className="mem-card">
              <div className="mem-icon orange"><BrainCircuit size={22} /></div>
              <h4>Luyện tập tương tác</h4>
              <p>Flashcard, quiz và trò chơi thú vị</p>
            </div>
            <div className="mem-card">
              <div className="mem-icon gold"><LayoutDashboard size={22} /></div>
              <h4>Theo dõi tiến độ</h4>
              <p>Dashboard cá nhân trực quan, chi tiết</p>
>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
            </div>
          </div>
        </section>

<<<<<<< HEAD
        {/* Final CTA */}
        <section className="final-cta">
          <button className="cta-button-large" onClick={() => handleAuthAction('register')}>
            Bắt đầu học ngay - Chỉ từ 199k/tháng
          </button>
        </section>
      </main>
      {/* Floating AI Chat Button */}
      {!showAIChat && (
        <button
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 1100,
            background: "#007aff",
            color: "#fff",
            border: "none",
            borderRadius: "30px",
            minWidth: "60px",
            height: "60px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            cursor: "pointer",
            padding: "0 18px",
            gap: "12px",
            transition: "background 0.2s"
          }}
          onClick={() => setShowAIChat(true)}
          title="Chat với EMT AI"
        >
          <i className="fas fa-robot" style={{marginRight: 8, fontSize: '2rem'}}></i>
          <span style={{fontWeight: 600, fontSize: '1.1rem'}}>Hỏi AI</span>
        </button>
      )}
      {/* AI Chat Widget */}
      {showAIChat && (
        <AIChat isVisible={showAIChat} onClose={() => setShowAIChat(false)} />
      )}
=======
        {/* ════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════ */}
        <section className="hp-cta">
          <div className="cta-banner">
            <h2>Bắt đầu hành trình của bạn ngay hôm nay</h2>
            <p>Tham gia cùng hơn 2 triệu học viên. Dùng thử miễn phí, không cần thẻ tín dụng.</p>
            <button className="cta-btn" onClick={() => openAuth('register')}>
              <Play size={16} fill="currentColor" /> Đăng ký miễn phí — từ 199k/tháng
            </button>
          </div>
        </section>

      </div>{/* /wrap */}

      {/* ════════════════════════════════════════════
          FLOATING AI CHAT
      ════════════════════════════════════════════ */}
      {!showAIChat && (
        <button className="ai-fab" onClick={() => setShowAIChat(true)} title="Chat với EMT AI">
          <Bot size={20} />
          <span>Hỏi AI</span>
        </button>
      )}
      {showAIChat && (
        <AIChat isVisible={showAIChat} onClose={() => setShowAIChat(false)} />
      )}

>>>>>>> da80f97b997fff2c4d042a6e29340cafbba88a96
    </div>
  );
};

export default HomePage;