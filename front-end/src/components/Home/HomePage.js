import React, { useState, useEffect } from "react";
import AIChat from "../AIChat/AI";
import "./HomePage.scss";
import { getAllCoursesWithDetails, getVideoById } from '../../middleware/courseAPI';
import { useNavigate } from "react-router-dom";
import {
  Play, Star, Users, BookOpen, Lock,
  Zap, Target, Award, MessageCircle, Film,
  Bot, BrainCircuit, LayoutDashboard
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
const LEVEL_TEXT = { 0: "Beginner", 1: "Pre-Intermediate", 2: "Intermediate", 3: "Advanced", 4: "Expert" };
const LEVEL_CLASS = { 0: "beginner", 1: "pre-intermediate", 2: "intermediate", 3: "advanced", 4: "expert" };

const lvText = l => LEVEL_TEXT[l] ?? "Beginner";
const lvClass = l => LEVEL_CLASS[l] ?? "beginner";
const parseError = (error) => {
  const data = error?.response?.data;
  return (typeof data === "string" && data.trim())
    || data?.message
    || data?.error
    || error?.message
    || "Đã có lỗi xảy ra.";
};

// ─── component ────────────────────────────────────────────────────────────────
const HomePage = ({ onShowAuthModal }) => {
  const [showAIChat, setShowAIChat] = useState(false);
  const [freeVideos, setFreeVideos] = useState([]);
  const [premiumCourses, setPremiumCourses] = useState([]);
  const navigate = useNavigate();

  const openAuth = (tab = "register") => {
    window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab } }));
  };

  useEffect(() => {
    (async () => {
      try {
        const courses = await getAllCoursesWithDetails();

        // Free preview videos (1 random per course)
        const previews = [];
        courses.forEach(course => {
          let freeVids = [];
          course.chapters?.forEach(ch => {
            ch.videos?.forEach(vid => {
              if (vid.isPreview === 1 || vid.isPreview === true) {
                freeVids.push({
                  id: vid.videoID || vid.videoId || vid.id,
                  courseId: course.courseID || course.courseId || course.id,
                  title: vid.videoName || vid.title || "Video",
                  desc: "Bài học miễn phí — xem ngay, không cần đăng ký",
                  dur: "5:30", views: "1.2K", rating: 4.8,
                  level: lvText(course.courseLevel),
                  lvCls: lvClass(course.courseLevel),
                  thumb: 'https://placehold.co/300x170/00c896/ffffff?text=' + encodeURIComponent("Video Demo"),
                });
              }
            });
          });
          if (freeVids.length > 0) {
            // Lấy ngẫu nhiên 1 video từ mỗi khóa
            const randomVid = freeVids[Math.floor(Math.random() * freeVids.length)];
            previews.push(randomVid);
          }
        });

        // Giới hạn hiển thị 3 video
        const finalPreviews = previews.slice(0, 3);

        // Fetch Thumbnail thông qua getVideoById vì getAllCourses không có videoURL
        for (let p of finalPreviews) {
          try {
            const detail = await getVideoById(p.id);
            let thumb = detail.thumbnailUrl || detail.thumbnailURL || detail.thumbnail || p.thumb;
            const vUrl = detail.videoUrl || detail.videoURL || detail.videoLink || detail.url || "";
            if (!detail.thumbnailUrl && !detail.thumbnailURL && !detail.thumbnail && vUrl) {
              let ytId = null;
              if (vUrl.includes("youtube.com/watch?v=")) ytId = vUrl.split("v=")[1].split("&")[0];
              else if (vUrl.includes("youtu.be/")) ytId = vUrl.split("youtu.be/")[1].split("?")[0];
              else if (vUrl.includes("youtube.com/embed/")) ytId = vUrl.split("embed/")[1].split("?")[0];
              else if (vUrl.includes("youtube.com/shorts/")) ytId = vUrl.split("shorts/")[1].split("?")[0];

              if (ytId) {
                thumb = `https://i3.ytimg.com/vi/${ytId}/hqdefault.jpg`;
              } else if (vUrl.includes("drive.google.com/file/d/")) {
                let driveId = vUrl.split("/d/")[1];
                if (driveId.includes("/")) driveId = driveId.split("/")[0];
                if (driveId) thumb = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
              } else if (vUrl.includes("drive.google.com/open?id=")) {
                let driveId = vUrl.split("id=")[1].split("&")[0];
                if (driveId) thumb = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
              } else if (!vUrl.includes("/") && vUrl.length >= 25 && vUrl.length <= 40) {
                // Nó là Google Drive ID trơ
                thumb = `https://drive.google.com/thumbnail?id=${vUrl}&sz=w800`;
              } else if (vUrl.startsWith("http")) {
                // Bất kỳ link lạ nào không phải YT/Drive, thử ngàm vào thẻ video
                thumb = vUrl;
                p.isVideo = true;
              } else {
                thumb = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=340&fit=crop&q=80';
              }
            } else if (!vUrl && !p.thumb.includes("unsplash")) {
              // Nếu KHÔNG có link video luôn
              p.thumb = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=340&fit=crop&q=80';
            }
            if (thumb) p.thumb = thumb;
          } catch (e) {
            console.error("Lỗi lấy video chi tiết cho thumbnail:", e);
          }
        }

        setFreeVideos(finalPreviews);

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

          {/* Cột trái */}
          <div className="hero-text-col">
            <div className="hero-badge"><BrainCircuit size={13} /> Nền tảng học tiếng Anh với AI</div>
            <h1>Thành thạo tiếng Anh<br /><em>nhanh hơn gấp 3 lần</em></h1>
            <p className="hero-sub">Lộ trình cá nhân hóa, phản hồi AI tức thì, hơn 1&nbsp;000 bài học từ Beginner đến Expert — tất cả trong một nền tảng.</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => openAuth('register')}><Play size={16} fill="currentColor" /> Bắt đầu miễn phí</button>
              <button className="btn-ghost" onClick={() => openAuth('login')}>Đăng nhập</button>
            </div>
            <div className="hero-stats">
              <div className="stat"><strong>2M+</strong><span>Học viên</span></div>
              <div className="stat"><strong>4.9 ★</strong><span>Đánh giá</span></div>
              <div className="stat"><strong>1K+</strong><span>Bài học</span></div>
            </div>
          </div>

          {/* Cột phải */}
          <div className="hero-visual">
            <div className="hero-img-frame" />
            <div className="hero-float-card">
              <div className="float-icon">🏆</div>
              <div className="float-text"><strong>1,235 Khóa học</strong><span>Cập nhật liên tục</span></div>
            </div>
            <div className="hero-float-card-2"><strong>4.8 ★</strong><span>Đánh giá</span></div>
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
                onClick={() => navigate(`/course/${v.courseId}?videoId=${v.id}`)}>
                <div className="thumb">
                  {v.isVideo ? (
                    <video src={`${v.thumb}#t=0.001`} preload="metadata" playsInline muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#e5e7eb' }}
                      onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<img src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=340&fit=crop&q=80" style="width:100%;height:100%;object-fit:cover;" />` }}
                    />
                  ) : (
                    <img src={v.thumb} alt={v.title} loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=340&fit=crop&q=80" }}
                    />
                  )}
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
            <div className="cta-text">
              <h2>Bắt đầu hành trình của bạn<br /><span>ngay hôm nay</span></h2>
              <p>Tham gia cùng hơn 2 triệu học viên. Dùng thử miễn phí, không cần thẻ tín dụng.</p>
            </div>
            <button className="cta-btn" onClick={() => openAuth('register')}>
              <Play size={16} fill="currentColor" /> Đăng ký miễn phí — từ 199k/tháng
            </button>
          </div>
        </section>

      </div>{/* /wrap */}

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