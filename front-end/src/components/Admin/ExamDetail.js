import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getQuizById,
  importQuizGroups,
} from "../../middleware/admin/quizManagementAPI";
import { uploadAsset } from "../../middleware/teacher/uploadAPI";
import { 
  generateAIQuiz, 
  parseAIQuizResponse, 
  convertAIQuestionsToImportFormat 
} from "../../middleware/teacher/aiQuizAPI";
import { Trash2, Plus, Check, Edit2, FolderPlus, Sparkles, X, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import "./admin-dashboard-styles.scss";

const ExamDetail = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [correctAnswersMap, setCorrectAnswersMap] = useState({});

  const [openGroups, setOpenGroups] = useState({}); // Trạng thái đóng/mở Accordion

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState(null);
  const [newGroupInstruction, setNewGroupInstruction] = useState("");
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [importQuestions, setImportQuestions] = useState([
    { content: "", options: ["", ""], correctIndex: 0, scoreWeight: 1.0 },
  ]);
  const [uploading, setUploading] = useState(false);
  
  // AI Quiz
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSelectedGroupIndex, setAiSelectedGroupIndex] = useState(null);
  
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [showTextAssetModal, setShowTextAssetModal] = useState(false);
  const [textAssetContent, setTextAssetContent] = useState("");
  const [textAssetGroupIndex, setTextAssetGroupIndex] = useState(null);
  const [editingAssetIndex, setEditingAssetIndex] = useState(null);
  const [isEditingAsset, setIsEditingAsset] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionGroupIndex, setEditingQuestionGroupIndex] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showPopup = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getQuizById(quizId);
      setQuiz(data);

      let parsedGroups = [];
      if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
        parsedGroups = data.groups.map(g => ({
          groupOrder: g.groupOrder || 1,
          groupType: g.groupType || 1,
          instruction: g.instruction || "",
          assets: g.assets || [],
          questions: g.questions || []
        }));
      } else if (data.questionGroups && Array.isArray(data.questionGroups) && data.questionGroups.length > 0) {
        parsedGroups = data.questionGroups.map(g => ({
          groupOrder: g.groupOrder || 1,
          groupType: g.groupType || 1,
          instruction: g.instruction || "",
          assets: g.assets || [],
          questions: g.questions || []
        }));
      } else if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        parsedGroups = [{
          groupOrder: 1,
          groupType: 1,
          instruction: "Trả lời các câu hỏi sau",
          assets: [],
          questions: data.questions
        }];
      }

      setGroups(parsedGroups);
      
      // Mặc định mở tất cả các group
      const initialOpenState = {};
      parsedGroups.forEach((_, idx) => initialOpenState[idx] = true);
      setOpenGroups(initialOpenState);

    } catch (err) {
      console.error("❌ Admin fetchQuiz error:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
      const saved = localStorage.getItem(`admin_quiz_${quizId}_answers`);
      if (saved) {
        try {
          setCorrectAnswersMap(JSON.parse(saved));
        } catch (e) {
          console.error("❌ Parse local answers error:", e);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const toggleGroup = (idx) => {
    setOpenGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatGroupsForAPI = (groupsData) => ({
    groups: groupsData.map(g => ({
      groupOrder: g.groupOrder || 1,
      groupType: g.groupType || 1,
      instruction: g.instruction || "",
      assets: (g.assets || []).map(a => ({
        assetType: a.assetType || 0,
        url: a.url || "",
        contentText: a.contentText || "",
        caption: a.caption || "",
        mimeType: a.mimeType || ""
      })),
      questions: (g.questions || []).map((q, i) => ({
        content: q.content || "",
        questionType: q.questionType || 1,
        questionOrder: q.questionOrder || i + 1,
        scoreWeight: q.scoreWeight || 1.0,
        metaJson: q.metaJson || null,
        options: (q.options || []).map(o => ({
          content: o.content || o || "",
          isCorrect: !!o.isCorrect
        })),
        assets: (q.assets || []).map(a => ({
          assetType: a.assetType || 0,
          url: a.url || "",
          contentText: a.contentText || "",
          caption: a.caption || "",
          mimeType: a.mimeType || ""
        }))
      }))
    }))
  });

  const handleGenerateAIQuiz = async () => {
    if (!aiPrompt.trim()) {
      setErrorMessage("Vui lòng nhập prompt cho AI!");
      setShowErrorModal(true);
      return;
    }

    try {
      setAiLoading(true);
      const aiResponse = await generateAIQuiz(aiPrompt);

      if (aiResponse.error) throw new Error(aiResponse.error);

      const parsedQuiz = parseAIQuizResponse(aiResponse);
      if (!parsedQuiz.questions || !parsedQuiz.questions.length) {
        throw new Error("AI không tạo được câu hỏi. Vui lòng thử prompt khác.");
      }

      const convertedQuestions = convertAIQuestionsToImportFormat(parsedQuiz.questions);
      let updatedGroups = [...groups];

      if (!updatedGroups.length) {
        const newQuestions = convertedQuestions.map((q, i) => ({
          questionOrder: i + 1,
          questionType: q.questionType || 1,
          content: q.content,
          scoreWeight: q.scoreWeight,
          metaJson: null,
          options: q.options.map((opt, idx) => ({
            content: opt,
            isCorrect: idx === q.correctIndex,
          })),
          assets: [],
        }));

        const newGroup = {
          groupOrder: 1,
          groupType: 1,
          instruction: parsedQuiz.description || parsedQuiz.title || "AI Generated Group",
          assets: [],
          questions: newQuestions,
        };

        updatedGroups = [newGroup];
        const importPayload = formatGroupsForAPI(updatedGroups);
        await importQuizGroups(quizId, importPayload);

        const newAnswersMap = { ...correctAnswersMap };
        newQuestions.forEach((_, i) => {
          newAnswersMap[`0-${i}`] = convertedQuestions[i].correctIndex;
        });
        setCorrectAnswersMap(newAnswersMap);
        localStorage.setItem(`admin_quiz_${quizId}_answers`, JSON.stringify(newAnswersMap));

        await fetchQuiz();
        setShowAIModal(false);
        setAiPrompt("");
        setAiSelectedGroupIndex(null);
        showPopup(`AI đã tạo ${convertedQuestions.length} câu hỏi!`, "success");
        return;
      }

      if (aiSelectedGroupIndex === null || aiSelectedGroupIndex < 0 || aiSelectedGroupIndex >= updatedGroups.length) {
        throw new Error("Group được chọn không hợp lệ.");
      }

      const targetGroup = updatedGroups[aiSelectedGroupIndex];
      const currentCount = targetGroup.questions?.length || 0;

      const newQuestions = convertedQuestions.map((q, i) => ({
        questionOrder: currentCount + i + 1,
        questionType: q.questionType || 1,
        content: q.content,
        scoreWeight: q.scoreWeight,
        metaJson: null,
        options: q.options.map((opt, idx) => ({
          content: opt,
          isCorrect: idx === q.correctIndex,
        })),
        assets: [],
      }));

      targetGroup.questions = [...(targetGroup.questions || []), ...newQuestions];
      const importData = formatGroupsForAPI(updatedGroups);
      await importQuizGroups(quizId, importData);

      const newAnswersMap = { ...correctAnswersMap };
      convertedQuestions.forEach((q, i) => {
        newAnswersMap[`${aiSelectedGroupIndex}-${currentCount + i}`] = q.correctIndex;
      });
      setCorrectAnswersMap(newAnswersMap);
      localStorage.setItem(`admin_quiz_${quizId}_answers`, JSON.stringify(newAnswersMap));

      await fetchQuiz();
      setShowAIModal(false);
      setAiPrompt("");
      setAiSelectedGroupIndex(null);
      showPopup(`AI đã tạo ${convertedQuestions.length} câu hỏi!`, "success");
    } catch (err) {
      setErrorMessage(err.message || "Lỗi tạo đề bằng AI");
      setShowErrorModal(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!newGroupInstruction.trim()) {
      showPopup("Vui lòng nhập instruction cho Group!", "danger");
      return;
    }
    try {
      setUploading(true);
      const updatedGroups = [...groups];
      if (editingGroupIndex !== null) {
        updatedGroups[editingGroupIndex].instruction = newGroupInstruction.trim();
      } else {
        updatedGroups.push({
          groupOrder: groups.length + 1,
          groupType: 1,
          instruction: newGroupInstruction.trim(),
          assets: [],
          questions: [],
        });
      }
      
      const importPayload = formatGroupsForAPI(updatedGroups);
      await importQuizGroups(quizId, importPayload);
      
      await fetchQuiz();
      setShowGroupModal(false);
      setNewGroupInstruction("");
      setEditingGroupIndex(null);
      showPopup("Đã lưu group!", "success");
    } catch (err) {
      showPopup(err.response?.data?.message || err.message, "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGroup = async (idx) => {
    if (!window.confirm(`Bạn có chắc muốn xóa group ${idx + 1} cùng toàn bộ câu hỏi bên trong?`)) return;
    try {
      setUploading(true);
      const updated = groups.filter((_, i) => i !== idx);
      updated.forEach((g, i) => { g.groupOrder = i + 1; });
      
      const importPayload = formatGroupsForAPI(updated);
      await importQuizGroups(quizId, importPayload);
      
      await fetchQuiz();
      showPopup("Đã xóa Group!", "success");
    } catch (err) {
      showPopup(err.response?.data?.message || err.message, "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleAssetUpload = async (e, assetType, groupIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showPopup("File quá lớn! Tối đa 50MB.", "danger");
      return;
    }

    const typeMap = { 1: "audio", 2: "image", 5: "video" };
    const typeString = typeMap[assetType];
    if (!typeString) {
      showPopup("Loại file không hỗ trợ!", "danger");
      return;
    }

    try {
      setUploadingAsset(true);
      const result = await uploadAsset(file, typeString);
      const updatedGroups = [...groups];
      if (!updatedGroups[groupIndex].assets) updatedGroups[groupIndex].assets = [];
      updatedGroups[groupIndex].assets.push({
        assetType,
        url: result.url,
        caption: file.name,
        mimeType: file.type,
      });
      
      const importPayload = formatGroupsForAPI(updatedGroups);
      await importQuizGroups(quizId, importPayload);
      
      await fetchQuiz();
      showPopup("Upload thành công!", "success");
    } catch (err) {
      showPopup(err.message, "danger");
    } finally {
      setUploadingAsset(false);
      e.target.value = "";
    }
  };

  const handleAddTextAsset = async () => {
    if (!textAssetContent.trim()) {
      showPopup("Vui lòng nhập nội dung!", "danger");
      return;
    }
    try {
      setUploading(true);
      const updatedGroups = [...groups];
      const target = updatedGroups[textAssetGroupIndex];
      if (isEditingAsset && editingAssetIndex !== null) {
        target.assets[editingAssetIndex].contentText = textAssetContent.trim();
      } else {
        if (!target.assets) target.assets = [];
        target.assets.push({ assetType: 3, contentText: textAssetContent.trim() });
      }
      
      const importPayload = formatGroupsForAPI(updatedGroups);
      await importQuizGroups(quizId, importPayload);
      
      await fetchQuiz();
      setShowTextAssetModal(false);
      setTextAssetContent("");
      setTextAssetGroupIndex(null);
      setIsEditingAsset(false);
      setEditingAssetIndex(null);
      showPopup("Lưu Text Asset thành công!", "success");
    } catch (err) {
      showPopup(err.message, "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleEditAsset = (gIdx, aIdx, asset) => {
    if (asset.assetType === 3) {
      setTextAssetContent(asset.contentText || "");
      setTextAssetGroupIndex(gIdx);
      setEditingAssetIndex(aIdx);
      setIsEditingAsset(true);
      setShowTextAssetModal(true);
    } else {
      showPopup("Để sửa file (ảnh/âm thanh), vui lòng xóa và upload lại.", "warning");
    }
  };

  const removeAsset = async (gIdx, aIdx) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa asset này?")) return;
    try {
      setUploading(true);
      const updated = [...groups];
      updated[gIdx].assets.splice(aIdx, 1);
      
      const importPayload = formatGroupsForAPI(updated);
      await importQuizGroups(quizId, importPayload);
      
      await fetchQuiz();
      showPopup("Đã xóa Asset!", "success");
    } catch (err) {
      showPopup(err.message, "danger");
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = () => {
    setImportQuestions((prev) => [
      ...prev,
      { content: "", options: ["", ""], correctIndex: 0, scoreWeight: 1.0 },
    ]);
  };

  const removeQuestion = (i) => {
    setImportQuestions(importQuestions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i, field, val) => {
    const updated = [...importQuestions];
    updated[i][field] = val;
    setImportQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, val) => {
    const updated = [...importQuestions];
    updated[qIdx].options[oIdx] = val;
    setImportQuestions(updated);
  };

  const addOption = (qIdx) => {
    const updated = [...importQuestions];
    updated[qIdx].options.push("");
    setImportQuestions(updated);
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = [...importQuestions];
    if (updated[qIdx].options.length > 2) {
      updated[qIdx].options.splice(oIdx, 1);
      if (updated[qIdx].correctIndex >= updated[qIdx].options.length) {
        updated[qIdx].correctIndex = updated[qIdx].options.length - 1;
      }
      setImportQuestions(updated);
    } else {
      showPopup("Câu hỏi phải có ít nhất 2 đáp án!", "warning");
    }
  };

  const setCorrectAnswer = (qIdx, oIdx) => {
    const updated = [...importQuestions];
    updated[qIdx].correctIndex = oIdx;
    setImportQuestions(updated);
  };

  const handleImport = async () => {
    for (let i = 0; i < importQuestions.length; i++) {
      const q = importQuestions[i];
      if (!q.content.trim()) {
        setErrorMessage(`Câu ${i + 1} chưa có nội dung!`);
        setShowErrorModal(true);
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        setErrorMessage(`Câu ${i + 1} có đáp án trống!`);
        setShowErrorModal(true);
        return;
      }
    }

    try {
      setUploading(true);
      const updated = [...groups];
      const target = updated[selectedGroupIndex];
      const currentCount = target.questions?.length || 0;

      const newQs = importQuestions.map((q, i) => ({
        questionOrder: currentCount + i + 1,
        questionType: 1,
        content: q.content.trim(),
        scoreWeight: q.scoreWeight,
        metaJson: null,
        options: q.options.map((o, oIdx) => ({
          content: o.trim(),
          isCorrect: oIdx === q.correctIndex,
        })),
        assets: [],
      }));

      target.questions = [...(target.questions || []), ...newQs];
      
      const importPayload = formatGroupsForAPI(updated);
      await importQuizGroups(quizId, importPayload);

      const newAnsMap = { ...correctAnswersMap };
      newQs.forEach((_, i) => {
        newAnsMap[`${selectedGroupIndex}-${currentCount + i}`] = importQuestions[i].correctIndex;
      });
      setCorrectAnswersMap(newAnsMap);
      localStorage.setItem(`admin_quiz_${quizId}_answers`, JSON.stringify(newAnsMap));

      await fetchQuiz();
      setShowImportModal(false);
      setImportQuestions([{ content: "", options: ["", ""], correctIndex: 0, scoreWeight: 1.0 }]);
      setSelectedGroupIndex(null);
      showPopup("Thêm câu hỏi thành công!", "success");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleEditQuestion = (gIdx, qIdx, q) => {
    const opts = q.options || q.choices || [];
    const cIdx = opts.findIndex((o) => o.isCorrect || o.correct);
    setEditingQuestion({
      content: q.content || q.questionText || "",
      options: opts.map((o) => o.content || o.text || o.optionText || ""),
      correctIndex: cIdx >= 0 ? cIdx : 0,
      scoreWeight: q.scoreWeight || q.score || 1.0,
    });
    setEditingQuestionGroupIndex(gIdx);
    setEditingQuestionIndex(qIdx);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion.content.trim()) {
      setErrorMessage("Câu hỏi trống!");
      setShowErrorModal(true);
      return;
    }
    if (editingQuestion.options.some((o) => !o.trim())) {
      setErrorMessage("Có đáp án trống!");
      setShowErrorModal(true);
      return;
    }

    try {
      setUploading(true);
      const updated = [...groups];
      const target = updated[editingQuestionGroupIndex];
      target.questions[editingQuestionIndex] = {
        ...target.questions[editingQuestionIndex],
        content: editingQuestion.content,
        scoreWeight: editingQuestion.scoreWeight,
        options: editingQuestion.options.map((o, i) => ({
          content: o,
          isCorrect: i === editingQuestion.correctIndex,
        })),
      };
      
      const importPayload = formatGroupsForAPI(updated);
      await importQuizGroups(quizId, importPayload);

      const newAnsMap = { ...correctAnswersMap };
      newAnsMap[`${editingQuestionGroupIndex}-${editingQuestionIndex}`] = editingQuestion.correctIndex;
      setCorrectAnswersMap(newAnsMap);
      localStorage.setItem(`admin_quiz_${quizId}_answers`, JSON.stringify(newAnsMap));

      await fetchQuiz();
      setShowEditModal(false);
      setEditingQuestion(null);
      setEditingQuestionGroupIndex(null);
      setEditingQuestionIndex(null);
      showPopup("Cập nhật câu hỏi thành công!", "success");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      setUploading(true);
      const { groupIndex, questionIndex } = deleteTarget;
      const updated = [...groups];
      updated[groupIndex].questions.splice(questionIndex, 1);
      updated[groupIndex].questions.forEach((q, i) => {
        q.questionOrder = i + 1;
      });
      
      const importPayload = formatGroupsForAPI(updated);
      await importQuizGroups(quizId, importPayload);

      const newAnsMap = { ...correctAnswersMap };
      delete newAnsMap[`${groupIndex}-${questionIndex}`];
      setCorrectAnswersMap(newAnsMap);
      localStorage.setItem(`admin_quiz_${quizId}_answers`, JSON.stringify(newAnsMap));

      await fetchQuiz();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      showPopup("Đã xóa câu hỏi!", "success");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const renderAsset = (asset, idx) => {
    if (!asset) return null;
    const style = { maxWidth: "100%", marginBottom: "10px", borderRadius: '8px' };
    switch (asset.assetType) {
      case 1: return <audio key={idx} controls src={asset.url} style={{...style, width: '100%'}} />;
      case 2: return <img key={idx} src={asset.url} alt={asset.caption} style={style} />;
      case 3:
        return (
          <div key={idx} style={{ background: 'var(--bg-page)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <p style={{ whiteSpace: "pre-wrap", margin: 0, color: 'var(--text-body)' }}>{asset.contentText}</p>
          </div>
        );
      case 5: return <video key={idx} controls src={asset.url} style={{...style, width: '100%'}} />;
      default: return null;
    }
  };

  const getTotalQuestions = () => groups.reduce((s, g) => s + (g.questions?.length || 0), 0);

  if (loading) {
    return (
      <div className="admin-loading-spinner" style={{ minHeight: '60vh' }}>
        <div className="admin-spinner"></div>
        <p>Đang tải chi tiết bài kiểm tra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <p style={{ color: '#ec4899', fontSize: '1.2rem', fontWeight: 800 }}>{error}</p>
        <button className="secondary-button mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="management-card">
      {/* Toast Notification */}
      {toast.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: toast.type === 'success' ? 'var(--mint)' : '#ec4899', color: '#fff', padding: '12px 24px', borderRadius: '99px', fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}

      {/* HEADER CHI TIẾT */}
      <div className="management-header" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button className="secondary-button mb-3" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 
          <span>Quay lại danh sách</span>
        </button>
          <h2 className="card-title" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
            {quiz?.title || "Chi tiết bài kiểm tra"}
          </h2>
          {quiz?.description && <p className="card-description mt-2">{quiz.description}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span className="status-badge" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>{groups.length} Groups</span>
            <span className="status-badge" style={{ backgroundColor: 'rgba(0,200,150,0.12)', color: 'var(--primary)' }}>{getTotalQuestions()} Câu hỏi</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="secondary-button" onClick={() => { setEditingGroupIndex(null); setNewGroupInstruction(""); setShowGroupModal(true); }}>
            <FolderPlus size={18} /> Thêm Group
          </button>
          <button 
            className="primary-button" 
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)" }}
            onClick={() => { setAiSelectedGroupIndex(groups.length > 0 ? 0 : null); setAiPrompt(""); setShowAIModal(true); }}
          >
            <Sparkles size={18} /> Tạo bằng AI
          </button>
        </div>
      </div>

      {/* DANH SÁCH GROUPS */}
      {groups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="interactive-card" style={{ padding: '1.25rem' }}>
              
              {/* Group Header (Click để đóng mở) */}
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleGroup(gIdx)}
              >
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                    Group {gIdx + 1}: <span style={{ color: 'var(--text-body)', fontWeight: 600 }}>{group.instruction}</span>
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="status-badge" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}>{group.assets?.length || 0} Assets</span>
                  <span className="status-badge" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}>{group.questions?.length || 0} Câu</span>
                  {openGroups[gIdx] ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Nội dung bên trong Group */}
              {openGroups[gIdx] && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1.5px solid var(--border)' }}>
                  {/* Thanh công cụ Group */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button className="secondary-button" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => { setEditingGroupIndex(gIdx); setNewGroupInstruction(group.instruction); setShowGroupModal(true); }}>
                      <Edit2 size={14} /> Sửa Group
                    </button>
                    <button className="secondary-button" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => { setSelectedGroupIndex(gIdx); setImportQuestions([{ content: "", options: ["", ""], correctIndex: 0, scoreWeight: 1.0 }]); setShowImportModal(true); }}>
                      <Plus size={14} /> Thêm câu hỏi
                    </button>
                    <button className="secondary-button" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: '#667eea', borderColor: '#667eea' }} onClick={() => { setAiSelectedGroupIndex(gIdx); setAiPrompt(""); setShowAIModal(true); }}>
                      <Sparkles size={14} /> Dùng AI
                    </button>
                    <button className="action-button" style={{ color: '#ec4899', background: 'rgba(236,72,153,0.1)', marginLeft: 'auto' }} onClick={() => handleDeleteGroup(gIdx)}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Vùng Assets */}
                  <div style={{ background: 'var(--bg-page)', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <strong style={{ color: 'var(--text-dark)' }}>📎 Phương tiện (Assets)</strong>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="action-button" title="Thêm Audio" disabled={uploadingAsset} onClick={() => document.getElementById(`audio-${gIdx}`).click()}><span role="img" aria-label="audio">🎧</span></button>
                        <input id={`audio-${gIdx}`} type="file" accept="audio/*" hidden onChange={(e) => handleAssetUpload(e, 1, gIdx)} />
                        
                        <button className="action-button" title="Thêm Ảnh" disabled={uploadingAsset} onClick={() => document.getElementById(`image-${gIdx}`).click()}><span role="img" aria-label="image">🖼️</span></button>
                        <input id={`image-${gIdx}`} type="file" accept="image/*" hidden onChange={(e) => handleAssetUpload(e, 2, gIdx)} />
                        
                        <button className="action-button" title="Thêm Video" disabled={uploadingAsset} onClick={() => document.getElementById(`video-${gIdx}`).click()}><span role="img" aria-label="video">🎬</span></button>
                        <input id={`video-${gIdx}`} type="file" accept="video/*" hidden onChange={(e) => handleAssetUpload(e, 5, gIdx)} />
                        
                        <button className="action-button" title="Thêm Text" onClick={() => { setTextAssetGroupIndex(gIdx); setTextAssetContent(""); setIsEditingAsset(false); setShowTextAssetModal(true); }}><span role="img" aria-label="text">📝</span></button>
                      </div>
                    </div>

                    {group.assets && group.assets.length > 0 ? (
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        {group.assets.map((a, aIdx) => (
                          <div key={aIdx} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <span className="status-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                                {a.assetType === 1 ? "Audio" : a.assetType === 2 ? "Image" : a.assetType === 3 ? "Text" : "Video"}
                              </span>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="action-button" onClick={() => handleEditAsset(gIdx, aIdx, a)}><Edit2 size={14} /></button>
                                <button className="action-button" style={{ color: '#ec4899' }} onClick={() => removeAsset(gIdx, aIdx)}><Trash2 size={14} /></button>
                              </div>
                            </div>
                            {renderAsset(a, aIdx)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Group này chưa có hình ảnh, âm thanh hay đoạn văn nào.</p>
                    )}
                  </div>

                  {/* Vùng Câu hỏi */}
                  <div>
                    <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1rem' }}>📝 Danh sách câu hỏi</h5>
                    {group.questions && group.questions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {group.questions.map((q, qIdx) => {
                          const opts = q.options || q.choices || [];
                          return (
                            <div key={qIdx} style={{ background: 'var(--bg-page)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem', lineHeight: 1.5 }}>
                                  <span style={{ color: 'var(--primary)', marginRight: '8px' }}>Câu {qIdx + 1}.</span> 
                                  {q.content}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                  <span className="status-badge" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>{q.scoreWeight || 1} đ</span>
                                  <button className="action-button" onClick={() => handleEditQuestion(gIdx, qIdx, q)}><Edit2 size={16} /></button>
                                  <button className="action-button" style={{ color: '#ec4899' }} onClick={() => { setDeleteTarget({ groupIndex: gIdx, questionIndex: qIdx }); setShowDeleteModal(true); }}><Trash2 size={16} /></button>
                                </div>
                              </div>
                              
                              {/* RENDER CÁC LỰA CHỌN VÀ HIGHLIGHT ĐÁP ÁN ĐÚNG */}
                              {opts.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                  {opts.map((opt, oIdx) => {
                                    const isCorrectAPI = opt.isCorrect === true || opt.correct === true;
                                    const isCorrectLocal = correctAnswersMap[`${gIdx}-${qIdx}`] === oIdx;
                                    const isCorrect = isCorrectAPI || isCorrectLocal;
                                    
                                    return (
                                      <div key={oIdx} style={{ 
                                        padding: '0.85rem 1.25rem', 
                                        borderRadius: '12px', 
                                        border: isCorrect ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                                        background: isCorrect ? 'var(--primary-light)' : 'var(--bg-card)',
                                        display: 'flex', 
                                        alignItems: 'center',
                                        boxShadow: isCorrect ? '0 4px 15px rgba(0, 200, 150, 0.15)' : 'none',
                                        transition: 'all 0.2s ease'
                                      }}>
                                        <span style={{ fontWeight: 900, marginRight: '12px', color: isCorrect ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.1rem' }}>
                                          {String.fromCharCode(65 + oIdx)}.
                                        </span>
                                        <span style={{ fontWeight: isCorrect ? 800 : 600, color: isCorrect ? 'var(--primary)' : 'var(--text-body)', fontSize: '1rem' }}>
                                          {opt.content || opt}
                                        </span>
                                        
                                        {/* Huy hiệu ĐÁP ÁN ĐÚNG Nổi bật */}
                                        {isCorrect && (
                                          <div style={{ 
                                            marginLeft: 'auto', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px', 
                                            color: 'var(--primary)', 
                                            fontWeight: 800, 
                                            fontSize: '0.85rem', 
                                            backgroundColor: 'var(--bg-card)', 
                                            padding: '4px 10px', 
                                            borderRadius: '99px', 
                                            border: '1px solid var(--primary)' 
                                          }}>
                                            <Check size={16} strokeWidth={3} /> ĐÁP ÁN ĐÚNG
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>Chưa có câu hỏi nào trong Group này.</p>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-page)', borderRadius: '20px', border: '1.5px dashed var(--border)' }}>
          <FolderPlus size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800 }}>Đề thi này chưa có nội dung</h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Tạo group thủ công hoặc dùng AI để sinh câu hỏi tự động.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="secondary-button" onClick={() => { setEditingGroupIndex(null); setNewGroupInstruction(""); setShowGroupModal(true); }}>
              Tạo Group thủ công
            </button>
            <button className="primary-button" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }} onClick={() => { setAiSelectedGroupIndex(null); setAiPrompt(""); setShowAIModal(true); }}>
              <Sparkles size={18} /> Tạo bằng AI
            </button>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Modal Group */}
      {showGroupModal && (
        <div className="management-modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">{editingGroupIndex !== null ? "Sửa Group" : "Thêm Group"}</h3>
              <button className="action-button" onClick={() => setShowGroupModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body-custom">
              <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Yêu cầu (Instruction)</label>
              <textarea className="form-textarea" rows={3} placeholder="VD: Đọc đoạn văn và chọn đáp án đúng..." value={newGroupInstruction} onChange={(e) => setNewGroupInstruction(e.target.value)} />
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowGroupModal(false)} disabled={uploading}>Hủy</button>
              <button className="primary-button" onClick={handleSaveGroup} disabled={uploading}>
                {uploading ? "Đang lưu..." : editingGroupIndex !== null ? "Lưu thay đổi" : "Tạo Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Text Asset */}
      {showTextAssetModal && (
        <div className="management-modal-overlay" onClick={() => { setShowTextAssetModal(false); setTextAssetContent(""); setTextAssetGroupIndex(null); setIsEditingAsset(false); setEditingAssetIndex(null); }}>
          <div className="management-modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">{isEditingAsset ? "Sửa đoạn văn" : "Thêm đoạn văn (Text)"}</h3>
              <button className="action-button" onClick={() => setShowTextAssetModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body-custom">
              <textarea className="form-textarea" rows={12} placeholder="Dán nội dung đoạn văn bài đọc vào đây..." value={textAssetContent} onChange={(e) => setTextAssetContent(e.target.value)} style={{ fontSize: '1rem', lineHeight: 1.6 }} />
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowTextAssetModal(false)} disabled={uploading}>Hủy</button>
              <button className="primary-button" onClick={handleAddTextAsset} disabled={!textAssetContent.trim() || uploading}>
                {uploading ? "Đang lưu..." : "Lưu đoạn văn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Câu Hỏi (Thủ công) */}
      {showImportModal && (
        <div className="management-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="management-modal-content" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Thêm câu hỏi vào Group {selectedGroupIndex !== null ? selectedGroupIndex + 1 : ""}</h3>
              <button className="action-button" onClick={() => setShowImportModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body-custom" style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
              {importQuestions.map((q, qIdx) => (
                <div key={qIdx} style={{ background: 'var(--bg-page)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h5 style={{ margin: 0, fontWeight: 900, color: 'var(--primary-dark)' }}>Câu hỏi {qIdx + 1}</h5>
                    {importQuestions.length > 1 && (
                      <button className="action-button" style={{ color: '#ec4899' }} onClick={() => removeQuestion(qIdx)}><Trash2 size={16} /></button>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flexGrow: 1 }}>
                      <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Nội dung câu hỏi</label>
                      <textarea className="form-textarea" rows={2} placeholder="Nhập câu hỏi..." value={q.content} onChange={(e) => updateQuestion(qIdx, "content", e.target.value)} />
                    </div>
                    <div style={{ width: '100px' }}>
                      <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Điểm</label>
                      <input type="number" className="form-input" min="1" step="0.5" value={q.scoreWeight} onChange={(e) => updateQuestion(qIdx, "scoreWeight", parseFloat(e.target.value) || 1)} />
                    </div>
                  </div>

                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Các đáp án (Chọn 1 đáp án đúng)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="radio" style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} name={`correct-${qIdx}`} checked={q.correctIndex === oIdx} onChange={() => setCorrectAnswer(qIdx, oIdx)} />
                        <span style={{ fontWeight: 800, color: 'var(--text-dark)', width: '25px', textAlign: 'center' }}>{String.fromCharCode(65 + oIdx)}.</span>
                        <input type="text" className="form-input" style={{ flexGrow: 1 }} placeholder={`Nhập đáp án ${String.fromCharCode(65 + oIdx)}...`} value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} />
                        {q.options.length > 2 && (
                          <button className="action-button" style={{ color: '#ec4899' }} onClick={() => removeOption(qIdx, oIdx)}><Trash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="secondary-button" style={{ marginTop: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => addOption(qIdx)}>
                    <Plus size={14} /> Thêm lựa chọn
                  </button>
                </div>
              ))}
              <button className="secondary-button" style={{ width: '100%', borderStyle: 'dashed', color: 'var(--primary)' }} onClick={addQuestion}>
                <Plus size={18} /> Thêm khối câu hỏi mới
              </button>
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowImportModal(false)} disabled={uploading}>Hủy</button>
              <button className="primary-button" onClick={handleImport} disabled={uploading}>
                {uploading ? "Đang lưu..." : `Lưu ${importQuestions.length} câu`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa Câu Hỏi */}
      {showEditModal && editingQuestion && (
        <div className="management-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="management-modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Sửa câu hỏi</h3>
              <button className="action-button" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body-custom">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flexGrow: 1 }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Nội dung câu hỏi</label>
                  <textarea className="form-textarea" rows={2} value={editingQuestion.content} onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })} />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Điểm</label>
                  <input type="number" className="form-input" min="1" step="0.5" value={editingQuestion.scoreWeight} onChange={(e) => setEditingQuestion({ ...editingQuestion, scoreWeight: parseFloat(e.target.value) || 1 })} />
                </div>
              </div>
              <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Các đáp án (Chọn 1 đáp án đúng)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {editingQuestion.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="radio" style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} name="correct-edit" checked={editingQuestion.correctIndex === oIdx} onChange={() => setEditingQuestion({ ...editingQuestion, correctIndex: oIdx })} />
                    <span style={{ fontWeight: 800, color: 'var(--text-dark)', width: '25px', textAlign: 'center' }}>{String.fromCharCode(65 + oIdx)}.</span>
                    <input type="text" className="form-input" style={{ flexGrow: 1 }} value={opt} onChange={(e) => { const newOpts = [...editingQuestion.options]; newOpts[oIdx] = e.target.value; setEditingQuestion({ ...editingQuestion, options: newOpts }); }} />
                    {editingQuestion.options.length > 2 && (
                      <button className="action-button" style={{ color: '#ec4899' }} onClick={() => { if (editingQuestion.options.length > 2) { const newOpts = editingQuestion.options.filter((_, i) => i !== oIdx); const newCIdx = editingQuestion.correctIndex >= newOpts.length ? newOpts.length - 1 : editingQuestion.correctIndex; setEditingQuestion({ ...editingQuestion, options: newOpts, correctIndex: newCIdx }); } }}><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button className="secondary-button" style={{ marginTop: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setEditingQuestion({ ...editingQuestion, options: [...editingQuestion.options, ""] })}>
                <Plus size={14} /> Thêm lựa chọn
              </button>
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowEditModal(false)} disabled={uploading}>Hủy</button>
              <button className="primary-button" onClick={handleSaveEdit} disabled={uploading}>
                {uploading ? "Đang lưu..." : "Cập nhật câu hỏi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sinh Đề Bằng AI */}
      {showAIModal && (
        <div className="management-modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="management-modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#667eea' }}>
                <Sparkles size={24} /> Tạo câu hỏi bằng AI
              </h3>
              <button className="action-button" onClick={() => setShowAIModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body-custom">
              <div style={{ background: 'rgba(102, 126, 234, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.2)', marginBottom: '1.5rem', color: '#4c51bf', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <strong>💡 Hướng dẫn:</strong> Mô tả chi tiết nội dung bạn muốn tạo (chủ đề, độ khó, số lượng câu).<br/>
                <em>Ví dụ: "Create 5 multiple choice questions about Present Perfect for beginners."</em>
              </div>

              {groups.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Thêm vào Group</label>
                  <select className="form-select" value={aiSelectedGroupIndex !== null ? aiSelectedGroupIndex : 0} onChange={(e) => setAiSelectedGroupIndex(parseInt(e.target.value))}>
                    {groups.map((g, i) => (
                      <option key={i} value={i}>Group {i + 1}: {g.instruction}</option>
                    ))}
                  </select>
                </div>
              )}

              <label style={{ display: 'block', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Yêu cầu (Prompt)</label>
              <textarea className="form-textarea" rows={5} placeholder="Nhập yêu cầu tạo đề tiếng Anh bằng AI..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={aiLoading} />

              {aiLoading && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', color: '#d97706', display: 'flex', gap: '0.75rem', fontWeight: 700 }}>
                  <div className="admin-spinner" style={{ width: '20px', height: '20px', borderTopColor: '#d97706' }}></div>
                  AI đang xử lý... Việc này có thể mất từ 30-60 giây.
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowAIModal(false)} disabled={aiLoading}>Đóng</button>
              <button className="primary-button" onClick={handleGenerateAIQuiz} disabled={!aiPrompt.trim() || aiLoading} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}>
                {aiLoading ? "Đang xử lý..." : "Tạo bằng AI"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lỗi */}
      {showErrorModal && (
        <div className="management-modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: '#ec4899' }}>❌ Thông báo Lỗi</h3>
              <button className="action-button" onClick={() => setShowErrorModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body-custom">
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-dark)' }}>{errorMessage}</p>
            </div>
            <div className="modal-foot">
              <button className="secondary-button" onClick={() => setShowErrorModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {showDeleteModal && (
        <div className="management-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="management-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: '#ec4899' }}>⚠️ Xác nhận xóa</h3>
              <button className="action-button" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body-custom">
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-dark)' }}>Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-foot">
              <button className="secondary-button" style={{ marginRight: '1rem' }} onClick={() => setShowDeleteModal(false)} disabled={uploading}>Hủy</button>
              <button className="primary-button" style={{ background: '#ec4899' }} onClick={handleDeleteQuestion} disabled={uploading}>
                {uploading ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamDetail;