import React, { useState, useEffect } from "react";
import AIChat from "../AIChat/AI";
import "./HomePage.scss";
import { getAllCoursesWithDetails } from '../../middleware/courseAPI';
import { useNavigate } from "react-router-dom";
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
          };
        });
        setPremiumCourses(premium.slice(0, 3));

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
              <div>
                <h4>Chứng chỉ quốc tế</h4>
                <p>Được công nhận toàn cầu</p>
              </div>
            </div>
            <div className="hp-features__item">
              <div className="icon blue"><BrainCircuit size={20} /></div>
              <div>
                <h4>100% tương tác</h4>
                <p>Không học thụ động nhàm chán</p>
              </div>
            </div>
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
            ))}
          </div>
        </section>

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
            ))}
          </div>
        </section>

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
            </div>
          </div>
        </section>

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

    </div>
  );
};

export default HomePage;