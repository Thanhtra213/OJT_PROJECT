import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Form,
  ListGroup,
  Modal,
  Badge,
  Row,
  Col,
  Accordion,
  Toast,
  ToastContainer,
  Nav,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import {
  getQuizById,
  updateQuizGroup,
  deleteAsset,
  createGroupAsset,
  deleteQuizGroup as deleteGroupAPI,
} from "../../middleware/teacher/quizTeacherAPI";

import {
  createGroupWithQuestions,
  addQuestionsToGroup,
  updateQuestionWithOptions,
  deleteQuestionCompletely,
} from "../../middleware/teacher/quizHelper";
import { getQuizById as getUserQuizById } from "../../middleware/QuizAPI";
import { uploadAsset } from "../../middleware/teacher/uploadAPI";
import {
  generateAIQuiz,
  parseAIQuizResponse,
  convertAIQuestionsToImportFormat,
} from "../../middleware/teacher/aiQuizAPI";
import {
  Trash2,
  Plus,
  Check,
  Edit2,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faPenNib } from "@fortawesome/free-solid-svg-icons";
import "./QuizDetail.scss";

const QuizDetail = () => {
  const { quizId, groupType } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [correctAnswersMap, setCorrectAnswersMap] = useState({});

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState(null);
  const [newGroupInstruction, setNewGroupInstruction] = useState("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [importQuestions, setImportQuestions] = useState([
    { content: "", options: ["", ""], correctIndex: 0, scoreWeight: 1.0, type: 1 },
  ]);
  const [uploading, setUploading] = useState(false);

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

  const [toasts, setToasts] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    onConfirm: null,
    variant: "danger",
  });

  const addToast = (message, variant = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const showConfirm = (title, message, onConfirm, variant = "danger") => {
    setConfirmConfig({ title, message, onConfirm, variant });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmConfig.onConfirm) {
      confirmConfig.onConfirm();
    }
    setShowConfirmModal(false);
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError("");

      let data;
      try {
        data = await getQuizById(quizId);
        console.log("✅ Teacher API response:", data);
      } catch (err) {
        console.log("⚠️ Teacher API failed, trying User API...");
        try {
          data = await getUserQuizById(quizId);
          console.log("✅ User API response:", data);
        } catch (err2) {
          throw err;
        }
      }

      setQuiz(data);

      let parsedGroups = [];

      if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
        parsedGroups = data.groups.map((group) => ({
          groupID: group.groupID || group.groupId,
          groupOrder: group.groupOrder || 1,
          groupType: group.groupType || 1,
          instruction: group.instruction || "",
          assets: group.assets || [],
          questions: group.questions || [],
        }));
        console.log("✅ Parsed from data.groups");
      } else if (
        data.questionGroups &&
        Array.isArray(data.questionGroups) &&
        data.questionGroups.length > 0
      ) {
        parsedGroups = data.questionGroups.map((group) => ({
          groupID: group.groupID || group.groupId,
          groupOrder: group.groupOrder || 1,
          groupType: group.groupType || 1,
          instruction: group.instruction || "",
          assets: group.assets || [],
          questions: group.questions || [],
        }));
        console.log("✅ Parsed from data.questionGroups");
      } else if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        parsedGroups = [
          {
            groupID: null,
            groupOrder: 1,
            groupType: 1,
            instruction: "Trả lời các câu hỏi sau",
            assets: [],
            questions: data.questions,
          },
        ];
        console.log("✅ Created virtual group from data.questions");
      }

      console.log("✅ Final parsed groups:", parsedGroups);
      setGroups(parsedGroups);
    } catch (err) {
      console.error("❌ Error loading quiz:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
      const saved = localStorage.getItem(`quiz_${quizId}_answers`);
      if (saved) {
        try {
          setCorrectAnswersMap(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved answers:", e);
        }
      }
    }
  }, [quizId]);

  const handleGenerateAIQuiz = async () => {
    if (!aiPrompt.trim()) {
      setErrorMessage("❌ Vui lòng nhập prompt cho AI!");
      setShowErrorModal(true);
      return;
    }

    try {
      setAiLoading(true);
      console.log("🤖 Calling AI with prompt:", aiPrompt);
      const aiResponse = await generateAIQuiz(aiPrompt);

      if (aiResponse.error) throw new Error(aiResponse.error);

      const parsedQuiz = parseAIQuizResponse(aiResponse);
      console.log("📦 Parsed AI quiz:", parsedQuiz);

      if (!parsedQuiz.questions?.length) {
        throw new Error("AI không tạo được câu hỏi. Vui lòng thử prompt khác.");
      }

      const convertedQuestions = convertAIQuestionsToImportFormat(parsedQuiz.questions);
      console.log("🧩 Converted questions:", convertedQuestions);

      if (groups.length === 0) {
        console.log("⚙️ No groups, creating new group...");

        const questionsToAdd = convertedQuestions.map((q, i) => ({
          content: q.content,
          questionType: q.questionType || 1,
          questionOrder: i + 1,
          scoreWeight: q.scoreWeight,
          metaJson: q.questionType === 2 
            ? JSON.stringify({ answer: q.options[q.correctIndex] || q.options[0] }) 
            : null,
          options: q.options.map((opt, idx) => ({
            content: opt,
            isCorrect: idx === q.correctIndex,
          })),
          assets: [],
        }));

        await createGroupWithQuestions(quizId, {
          instruction: parsedQuiz.description || parsedQuiz.title || "AI Generated Group",
          groupType: 1,
          groupOrder: 1,
          questions: questionsToAdd,
          assets: [],
        });

        const newAnswersMap = {};
        convertedQuestions.forEach((q, i) => {
          newAnswersMap[`0-${i}`] = q.correctIndex;
        });
        setCorrectAnswersMap(newAnswersMap);
        localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswersMap));

        await fetchQuiz();
        setShowAIModal(false);
        setAiPrompt("");
        setAiSelectedGroupIndex(null);
        addToast(`AI đã tạo ${convertedQuestions.length} câu hỏi trong Group 1!`, "success");
        return;
      }

      if (
        aiSelectedGroupIndex === null ||
        aiSelectedGroupIndex < 0 ||
        aiSelectedGroupIndex >= groups.length
      ) {
        throw new Error("Vui lòng chọn group hợp lệ!");
      }

      const group = groups[aiSelectedGroupIndex];
      if (!group.groupID) {
        throw new Error("Group ID not found");
      }

      const currentCount = group.questions?.length || 0;

      const questionsToAdd = convertedQuestions.map((q, i) => ({
        content: q.content,
        questionType: q.questionType || 1,
        questionOrder: currentCount + i + 1,
        scoreWeight: q.scoreWeight,
        metaJson: q.questionType === 2 
          ? JSON.stringify({ answer: q.options[q.correctIndex] || q.options[0] }) 
          : null,
        options: q.options.map((opt, idx) => ({
          content: opt,
          isCorrect: idx === q.correctIndex,
        })),
        assets: [],
      }));

      await addQuestionsToGroup(group.groupID, questionsToAdd);

      const newAnswersMap = { ...correctAnswersMap };
      convertedQuestions.forEach((q, i) => {
        newAnswersMap[`${aiSelectedGroupIndex}-${currentCount + i}`] = q.correctIndex;
      });
      setCorrectAnswersMap(newAnswersMap);
      localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswersMap));

      await fetchQuiz();
      setShowAIModal(false);
      setAiPrompt("");
      setAiSelectedGroupIndex(null);
      addToast(`AI đã tạo ${convertedQuestions.length} câu hỏi!`, "success");
    } catch (err) {
      console.error("❌ AI error:", err);
      setErrorMessage("❌ " + err.message);
      setShowErrorModal(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!newGroupInstruction.trim()) {
      addToast("❌ Vui lòng nhập instruction cho group!", "danger");
      return;
    }

    try {
      setUploading(true);

      if (editingGroupIndex !== null) {
        const group = groups[editingGroupIndex];

        if (!group.groupID) {
          throw new Error("Group ID not found");
        }

        await updateQuizGroup(group.groupID, {
          instruction: newGroupInstruction.trim(),
          groupType: group.groupType || 1,
          groupOrder: group.groupOrder || editingGroupIndex + 1,
        });

        addToast("Đã cập nhật group!", "success");
      } else {
        await createGroupWithQuestions(quizId, {
          instruction: newGroupInstruction.trim(),
          groupType: 1,
          groupOrder: groups.length + 1,
          questions: [],
          assets: [],
        });

        addToast("Đã thêm group mới!", "success");
      }

      await fetchQuiz();
      setShowGroupModal(false);
      setNewGroupInstruction("");
      setEditingGroupIndex(null);
    } catch (err) {
      console.error("❌ Save group error:", err);
      addToast("❌ Lỗi: " + (err.response?.data?.message || err.message), "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGroup = async (groupIndex) => {
    const group = groups[groupIndex];

    if (!group.groupID) {
      addToast("❌ Group ID không hợp lệ!", "danger");
      return;
    }

    showConfirm(
      "⚠️ Xác nhận xóa Group",
      `Xóa group ${groupIndex + 1}? Tất cả câu hỏi và assets trong group này sẽ bị xóa!`,
      async () => {
        try {
          setUploading(true);
          await deleteGroupAPI(group.groupID);
          await fetchQuiz();
          addToast("Đã xóa group!", "success");
        } catch (err) {
          console.error("❌ Delete group error:", err);
          addToast("❌ Lỗi xóa group: " + (err.response?.data?.message || err.message), "danger");
        } finally {
          setUploading(false);
        }
      }
    );
  };

  const handleAssetUpload = async (e, assetType, groupIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      addToast("❌ File quá lớn! Giới hạn 50MB", "danger");
      return;
    }

    let typeString;
    if (assetType === 1) typeString = "audio";
    else if (assetType === 2) typeString = "image";
    else if (assetType === 5) typeString = "video";
    else {
      addToast("❌ Loại asset không hỗ trợ!", "danger");
      return;
    }

    try {
      setUploadingAsset(true);

      const result = await uploadAsset(file, typeString, quizId, groupType);
      console.log("Upload success:", result);

      const group = groups[groupIndex];
      if (!group.groupID) {
        throw new Error("Group ID not found");
      }

      await createGroupAsset(group.groupID, {
        assetType,
        url: result.url,
        caption: file.name,
        mimeType: file.type,
        contentText: "",
      });

      await fetchQuiz();
      addToast("Upload thành công!", "success");
    } catch (err) {
      console.error("❌ Upload error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Lỗi không xác định";
      addToast(`❌ Lỗi upload: ${errorMsg}`, "danger");
    } finally {
      setUploadingAsset(false);
      e.target.value = "";
    }
  };

  const handleAddTextAsset = async () => {
    if (!textAssetContent.trim()) {
      addToast("❌ Vui lòng nhập nội dung text!", "danger");
      return;
    }

    try {
      setUploading(true);
      const group = groups[textAssetGroupIndex];

      if (!group.groupID) {
        throw new Error("Group ID not found");
      }

      if (isEditingAsset && editingAssetIndex !== null) {
        const oldAsset = group.assets[editingAssetIndex];
        if (oldAsset.assetID) {
          await deleteAsset(oldAsset.assetID);
        }
      }

      await createGroupAsset(group.groupID, {
        assetType: 3,
        url: "",
        contentText: textAssetContent.trim(),
        caption: "",
        mimeType: "",
      });

      await fetchQuiz();
      setShowTextAssetModal(false);
      setTextAssetContent("");
      setTextAssetGroupIndex(null);
      setIsEditingAsset(false);
      setEditingAssetIndex(null);
      addToast(isEditingAsset ? "Đã cập nhật text asset!" : "Đã thêm text asset!", "success");
    } catch (err) {
      console.error("❌ Text asset error:", err);
      addToast("❌ Lỗi: " + (err.response?.data?.message || err.message), "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleEditAsset = (groupIndex, assetIndex, asset) => {
    if (asset.assetType === 3) {
      setTextAssetContent(asset.contentText || "");
      setTextAssetGroupIndex(groupIndex);
      setEditingAssetIndex(assetIndex);
      setIsEditingAsset(true);
      setShowTextAssetModal(true);
    } else {
      addToast(
        "⚠️ Để sửa file (audio/image/video), vui lòng xóa và upload lại file mới.",
        "warning"
      );
    }
  };

  const removeAsset = async (groupIndex, assetIndex) => {
    const group = groups[groupIndex];
    const asset = group.assets[assetIndex];

    if (!asset.assetID) {
      addToast("❌ Asset ID không hợp lệ!", "danger");
      return;
    }

    showConfirm(
      "⚠️ Xác nhận xóa Asset",
      "Bạn có chắc chắn muốn xóa asset này?",
      async () => {
        try {
          setUploading(true);
          await deleteAsset(asset.assetID);
          await fetchQuiz();
          addToast("Đã xóa asset", "success");
        } catch (err) {
          console.error("❌ Delete asset error:", err);
          addToast("❌ Lỗi xóa asset: " + (err.response?.data?.message || err.message), "danger");
        } finally {
          setUploading(false);
        }
      }
    );
  };

  const addQuestion = () => {
    setImportQuestions((prev) => [
      ...prev,
      {
        content: "",
        options: ["", ""],
        correctIndex: 0,
        scoreWeight: 1.0,
        type: 1,
      },
    ]);
  };

  const removeQuestion = (index) => {
    setImportQuestions(importQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...importQuestions];
    updated[index][field] = value;
    
    // Đồng bộ: Nếu là tự luận, thu gọn options về 1
    if (field === "type" && value === 2) {
      const currentAns = updated[index].options[0] || "";
      updated[index].options = [currentAns];
      updated[index].correctIndex = 0;
    }
    
    setImportQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...importQuestions];
    updated[qIndex].options[optIndex] = value;
    setImportQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...importQuestions];
    updated[qIndex].options.push("");
    setImportQuestions(updated);
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...importQuestions];
    if (updated[qIndex].options.length > 2) {
      updated[qIndex].options.splice(optIndex, 1);
      if (updated[qIndex].correctIndex >= updated[qIndex].options.length) {
        updated[qIndex].correctIndex = updated[qIndex].options.length - 1;
      }
      setImportQuestions(updated);
    } else {
      addToast("Phải có ít nhất 2 đáp án!", "warning");
    }
  };

  const setCorrectAnswer = (qIndex, optIndex) => {
    const updated = [...importQuestions];
    updated[qIndex].correctIndex = optIndex;
    setImportQuestions(updated);
  };

  const handleImport = async () => {
    for (let i = 0; i < importQuestions.length; i++) {
      const q = importQuestions[i];
      if (!q.content.trim()) {
        setErrorMessage(`Câu hỏi ${i + 1} chưa có nội dung!`);
        setShowErrorModal(true);
        return;
      }
      if (q.type === 1) {
          if (q.options.some((opt) => !opt.trim())) {
            setErrorMessage(`Câu hỏi ${i + 1} có đáp án trống!`);
            setShowErrorModal(true);
            return;
          }
      } else if (q.type === 2) {
          if (!q.options[0] || !q.options[0].trim()) {
            setErrorMessage(`Câu hỏi ${i + 1} chưa có đáp án đúng!`);
            setShowErrorModal(true);
            return;
          }
      } else {
          if (!q.options[0]?.trim()) {
            setErrorMessage(`Câu hỏi ${i + 1} chưa có đáp án đúng!`);
            setShowErrorModal(true);
            return;
          }
      }
    }

    try {
      setUploading(true);
      const group = groups[selectedGroupIndex];

      const currentQuestionCount = group.questions?.length || 0;

      const questionsToAdd = importQuestions.map((q, index) => ({
        content: q.content.trim(),
        questionType: q.type || 1,
        questionOrder: currentQuestionCount + index + 1,
        scoreWeight: q.scoreWeight || 1.0,
        metaJson: (q.type || 1) === 2 
          ? JSON.stringify({ answer: q.options[0].trim() }) 
          : null,
        options: q.type === 1 
          ? q.options.map((opt, optIndex) => ({
              content: opt.trim(),
              isCorrect: optIndex === q.correctIndex,
            }))
          : [{ content: q.options[0].trim(), isCorrect: true }],
        assets: [],
      }));

      if (!group.groupID) {
        // Nếu là virtual group (chưa có group thực sự trong DB), tạo group mới kèm câu hỏi
        await createGroupWithQuestions(quizId, {
            instruction: group.instruction || "Trả lời các câu hỏi sau",
            groupType: 1,
            groupOrder: group.groupOrder || 1,
            questions: questionsToAdd,
            assets: [],
          });
      } else {
        await addQuestionsToGroup(group.groupID, questionsToAdd);
      }

      const newAnswersMap = { ...correctAnswersMap };
      questionsToAdd.forEach((q, idx) => {
        const key = `${selectedGroupIndex}-${currentQuestionCount + idx}`;
        newAnswersMap[key] = importQuestions[idx].correctIndex;
      });
      setCorrectAnswersMap(newAnswersMap);
      localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswersMap));

      await fetchQuiz();
      setShowImportModal(false);
      setImportQuestions([{ content: "", options: ["", ""], correctIndex: 0, scoreWeight: 1.0 }]);
      setSelectedGroupIndex(null);
      addToast("Thêm câu hỏi thành công!", "success");
    } catch (err) {
      console.error("❌ Import error:", err);
      setErrorMessage("❌ Lỗi thêm câu hỏi: " + (err.response?.data?.message || err.message));
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleEditQuestion = (groupIndex, questionIndex, question) => {
    const qOptions = question.options || question.choices || [];
    const correctIndex = qOptions.findIndex((opt) => opt.isCorrect || opt.correct || opt.IsCorrect || opt.Correct || opt.IsCorrect === "true");

    setEditingQuestion({
      content: question.content || question.questionText || "",
      options: qOptions.length > 0 ? qOptions.map((opt) => opt.content || opt.text || opt.optionText || "") : (question.questionType === 2 ? [""] : ["", ""]),
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      scoreWeight: question.scoreWeight || question.score || 1.0,
      type: question.questionType || 1,
    });
    setEditingQuestionGroupIndex(groupIndex);
    setEditingQuestionIndex(questionIndex);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion.content.trim()) {
      setErrorMessage("Câu hỏi chưa có nội dung!");
      setShowErrorModal(true);
      return;
    }
    if (editingQuestion.type === 1) {
        if (editingQuestion.options.some((opt) => !opt.trim())) {
            setErrorMessage("Có đáp án trống!");
            setShowErrorModal(true);
            return;
        }
    } else {
        if (!editingQuestion.options[0]?.trim()) {
            setErrorMessage("Vui lòng nhập đáp án đúng!");
            setShowErrorModal(true);
            return;
        }
    }

    try {
      setUploading(true);
      const group = groups[editingQuestionGroupIndex];
      const question = group.questions[editingQuestionIndex];

      if (!question.questionID) {
        throw new Error("Question ID not found");
      }

      const formattedOptions = editingQuestion.type === 1 
        ? editingQuestion.options.map((opt, optIndex) => ({
            optionID: question.options?.[optIndex]?.optionID || null,
            content: opt,
            isCorrect: optIndex === editingQuestion.correctIndex,
          }))
        : [{
            optionID: question.options?.[0]?.optionID || null,
            content: editingQuestion.options[0],
            isCorrect: true,
          }];

      await updateQuestionWithOptions(
        question.questionID,
        {
          content: editingQuestion.content,
          questionType: editingQuestion.type,
          questionOrder: question.questionOrder,
          scoreWeight: editingQuestion.scoreWeight,
          metaJson: editingQuestion.type === 2 
            ? JSON.stringify({ answer: editingQuestion.options[0].trim() }) 
            : null,
          options: formattedOptions,
        },
        question.options || []
      );

      const newAnswersMap = { ...correctAnswersMap };
      const key = `${editingQuestionGroupIndex}-${editingQuestionIndex}`;
      newAnswersMap[key] = editingQuestion.correctIndex;
      setCorrectAnswersMap(newAnswersMap);
      localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswersMap));

      await fetchQuiz();
      setShowEditModal(false);
      setEditingQuestion(null);
      setEditingQuestionGroupIndex(null);
      setEditingQuestionIndex(null);
      addToast("Cập nhật câu hỏi thành công!", "success");
    } catch (err) {
      console.error("❌ Edit error:", err);
      setErrorMessage("❌ Lỗi cập nhật: " + (err.response?.data?.message || err.message));
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      setUploading(true);
      const { groupIndex, questionIndex } = deleteTarget;
      const group = groups[groupIndex];
      const question = group.questions[questionIndex];

      if (!question.questionID) {
        throw new Error("Question ID not found");
      }

      await deleteQuestionCompletely(question.questionID, question);

      const newAnswersMap = { ...correctAnswersMap };
      delete newAnswersMap[`${groupIndex}-${questionIndex}`];
      setCorrectAnswersMap(newAnswersMap);
      localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswersMap));

      await fetchQuiz();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      addToast("Xóa câu hỏi thành công!", "success");
    } catch (err) {
      console.error("❌ Delete error:", err);
      setErrorMessage("❌ Lỗi xóa: " + (err.response?.data?.message || err.message));
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const renderAsset = (asset, idx) => {
    if (!asset) return null;

    const style = { maxWidth: "100%", marginBottom: "10px" };

    switch (asset.assetType) {
      case 1:
        return <audio key={idx} controls src={asset.url} style={style} className="w-100" />;
      case 2:
        return (
          <img
            key={idx}
            src={asset.url}
            alt={asset.caption || "Image"}
            style={style}
            className="img-fluid"
          />
        );
      case 3:
        return (
          <div key={idx} className="quiz-text-asset-preview p-3">
            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
              {asset.contentText}
            </p>
          </div>
        );
      case 5:
        return <video key={idx} controls src={asset.url} style={style} className="w-100" />;
      default:
        return null;
    }
  };

  const getTotalQuestions = () => {
    return groups.reduce((sum, g) => sum + (g.questions?.length || 0), 0);
  };

  if (loading) {
    return (
      <Container className="quiz-detail-page py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Đang tải quiz...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="quiz-detail-page py-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="link" onClick={() => navigate("/teacher/dashboard")}>
          ← Quay lại Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container className="quiz-detail-page py-4">
      <div className="quiz-detail-header">
        <div>
          <Button
            variant="link"
            onClick={() => navigate("/teacher/dashboard")}
            className="btn-link"
          >
            ← Quay lại Dashboard
          </Button>

          <h3 className="text-primary mb-0">{quiz?.title || "Quiz Detail"}</h3>

          {quiz?.description && <p className="text-muted mt-2">{quiz.description}</p>}

          <div className="quiz-header-meta">
            <Badge bg="info">{groups.length} groups</Badge>
            <Badge bg="secondary">{getTotalQuestions()} câu hỏi</Badge>
          </div>
        </div>

        <div className="quiz-header-actions">
          <Button
            variant="success"
            onClick={() => {
              setEditingGroupIndex(null);
              setNewGroupInstruction("");
              setShowGroupModal(true);
            }}
          >
            <FolderPlus size={18} className="me-2" />
            Thêm Group
          </Button>

          <Button
            variant="primary"
            className="quiz-ai-btn"
            onClick={() => {
              if (groups.length === 0) {
                setAiSelectedGroupIndex(null);
              } else {
                setAiSelectedGroupIndex(0);
              }
              setAiPrompt("");
              setShowAIModal(true);
            }}
          >
            <Sparkles size={18} className="me-2" />
            Tạo đề bằng AI
          </Button>
        </div>
      </div>

      {groups.length > 0 ? (
        <Accordion defaultActiveKey="0">
          {groups.map((group, groupIdx) => (
            <Accordion.Item eventKey={groupIdx.toString()} key={groupIdx}>
              <Accordion.Header>
                <div className="quiz-group-summary">
                  <div className="quiz-group-summary-left">
                    <strong>Group {groupIdx + 1}:</strong> {group.instruction}
                  </div>
                  <div className="quiz-group-summary-right">
                    <Badge bg="info">{group.assets?.length || 0} assets</Badge>
                    <Badge bg="secondary">{group.questions?.length || 0} câu hỏi</Badge>
                  </div>
                </div>
              </Accordion.Header>

              <Accordion.Body>
                <div className="quiz-group-actions">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setEditingGroupIndex(groupIdx);
                      setNewGroupInstruction(group.instruction);
                      setShowGroupModal(true);
                    }}
                  >
                    <Edit2 size={14} className="me-1" />
                    Sửa
                  </Button>

                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => {
                      setSelectedGroupIndex(groupIdx);
                      setImportQuestions([
                        { content: "", options: ["", ""], correctIndex: 0, scoreWeight: 1.0 },
                      ]);
                      setShowImportModal(true);
                    }}
                  >
                    <Plus size={14} className="me-1" />
                    Thêm câu hỏi
                  </Button>

                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => {
                      setAiSelectedGroupIndex(groupIdx);
                      setAiPrompt("");
                      setShowAIModal(true);
                    }}
                  >
                    <Sparkles size={14} className="me-1" />
                    AI
                  </Button>

                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteGroup(groupIdx)}
                  >
                    <Trash2 size={14} className="me-1" />
                    Xóa
                  </Button>
                </div>

                <Card className="quiz-assets-card mb-3 border-primary">
                  <Card.Header>
                    <div className="quiz-assets-header">
                      <strong>📎 Assets</strong>

                      <div className="quiz-assets-actions">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={uploadingAsset}
                          onClick={() => document.getElementById(`audio-${groupIdx}`).click()}
                        >
                          Audio
                        </Button>
                        <input
                          id={`audio-${groupIdx}`}
                          type="file"
                          accept="audio/*"
                          hidden
                          onChange={(e) => handleAssetUpload(e, 1, groupIdx)}
                        />

                        <Button
                          variant="outline-success"
                          size="sm"
                          disabled={uploadingAsset}
                          onClick={() => document.getElementById(`image-${groupIdx}`).click()}
                        >
                          Image
                        </Button>
                        <input
                          id={`image-${groupIdx}`}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => handleAssetUpload(e, 2, groupIdx)}
                        />

                        <Button
                          variant="outline-info"
                          size="sm"
                          disabled={uploadingAsset}
                          onClick={() => document.getElementById(`video-${groupIdx}`).click()}
                        >
                          Video
                        </Button>
                        <input
                          id={`video-${groupIdx}`}
                          type="file"
                          accept="video/*"
                          hidden
                          onChange={(e) => handleAssetUpload(e, 5, groupIdx)}
                        />

                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setTextAssetGroupIndex(groupIdx);
                            setTextAssetContent("");
                            setIsEditingAsset(false);
                            setShowTextAssetModal(true);
                          }}
                        >
                          Text
                        </Button>
                      </div>
                    </div>
                  </Card.Header>

                  <Card.Body>
                    {group.assets && group.assets.length > 0 ? (
                      group.assets.map((asset, assetIdx) => (
                        <Card key={assetIdx} className="quiz-asset-item mb-3">
                          <Card.Body>
                            <div className="quiz-asset-top">
                              <Badge bg="info" style={{ fontSize: "0.9rem" }}>
                                {asset.assetType === 1
                                  ? "Audio"
                                  : asset.assetType === 2
                                  ? "Image"
                                  : asset.assetType === 3
                                  ? "Text"
                                  : "Video"}
                              </Badge>

                              <div className="quiz-asset-actions">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditAsset(groupIdx, assetIdx, asset)}
                                >
                                  <Edit2 size={14} className="me-1" />
                                  Sửa
                                </Button>

                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeAsset(groupIdx, assetIdx)}
                                >
                                  <Trash2 size={14} className="me-1" />
                                  Xóa
                                </Button>
                              </div>
                            </div>

                            {renderAsset(asset, assetIdx)}

                            {asset.caption && asset.assetType !== 3 && (
                              <small className="text-muted d-block mt-2">📄 {asset.caption}</small>
                            )}
                          </Card.Body>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted text-center mb-0">Chưa có assets</p>
                    )}
                  </Card.Body>
                </Card>

                <h6 className="mb-3">Câu hỏi</h6>

                {group.questions && group.questions.length > 0 ? (
                  group.questions.map((question, qIdx) => {
                    const qOptions = question.options || question.choices || [];

                    return (
                      <Card key={qIdx} className="quiz-question-card mb-3">
                        <Card.Body>
                          <div className="quiz-question-actions">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditQuestion(groupIdx, qIdx, question)}
                            >
                              <Edit2 size={14} className="me-1" />
                              Sửa
                            </Button>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget({
                                  groupIndex: groupIdx,
                                  questionIndex: qIdx,
                                });
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 size={14} className="me-1" />
                              Xóa
                            </Button>
                          </div>

                          <div className="quiz-question-header">
                            <h6 className="mb-1">
                              <Badge bg="primary" className="me-2">
                                Câu {qIdx + 1}
                              </Badge>
                              {question.content}
                            </h6>

                            <Badge bg="info">Điểm: {question.scoreWeight || 1}</Badge>
                          </div>

                          {/* Hiển thị đáp án dựa trên Question Type */}
                          {(question.questionType === 2 || question.type === 2) ? (
                            <div className="mt-3">
                              <p className="text-muted mb-2">
                                <small>Đáp án đúng (Tự luận/Điền khuyết):</small>
                              </p>
                              <div className="p-3 rounded-pill" style={{ backgroundColor: "#e6faf4", border: "2px solid #b3f0de", display: "inline-flex", alignItems: "center" }}>
                                <div style={{ backgroundColor: "#00c896", width: "28px", height: "28px", borderRadius: "50%" }} className="d-flex align-items-center justify-content-center me-2">
                                  <FontAwesomeIcon icon={faPenNib} size="xs" color="white" />
                                </div>
                                <strong className="text-dark" style={{ fontSize: "1rem" }}>
                                  {(() => {
                                    const metaSource = question.metaJson || question.MetaJson;
                                    if (metaSource) {
                                      try {
                                        const meta = typeof metaSource === 'string' ? JSON.parse(metaSource) : metaSource;
                                        const ans = meta?.answer || meta?.Answer || (meta?.answers && meta.answers.join(", "));
                                        if (ans) return ans;
                                      } catch (e) {}
                                    }
                                    const firstOpt = (question.options || question.choices || [])[0];
                                    return firstOpt?.content || firstOpt?.Content || firstOpt || "Chưa có đáp án";
                                  })()}
                                </strong>
                              </div>
                            </div>
                          ) : (
                            qOptions && qOptions.length > 0 && (
                              <div className="mt-3">
                                <p className="text-muted mb-2">
                                  <small>Lựa chọn:</small>
                                </p>
                                <ListGroup className="border-0 shadow-sm rounded-4 overflow-hidden">
                                  {qOptions.map((opt, optIdx) => {
                                    const isCorrect = opt.isCorrect === true || opt.correct === true || opt.IsCorrect === true;
                                    return (
                                      <ListGroup.Item
                                        key={optIdx}
                                        className={`d-flex align-items-center border-0 py-2 px-3 ${isCorrect ? "bg-success bg-opacity-10 text-success fw-bold" : "text-muted"}`}
                                      >
                                        <div 
                                          className={`me-3 d-flex align-items-center justify-content-center fw-bold`} 
                                          style={{ 
                                            width: "24px", 
                                            height: "24px", 
                                            borderRadius: "50%", 
                                            backgroundColor: isCorrect ? "#00c896" : "#f1f3f5",
                                            color: isCorrect ? "white" : "#adb5bd",
                                            fontSize: "0.75rem"
                                          }}
                                        >
                                          {String.fromCharCode(65 + optIdx)}
                                        </div>
                                        {opt.content || opt.Content || opt}
                                        {isCorrect && (
                                          <FontAwesomeIcon icon={faCheckSquare} className="ms-auto" />
                                        )}
                                      </ListGroup.Item>
                                    );
                                  })}
                                </ListGroup>
                              </div>
                            )
                          )}
                        </Card.Body>
                      </Card>
                    );
                  })
                ) : (
                  <Alert variant="info" className="text-center">
                    <p className="mb-0">Chưa có câu hỏi</p>
                  </Alert>
                )}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      ) : (
        <Card className="quiz-empty-state text-center py-5">
          <Card.Body>
            <Alert variant="info" className="mb-3">
              <strong>Quiz chưa có group</strong>
              <p className="mb-0 mt-2">
                Bạn có thể dùng nút <b>"Tạo đề bằng AI"</b> để tạo group và câu hỏi tự động,
                hoặc tạo group thủ công.
              </p>
            </Alert>

            <Button
              variant="primary"
              onClick={() => {
                setEditingGroupIndex(null);
                setNewGroupInstruction("");
                setShowGroupModal(true);
              }}
            >
              <FolderPlus size={18} className="me-2" />
              Tạo Group
            </Button>
          </Card.Body>
        </Card>
      )}

      <Modal
        show={showGroupModal}
        onHide={() => setShowGroupModal(false)}
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingGroupIndex !== null ? "Sửa Group" : "Thêm Group"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Instruction</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="VD: Listen to the audio and answer"
              value={newGroupInstruction}
              onChange={(e) => setNewGroupInstruction(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGroupModal(false)} disabled={uploading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveGroup} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : editingGroupIndex !== null ? (
              "Lưu"
            ) : (
              "Tạo"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showAIModal}
        onHide={() => setShowAIModal(false)}
        size="lg"
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <Sparkles size={24} className="me-2" style={{ color: "#667eea" }} />
            Tạo đề bằng AI
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <strong>💡 Hướng dẫn:</strong>
            <ul className="mb-0 mt-2">
              <li>
                Mô tả chi tiết nội dung bạn muốn tạo đề (chủ đề, level, số lượng câu, dạng câu
                hỏi...)
              </li>
              <li>
                Ví dụ: <em>"Create 10 questions about Present Continuous Tense for intermediate level"</em>
              </li>
            </ul>
          </Alert>

          {groups.length > 0 && (
            <Form.Group className="mb-3">
              <Form.Label>Chọn Group để thêm câu hỏi</Form.Label>
              <Form.Select
                value={aiSelectedGroupIndex !== null ? aiSelectedGroupIndex : 0}
                onChange={(e) => setAiSelectedGroupIndex(parseInt(e.target.value, 10))}
              >
                {groups.map((g, i) => (
                  <option key={i} value={i}>
                    Group {i + 1}: {g.instruction}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Nếu quiz chưa có group nào, AI sẽ tự tạo Group 1 giúp bạn.
              </Form.Text>
            </Form.Group>
          )}

          <Form.Group>
            <Form.Label>Prompt cho AI</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Ví dụ: Create 10 multiple choice questions about English grammar..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={aiLoading}
            />
            <Form.Text className="text-muted">
              Mô tả càng chi tiết, AI sẽ tạo đề càng chính xác
            </Form.Text>
          </Form.Group>

          {aiLoading && (
            <Alert variant="warning" className="mt-3 mb-0">
              <div className="d-flex align-items-center">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>AI đang tạo đề... Vui lòng đợi</span>
              </div>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAIModal(false)} disabled={aiLoading}>
            Hủy
          </Button>
          <Button
            variant="primary"
            className="quiz-ai-btn"
            onClick={handleGenerateAIQuiz}
            disabled={!aiPrompt.trim() || aiLoading}
          >
            {aiLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang tạo...
              </>
            ) : (
              <>
                <Sparkles size={18} className="me-2" />
                Tạo bằng AI
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        size="xl"
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Thêm câu hỏi vào Group {selectedGroupIndex !== null ? selectedGroupIndex + 1 : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedGroupIndex !== null && groups[selectedGroupIndex] && (
            <Alert variant="info" className="mb-4">
              <strong>📁 Group:</strong> {groups[selectedGroupIndex].instruction}
            </Alert>
          )}

          {importQuestions.map((q, qIndex) => (
            <Card key={qIndex} className="mb-3">
              <Card.Header className="d-flex justify-content-between">
                <strong>Câu {qIndex + 1}</strong>
                {importQuestions.length > 1 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </Card.Header>

              <Card.Body>
                <Nav variant="pills" className="custom-question-tabs mb-3" activeKey={q.type || 1} onSelect={(k) => updateQuestion(qIndex, "type", parseInt(k))}>
                    <Nav.Item>
                        <Nav.Link eventKey={1}>Trắc nghiệm</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey={2}>Tự luận</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Form.Group className="mb-3">
                  <Form.Label>Nội dung</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Nhập câu hỏi..."
                    value={q.content}
                    onChange={(e) => updateQuestion(qIndex, "content", e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Điểm</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="0.01"
                    value={q.scoreWeight}
                    onChange={(e) =>
                      updateQuestion(qIndex, "scoreWeight", parseFloat(e.target.value) || 1)
                    }
                    style={{ width: "100px" }}
                  />
                </Form.Group>

                {q.type === 1 ? (
                  <>
                    <Form.Label>Đáp án</Form.Label>
                    {q.options.map((opt, optIndex) => (
                      <Row key={optIndex} className="mb-2 align-items-center">
                        <Col xs={1}>
                          <Form.Check
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctIndex === optIndex}
                            onChange={() => setCorrectAnswer(qIndex, optIndex)}
                          />
                        </Col>
                        <Col xs={1} className="text-center">
                          <strong>{String.fromCharCode(65 + optIndex)}.</strong>
                        </Col>
                        <Col xs={9}>
                          <Form.Control
                            type="text"
                            placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          />
                        </Col>
                        <Col xs={1}>
                          {q.options.length > 2 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-danger p-0"
                              onClick={() => removeOption(qIndex, optIndex)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </Col>
                      </Row>
                    ))}

                    <Button variant="outline-secondary" size="sm" onClick={() => addOption(qIndex)}>
                      <Plus size={16} className="me-1" />
                      Thêm đáp án
                    </Button>
                  </>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label>Đáp án đúng cho câu hỏi tự luận</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Nhập đáp án đúng/tham khảo..."
                      value={q.options[0] || ""}
                      onChange={(e) => updateOption(qIndex, 0, e.target.value)}
                    />
                    <Form.Text className="text-muted">
                        Học viên cần điền chính xác cụm từ này (không phân biệt hoa thường).
                    </Form.Text>
                  </Form.Group>
                )}
              </Card.Body>
            </Card>
          ))}

          <Button variant="outline-primary" onClick={addQuestion} className="w-100">
            <Plus size={18} className="me-2" />
            Thêm câu hỏi
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)} disabled={uploading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              `Lưu ${importQuestions.length} câu`
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Sửa câu hỏi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingQuestion && (
            <div>
                <Nav variant="pills" className="custom-question-tabs mb-3" activeKey={editingQuestion.type || 1} onSelect={(k) => setEditingQuestion({ ...editingQuestion, type: parseInt(k) })}>
                    <Nav.Item>
                        <Nav.Link eventKey={1}>Trắc nghiệm</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey={2}>Tự luận</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Form.Group className="mb-3">
                    <Form.Label>Nội dung</Form.Label>
                    <Form.Control
                    as="textarea"
                    rows={2}
                    value={editingQuestion.content}
                    onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, content: e.target.value })
                    }
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Điểm</Form.Label>
                    <Form.Control
                    type="number"
                    min="1"
                    step="0.01"
                    value={editingQuestion.scoreWeight}
                    onChange={(e) =>
                        setEditingQuestion({
                        ...editingQuestion,
                        scoreWeight: parseFloat(e.target.value) || 1,
                        })
                    }
                    style={{ width: "100px" }}
                    />
                </Form.Group>

                {editingQuestion.type === 1 ? (
                    <>
                    <Form.Label>Đáp án</Form.Label>
                    {editingQuestion.options.map((opt, optIndex) => (
                        <Row key={optIndex} className="mb-2 align-items-center">
                        <Col xs={1}>
                            <Form.Check
                            type="radio"
                            name="correct-edit"
                            checked={editingQuestion.correctIndex === optIndex}
                            onChange={() =>
                                setEditingQuestion({ ...editingQuestion, correctIndex: optIndex })
                            }
                            />
                        </Col>
                        <Col xs={1} className="text-center">
                            <strong>{String.fromCharCode(65 + optIndex)}.</strong>
                        </Col>
                        <Col xs={9}>
                            <Form.Control
                            type="text"
                            value={opt}
                            onChange={(e) => {
                                const newOptions = [...editingQuestion.options];
                                newOptions[optIndex] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, options: newOptions });
                            }}
                            />
                        </Col>
                        <Col xs={1}>
                            {editingQuestion.options.length > 2 && (
                            <Button
                                variant="link"
                                size="sm"
                                className="text-danger p-0"
                                onClick={() => {
                                if (editingQuestion.options.length > 2) {
                                    const newOptions = editingQuestion.options.filter(
                                    (_, i) => i !== optIndex
                                    );
                                    const newCorrectIndex =
                                    editingQuestion.correctIndex >= newOptions.length
                                        ? newOptions.length - 1
                                        : editingQuestion.correctIndex;

                                    setEditingQuestion({
                                    ...editingQuestion,
                                    options: newOptions,
                                    correctIndex: newCorrectIndex,
                                    });
                                }
                                }}
                            >
                                <Trash2 size={16} />
                            </Button>
                            )}
                        </Col>
                        </Row>
                    ))}

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                        setEditingQuestion({
                            ...editingQuestion,
                            options: [...editingQuestion.options, ""],
                        })
                        }
                    >
                        <Plus size={16} className="me-1" />
                        Thêm đáp án
                    </Button>
                    </>
                ) : (
                    <Form.Group className="mb-3">
                        <Form.Label>Đáp án đúng cho câu hỏi tự luận</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Nhập đáp án đúng/tham khảo..."
                            value={editingQuestion.options[0] || ""}
                            onChange={(e) => {
                                const newOptions = [...editingQuestion.options];
                                newOptions[0] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, options: newOptions });
                            }}
                        />
                        <Form.Text className="text-muted">
                            Học viên cần điền chính xác cụm từ này (không phân biệt hoa thường).
                        </Form.Text>
                    </Form.Group>
                )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={uploading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Bạn chắc chắn muốn xóa câu hỏi này?
            <br />
            <strong>Không thể hoàn tác!</strong>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={uploading}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteQuestion} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang xóa...
              </>
            ) : (
              "Xóa"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showTextAssetModal}
        onHide={() => {
          setShowTextAssetModal(false);
          setTextAssetContent("");
          setTextAssetGroupIndex(null);
          setIsEditingAsset(false);
          setEditingAssetIndex(null);
        }}
        size="lg"
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{isEditingAsset ? "Sửa Text" : "Thêm Text"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nội dung Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={12}
              placeholder="Nhập nội dung..."
              value={textAssetContent}
              onChange={(e) => setTextAssetContent(e.target.value)}
              style={{ fontSize: "14px" }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowTextAssetModal(false);
              setTextAssetContent("");
              setTextAssetGroupIndex(null);
              setIsEditingAsset(false);
              setEditingAssetIndex(null);
            }}
            disabled={uploading}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleAddTextAsset}
            disabled={!textAssetContent.trim() || uploading}
          >
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : isEditingAsset ? (
              "Cập nhật"
            ) : (
              "Thêm"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{confirmConfig.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={confirmConfig.variant === "danger" ? "warning" : confirmConfig.variant}>
            {confirmConfig.message}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button variant={confirmConfig.variant} onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        centered
        dialogClassName="quiz-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>❌ Lỗi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="mb-0">
            {errorMessage}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer
        className="quiz-detail-toast-container p-3"
        position="top-end"
        style={{ zIndex: 9999 }}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            bg={toast.variant}
            autohide
            delay={4000}
          >
            <Toast.Header closeButton>
              <strong className="me-auto">
                {toast.variant === "success"
                  ? "✅ Thành công"
                  : toast.variant === "danger"
                  ? "❌ Lỗi"
                  : toast.variant === "warning"
                  ? "⚠️ Cảnh báo"
                  : "ℹ️ Thông báo"}
              </strong>
            </Toast.Header>
            <Toast.Body
              className={
                toast.variant === "success" || toast.variant === "danger" ? "text-white" : ""
              }
            >
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </Container>
  );
};

export default QuizDetail;