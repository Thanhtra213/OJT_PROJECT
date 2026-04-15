import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./admin-dashboard-styles.scss";

export default function AdminCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chapters"); 

  const [course, setCourse] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  // SỬA: Chuyển state sang dạng object để lưu trạng thái mở của NHIỀU item cùng lúc
  const [expandedFCs, setExpandedFCs] = useState({});
  const [detailedFCs, setDetailedFCs] = useState({}); 

  // SỬA: Chuyển state sang dạng object để lưu trạng thái mở của NHIỀU item cùng lúc
  const [expandedQuizzes, setExpandedQuizzes] = useState({});
  const [detailedQuizzes, setDetailedQuizzes] = useState({}); 

  useEffect(() => {
    if (id) {
      fetchAllCourseData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    };
  };

  const fetchAllCourseData = async (courseId) => {
    setIsLoading(true);
    const API_BASE = `${process.env.REACT_APP_API_URL}/api/admin`;
    const headers = getHeaders();

    try {
      const [courseRes, flashcardRes, quizRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/courses/detail/${courseId}`, { headers }),
        axios.get(`${API_BASE}/flashcard/sets/course/${courseId}`, { headers }),
        axios.get(`${API_BASE}/quiz/course/${courseId}`, { headers })
      ]);

      if ([courseRes, flashcardRes, quizRes].some(res => res.status === "rejected" && res.reason?.response?.status === 401)) {
        Swal.fire("Phiên đăng nhập hết hạn!", "Vui lòng đăng xuất và đăng nhập lại để tiếp tục.", "warning");
        setIsLoading(false);
        return;
      }

      if (courseRes.status === "fulfilled") setCourse(courseRes.value.data);
      else Swal.fire("Lỗi", "Không thể tải thông tin chi tiết khóa học.", "error");

      if (flashcardRes.status === "fulfilled") {
        let fcData = flashcardRes.value.data;
        if (fcData && Array.isArray(fcData.data)) fcData = fcData.data;
        setFlashcards(Array.isArray(fcData) ? fcData : []);
      }

      if (quizRes.status === "fulfilled") {
        let qzData = quizRes.value.data;
        if (qzData && Array.isArray(qzData.data)) qzData = qzData.data;
        setQuizzes(Array.isArray(qzData) ? qzData : []);
      }
    } catch (error) {
      Swal.fire("Lỗi Hệ Thống", "Đã xảy ra lỗi khi kết nối với máy chủ.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFlashcard = async (setId) => {
    if (!setId) return;

    // SỬA: Đảo ngược trạng thái mở/đóng của riêng thẻ này
    setExpandedFCs(prev => ({ ...prev, [setId]: !prev[setId] }));
    
    // Nếu chưa load chi tiết thì mới gọi API
    if (!detailedFCs[setId]) {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/flashcard/set/${setId}`, { headers: getHeaders() });
        const data = res.data?.data || res.data;
        
        let cardsArray = [];
        if (Array.isArray(data)) cardsArray = data;
        else if (Array.isArray(data.items)) cardsArray = data.items;
        else if (Array.isArray(data.flashcards)) cardsArray = data.flashcards;
        else if (Array.isArray(data.cards)) cardsArray = data.cards;
        else if (typeof data === 'object' && data !== null) {
          const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
          if (arrayKey) cardsArray = data[arrayKey];
        }
        
        setDetailedFCs(prev => ({ ...prev, [setId]: cardsArray }));
      } catch (err) {
        Swal.fire("Lỗi", "Không thể tải danh sách từ vựng", "error");
      }
    }
  };

  const handleToggleQuiz = async (quizId) => {
    if (!quizId) return;

    // SỬA: Đảo ngược trạng thái mở/đóng của riêng quiz này
    setExpandedQuizzes(prev => ({ ...prev, [quizId]: !prev[quizId] }));

    // Nếu chưa load chi tiết thì mới gọi API
    if (!detailedQuizzes[quizId]) {
      try {
        let data;
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/quiz/${quizId}`, { headers: getHeaders() });
          data = res.data?.data || res.data;
        } catch (e1) {
          try {
            const res2 = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/quiz/detail/${quizId}`, { headers: getHeaders() });
            data = res2.data?.data || res2.data;
          } catch (e2) {
            const res3 = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/quizzes/${quizId}`, { headers: getHeaders() });
            data = res3.data?.data || res3.data;
          }
        }

        let groupsList = [];
        if (Array.isArray(data.groups)) groupsList = data.groups;
        else if (Array.isArray(data.questions)) groupsList = [{ groupName: "Danh sách câu hỏi", questions: data.questions }];
        else if (Array.isArray(data)) groupsList = [{ groupName: "Danh sách câu hỏi", questions: data }];
        else if (typeof data === 'object' && data !== null) {
          const key = Object.keys(data).find(k => Array.isArray(data[k]));
          if (key) {
            if (data[key].length > 0 && data[key][0].questions) groupsList = data[key];
            else groupsList = [{ groupName: "Danh sách câu hỏi", questions: data[key] }];
          }
        }

        setDetailedQuizzes(prev => ({ ...prev, [quizId]: groupsList }));
      } catch (err) {
        Swal.fire("Lỗi API", "Không thể lấy chi tiết Quiz. (Báo lỗi 404 cho tất cả endpoint)", "error");
      }
    }
  };

  const handleGoBack = () => {
    localStorage.setItem("adminActiveTab", "courses");
    navigate("/admin/dashboard", { state: { activeTab: "courses" } });
  };

  if (isLoading) {
    return (
      <div className="admin-loading-spinner" style={{ minHeight: '60vh' }}>
        <div className="admin-spinner"></div>
        <p>Đang tổng hợp dữ liệu khóa học...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="management-card">
        <div className="admin-empty-data" style={{ padding: "4rem 0" }}>
          <h2>Không tìm thấy khóa học</h2>
          <button className="secondary-button mt-3" onClick={handleGoBack}>Quay lại</button>
        </div>
      </div>
    );
  }

  let isCourseActive = true; 
  if (course.hasOwnProperty('isActive')) isCourseActive = course.isActive;
  else if (course.hasOwnProperty('active')) isCourseActive = course.active;
  else if (course.hasOwnProperty('status')) {
      const s = String(course.status).toUpperCase();
      isCourseActive = (s === 'ACTIVE' || s === '1' || s === 'TRUE');
  }

  return (
    // SỬA: Thêm overflow: "hidden" và borderRadius: "20px" để background con không đè lên viền góc bo
    <div className="management-card" style={{ padding: "0", margin: "1.5rem 2rem", overflow: "hidden", borderRadius: "20px" }}>
      <div style={{ padding: "2rem", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-page)" }}>
        <button className="secondary-button" style={{ marginBottom: "1.5rem", border: "none", background: "transparent", padding: "0", fontWeight: "bold", color: "var(--primary)", cursor: "pointer" }} onClick={handleGoBack}>
          Quay lại danh sách
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-dark)", marginBottom: "0.5rem" }}>{course.courseName}</h1>
            <p style={{ color: "var(--text-body)", fontSize: "1rem", maxWidth: "800px", lineHeight: "1.6" }}>{course.description || course.courseDescription || "Chưa có mô tả."}</p>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Giảng viên: {course.teacher?.teacherName || course.teacherName || "N/A"}</span>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Ngày tạo: {new Date(course.createAt || course.createdAt).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
             <span className="status-badge" style={{ backgroundColor: isCourseActive ? 'var(--primary-light)' : 'rgba(245,158,11,0.12)', color: isCourseActive ? 'var(--primary)' : '#f59e0b', fontSize: '0.9rem', padding: '8px 16px' }}>
                {isCourseActive ? "Đang hoạt động" : "Đã ẩn"}
             </span>
             <p style={{ marginTop: "10px", fontWeight: 800, color: "var(--text-muted)", fontSize: "0.9rem" }}>Mã KH: <span style={{ color: "var(--primary)" }}>{course.courseID || course.courseId}</span></p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 2rem", backgroundColor: "var(--bg-card)", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("chapters")} style={{ padding: "1rem 1.5rem", background: "none", border: "none", borderBottom: activeTab === "chapters" ? "3px solid var(--primary)" : "3px solid transparent", color: activeTab === "chapters" ? "var(--primary)" : "var(--text-muted)", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" }}>
          Lộ trình & Video ({course.chapters?.length || 0})
        </button>
        <button onClick={() => setActiveTab("flashcards")} style={{ padding: "1rem 1.5rem", background: "none", border: "none", borderBottom: activeTab === "flashcards" ? "3px solid var(--primary)" : "3px solid transparent", color: activeTab === "flashcards" ? "var(--primary)" : "var(--text-muted)", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" }}>
          Bộ Flashcard ({flashcards.length})
        </button>
        <button onClick={() => setActiveTab("quizzes")} style={{ padding: "1rem 1.5rem", background: "none", border: "none", borderBottom: activeTab === "quizzes" ? "3px solid var(--primary)" : "3px solid transparent", color: activeTab === "quizzes" ? "var(--primary)" : "var(--text-muted)", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" }}>
          Bài luyện tập ({quizzes.length})
        </button>
      </div>

      <div style={{ padding: "2rem", backgroundColor: "var(--bg-card)", minHeight: "400px" }}>
        
        {/* TAB: LỘ TRÌNH (CHAPTERS) */}
        {activeTab === "chapters" && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-dark)" }}>Lộ trình giảng dạy & Link Video</h3>
            {course.chapters && course.chapters.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {course.chapters.map((chapter, index) => {
                   const chapterId = chapter.chapterID || chapter.chapterId || chapter.id || chapter.Id || index;
                   return (
                    <div key={chapterId} style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                      <div style={{ backgroundColor: "var(--bg-page)", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--text-dark)" }}>Chương {index + 1}: {chapter.chapterName || chapter.title}</h4>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", backgroundColor: "var(--primary-light)", padding: "4px 10px", borderRadius: "99px" }}>{chapter.videos?.length || 0} Video</span>
                      </div>
                      <div style={{ padding: "1rem 1.5rem" }}>
                        {chapter.videos && chapter.videos.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {chapter.videos.map((vid, vIndex) => {
                              const videoId = vid.videoID || vid.videoId || vid.id || vid.Id || vIndex;
                              return (
                              <div key={videoId} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--bg-page)" }}>
                                <div style={{ fontWeight: 800, color: "var(--text-dark)", fontSize: "0.95rem" }}>
                                  Bài {vIndex + 1}: {vid.videoName || vid.title}
                                </div>
                                <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-body)" }}>
                                  {vid.description && <p style={{ margin: "0 0 6px 0" }}><strong>Mô tả:</strong> {vid.description}</p>}
                                  <p style={{ margin: 0 }}>
                                    <strong>Link:</strong>{" "}
                                    {vid.videoUrl ? (
                                      <a href={vid.videoUrl} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>
                                        {vid.videoUrl}
                                      </a>
                                    ) : "Đang cập nhật link video"}
                                  </p>
                                </div>
                              </div>
                            )})}
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>Chưa có video nào.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="admin-empty-data">Khóa học này chưa có lộ trình nào.</div>}
          </div>
        )}

        {/* TAB: FLASHCARDS */}
        {activeTab === "flashcards" && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-dark)" }}>Kho Flashcard</h3>
            {flashcards.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {flashcards.map((fc) => {
                  const fcId = fc.setId || fc.setID || fc.flashcardSetId || fc.FlashcardSetId || fc.id || fc.Id;
                  // SỬA: Check theo object state
                  const isExpanded = !!expandedFCs[fcId];
                  const cardsList = detailedFCs[fcId] || [];

                  return (
                    <div key={fcId || Math.random()} style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                      <div style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-dark)", margin: "0 0 0.5rem 0" }}>{fc.title || fc.name || "Bộ Flashcard"}</h4>
                          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>{fc.description || "Không có mô tả"}</p>
                        </div>
                        <button className="primary-button" onClick={() => handleToggleFlashcard(fcId)} style={{ padding: "8px 16px" }}>
                          {isExpanded ? "Đóng thẻ" : "Xem từ vựng"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-page)", padding: "1.5rem" }}>
                          <h5 style={{ margin: "0 0 1rem 0", fontWeight: 800, fontSize: "0.95rem", color: "var(--text-dark)" }}>Danh sách từ vựng ({cardsList.length}):</h5>
                          {cardsList.length > 0 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                              {cardsList.map((card, idx) => {
                                const front = card.frontText || card.term || card.word;
                                const back = card.backText || card.definition || card.meaning;
                                const ipa = card.ipa;
                                const example = card.example;
                                
                                return (
                                <div key={card.itemID || card.id || idx} style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                                  <p style={{ margin: "0 0 4px 0", fontWeight: 900, color: "var(--primary)", fontSize: "1.1rem" }}>{front}</p>
                                  {ipa && <p style={{ margin: "0 0 8px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>/{ipa}/</p>}
                                  
                                  <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "10px 0" }} />
                                  
                                  <p style={{ margin: 0, color: "var(--text-dark)", fontSize: "0.95rem", fontWeight: 600 }}>{back}</p>
                                  {example && <p style={{ margin: "8px 0 0 0", color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>VD: {example}</p>}
                                </div>
                              )})}
                            </div>
                          ) : (
                            <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "var(--bg-page)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                              <p style={{ margin: 0, fontStyle: "italic", color: "var(--text-muted)", fontWeight: "600" }}>Bộ flashcard này hiện chưa có từ vựng nào.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <div className="admin-empty-data">Không có bộ Flashcard nào.</div>}
          </div>
        )}

        {/* TAB: QUIZZES */}
        {activeTab === "quizzes" && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-dark)" }}>Bài luyện tập (Quiz)</h3>
            {quizzes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {quizzes.map((quiz) => {
                  const qId = quiz.quizId || quiz.quizID || quiz.QuizId || quiz.QuizID || quiz.id || quiz.Id;
                  // SỬA: Check theo object state
                  const isExpanded = !!expandedQuizzes[qId];
                  const groupsList = detailedQuizzes[qId] || [];

                  return (
                    <div key={qId || Math.random()} style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                      <div style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
                            <h4 style={{ margin: "0", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-dark)" }}>{quiz.title || quiz.quizName || "Bài Quiz"}</h4>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, backgroundColor: quiz.isActive ? 'var(--primary-light)' : 'rgba(245,158,11,0.1)', color: quiz.isActive ? 'var(--primary)' : '#f59e0b', padding: "2px 8px", borderRadius: "99px" }}>
                              {quiz.isActive ? "Hoạt động" : "Đã ẩn"}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 8px 0" }}>{quiz.description || "Không có mô tả"}</p>
                          <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>
                            <span>Thời gian: {quiz.timeLimit || 0} phút</span>
                            <span>•</span>
                            <span>Điểm qua: {quiz.passingScore || 0}%</span>
                          </div>
                        </div>
                        <button className="primary-button" onClick={() => handleToggleQuiz(qId)} style={{ padding: "8px 16px" }}>
                          {isExpanded ? "Đóng câu hỏi" : "Xem câu hỏi"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-page)", padding: "1.5rem" }}>
                          {groupsList.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                              {groupsList.map((group, gIdx) => (
                                <div key={group.groupId || gIdx} style={{ backgroundColor: "var(--bg-card)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                  <h5 style={{ margin: "0 0 1rem 0", fontWeight: 800, fontSize: "1rem", color: "var(--primary)", borderBottom: "1px dashed var(--border)", paddingBottom: "8px" }}>
                                    Phần {gIdx + 1}: {group.groupName || group.title || "Nhóm câu hỏi"}
                                  </h5>
                                  
                                  {group.questions && group.questions.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                      {group.questions.map((q, qIdx) => {
                                        const answersList = q.answers || q.options || q.choices || [];
                                        return (
                                        <div key={q.questionId || qIdx}>
                                          <p style={{ fontWeight: 700, margin: "0 0 8px 0", fontSize: "0.95rem", color: "var(--text-dark)" }}>
                                            Câu {qIdx + 1}: {q.questionText || q.content}
                                          </p>
                                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "10px" }}>
                                            {answersList.map((ans, aIdx) => {
                                              const isCorrect = ans.isCorrect || ans.correct || false;
                                              const text = ans.answerText || ans.content || ans.text || "Đang cập nhật đáp án";
                                              return (
                                              <div key={ans.answerId || aIdx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: isCorrect ? "var(--primary-dark)" : "var(--text-body)", fontWeight: isCorrect ? 700 : 500, backgroundColor: isCorrect ? "var(--primary-light)" : "transparent", padding: "6px 10px", borderRadius: "6px" }}>
                                                {isCorrect ? <strong style={{color: "var(--primary-dark)"}}></strong> : <span style={{color: "var(--text-muted)"}}> </span>}
                                                {text}
                                              </div>
                                            )})}
                                          </div>
                                        </div>
                                      )})}
                                    </div>
                                  ) : (
                                    <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "var(--bg-page)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                                      <p style={{ margin: 0, fontStyle: "italic", color: "var(--text-muted)", fontWeight: "600" }}>Nhóm này hiện chưa có câu hỏi nào.</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ padding: "1.5rem", textAlign: "center", backgroundColor: "var(--bg-card)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                              <p style={{ margin: 0, fontStyle: "italic", color: "var(--text-muted)", fontWeight: "600" }}>Bài quiz này hiện chưa có câu hỏi nào.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <div className="admin-empty-data">Không có bài luyện tập nào.</div>}
          </div>
        )}
      </div>
    </div>
  );
}