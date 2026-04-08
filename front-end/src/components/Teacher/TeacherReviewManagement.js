import React, { useState, useEffect } from "react";
import { 
  getTeacherReviews, 
  updateReviewScore 
} from "../../middleware/teacher/reviewTeacherAPI";
import { 
  ClipboardCheck, 
  Eye, 
  Send,
  ArrowLeft,
  FileCheck,
  Star,
  User,
  BookOpen,
  Brain
} from "lucide-react";
import "./Reviews.scss";

export function TeacherReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    aiReviewId: 0,
    scoreOverall: 0,
    scoreTask: 0,
    scoreCoherence: 0,
    scoreLexical: 0,
    scoreGrammar: 0,
    scorePronunciation: 0,
    scoreFluency: 0,
    feedback: ""
  });

  const [activeSubTab, setActiveSubTab] = useState("Writing"); // Default to Writing

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const data = await getTeacherReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi tải bài làm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reviews based on sub-tab
  const filteredReviews = reviews.filter(item => {
    const category = item.category?.toLowerCase() || "";
    const isSpeaking = category === "speaking" || !!item.audioUrl || !!item.transcript;
    const isWriting = category === "writing" || (!isSpeaking && !!item.studentAnswer);
    
    if (activeSubTab === "Speaking") return isSpeaking;
    return isWriting;
  });

  const handleViewDetail = (review) => {
    setSelectedReview(review);
    setFormData({
      aiReviewId: review.aiReviewId,
      scoreOverall: review.scoreOverall || 0,
      scoreTask: review.scoreTask || 0,
      scoreCoherence: review.scoreCoherence || 0,
      scoreLexical: review.scoreLexical || 0,
      scoreGrammar: review.scoreGrammar || 0,
      scorePronunciation: review.scorePronunciation || 0,
      scoreFluency: review.scoreFluency || 0,
      feedback: review.feedback || ""
    });
    setMessage({ text: "", type: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name !== "feedback" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await updateReviewScore(formData);
      setMessage({ text: "Gửi nhận xét thành công!", type: "success" });
      loadReviews(); // Refresh list
    } catch (error) {
      setMessage({ text: "Gửi nhận xét thất bại.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading-spinner py-20">
        <div className="admin-spinner"></div>
        <p>Đang tải danh sách bài làm...</p>
      </div>
    );
  }

  // Listing View
  if (!selectedReview) {
    return (
      <div className="management-card">
        <div className="management-card-header">
          <div>
            <h2 className="card-title">Chấm điểm bài làm</h2>
            <p className="card-description">Xem và đánh giá bài làm của học viên</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="review-sub-tabs">
          <button 
            className={`review-tab-btn ${activeSubTab === "Writing" ? "active writing" : ""}`}
            onClick={() => setActiveSubTab("Writing")}
          >
            <BookOpen size={18} />
            <span>Writing Practice</span>
            {activeSubTab === "Writing" && <div className="active-line" />}
          </button>
          <button 
            className={`review-tab-btn ${activeSubTab === "Speaking" ? "active speaking" : ""}`}
            onClick={() => setActiveSubTab("Speaking")}
          >
            <Send size={18} className="icon-speaking" />
            <span>Speaking Practice</span>
            {activeSubTab === "Speaking" && <div className="active-line" />}
          </button>
        </div>

        <div className="management-table-wrapper">
          <table className="management-table">
            <thead>
              <tr>
                <th>HỌC VIÊN</th>
                <th>BÀI LÀM</th>
                <th>AI ĐÁNH GIÁ</th>
                <th>ĐIỂM GỐC</th>
                <th>TRẠNG THÁI</th>
                <th className="text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length > 0 ? (
                filteredReviews.map((item) => (
                  <tr key={item.aiReviewId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-primary" />
                        <span className="font-bold">{item.studentName || item.username || 'Ẩn danh'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm truncate max-w-[200px]" title={item.studentAnswer}>
                        {item.studentAnswer || 'Nội dung trống'}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Brain size={14} className="text-purple-500" />
                        <span>{item.aiScore || 0}/10</span>
                      </div>
                    </td>
                    <td><span className="font-bold">{item.scoreOverall || 0}</span></td>
                    <td>
                      <span className={`status-badge ${item.isTeacherReviewed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {item.isTeacherReviewed ? 'Đã chấm' : 'Chờ chấm'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        className="icon-action-btn" 
                        onClick={() => handleViewDetail(item)}
                        title="Chấm điểm"
                      >
                        <ClipboardCheck size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    Không có bài làm nào cần xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Detail & Editing View
  return (
    <div className="management-card">
      <div className="management-card-header flex justify-between items-center">
        <button className="secondary-button" onClick={() => setSelectedReview(null)}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className="text-right">
          <h2 className="card-title">Chấm điểm: {selectedReview.studentName || selectedReview.username}</h2>
          <p className="card-description">Mô phỏng chấm thi IELTS / Speaking / Writing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left Side: Submission & AI Feedback */}
        <div className="flex flex-col gap-4">
          <div className="interactive-card p-4">
            <h4 className="flex items-center gap-2 text-primary font-bold mb-3">
              <BookOpen size={18} /> Nội dung bài làm
            </h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 min-h-[150px] whitespace-pre-wrap">
              {selectedReview.studentAnswer || "Học viên chưa nộp nội dung bài làm."}
            </div>
          </div>

          <div className="interactive-card p-4 border-l-4 border-purple-400">
            <h4 className="flex items-center gap-2 text-purple-600 font-bold mb-3">
              <Brain size={18} /> AI Feedback / Preview
            </h4>
            <div className="bg-purple-50 p-4 rounded-xl text-sm italic">
              {selectedReview.aiFeedback || "Chưa có nhận xét từ AI."}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <span className="bg-white p-2 rounded shadow-sm border">Grammar Score: {selectedReview.aiGrammar || 0}</span>
              <span className="bg-white p-2 rounded shadow-sm border">Lexical Score: {selectedReview.aiLexical || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Teacher Score & Feedback Form */}
        <div>
          <form onSubmit={handleSubmit} className="interactive-card p-4">
            <h4 className="flex items-center gap-2 text-green-600 font-bold mb-4">
              <FileCheck size={18} /> Nhận xét & Chấm điểm
            </h4>

            {message.text && (
              <div className={`p-3 mb-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Tổng điểm (Overall)</label>
                <input 
                  type="number" step="0.5" min="0" max="10"
                  name="scoreOverall" value={formData.scoreOverall} onChange={handleInputChange}
                  className="form-input" required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Task Response</label>
                <input 
                  type="number" step="0.5" min="0" max="10"
                  name="scoreTask" value={formData.scoreTask} onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Coherence</label>
                <input 
                  type="number" step="0.5" min="0" max="10"
                  name="scoreCoherence" value={formData.scoreCoherence} onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Lexical Resource</label>
                <input 
                  type="number" step="0.5" min="0" max="10"
                  name="scoreLexical" value={formData.scoreLexical} onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Grammar</label>
                <input 
                  type="number" step="0.5" min="0" max="10"
                  name="scoreGrammar" value={formData.scoreGrammar} onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Pronunciation</label>
                <input 
                  type="number" step="0.5" min="0" max="10"
                  name="scorePronunciation" value={formData.scorePronunciation} onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Giáo viên nhận xét</label>
              <textarea 
                name="feedback" value={formData.feedback} onChange={handleInputChange}
                className="form-textarea w-full" rows="5"
                placeholder="Viết nhận xét chi tiết cho học viên ở đây..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="primary-button w-full mt-6 flex justify-center items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : <><Send size={18} /> Gửi nhận xét cho học viên</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
