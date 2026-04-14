import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Container, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaArrowRight, FaVolumeUp, FaTimes, FaExclamationTriangle, FaBookmark, FaCheck } from "react-icons/fa";
import { getFlashcardSetById } from "../../middleware/flashcardAPI";
import { learnFlashcard, saveFlashcardToMyList, getFlashcardProgress} from "../../middleware/FlashcardprogressAPI";
import "./Flashcard.scss";

const Flashcard = () => {
    const { setId } = useParams();
    const [flashcardSet, setFlashcardSet] = useState({ title: "", description: "", items: [] });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMsg, setStatusMsg] = useState("");
    const [mastered, setMastered] = useState(new Set());
    const [saved, setSaved] = useState(new Set());
    const navigate = useNavigate();

    const words = useMemo(() => {
        if (!flashcardSet.items) return [];
        return flashcardSet.items.map(item => ({
            id: item.itemID,
            word: item.frontText,
            meaning: item.backText,
            phonetic: item.ipa || "",
            example: item.example || "",
        }));
    }, [flashcardSet.items]);

   useEffect(() => {
    const fetchFlashcards = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getFlashcardSetById(setId);
            if (data && data.items) {
                setFlashcardSet({ title: data.title, description: data.description || "", items: data.items });
            } else {
                setFlashcardSet({ title: "Không tìm thấy", description: "", items: [] });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải flashcard.");
        } finally {
            setLoading(false);
        }

        // Load progress riêng, lỗi không ảnh hưởng flashcard
        // Trong useEffect, thay phần load progress
try {
    const progressData = await getFlashcardProgress(setId);
    console.log("Raw progress data:", progressData); // ← xem field name thực tế
    
    if (progressData?.length > 0) {
        // Log để xem tên field là camelCase hay PascalCase
        console.log("First item keys:", Object.keys(progressData[0]));
        
        setMastered(new Set(
            progressData
                .filter(p => p.isMastered || p.IsMastered)
                .map(p => p.itemId ?? p.ItemId)
        ));
        setSaved(new Set(
            progressData
                .filter(p => p.isSaved || p.IsSaved)
                .map(p => p.itemId ?? p.ItemId)
        ));
    }
} catch (err) {
    console.log("Progress error status:", err.response?.status); // ← xem có phải 404 không
    console.log("Progress error:", err.response?.data);
    if (err.response?.status !== 404) {
        console.error("Lỗi load progress:", err);
    }
}
    };
    fetchFlashcards();
}, [setId]);
    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === ' ') { e.preventDefault(); setIsFlipped(f => !f); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [words.length]);

    const showStatus = (msg) => {
        setStatusMsg(msg);
        setTimeout(() => setStatusMsg(""), 2200);
    };

    const handleNext = useCallback(() => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % words.length);
    }, [words.length]);

    const handlePrev = useCallback(() => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev === 0 ? words.length - 1 : prev - 1));
    }, [words.length]);

    const handleMastered = async () => {
        const word = words[currentIndex];
        try {
            await learnFlashcard({ itemId: word.id, actionType: "Mastered" });
            setMastered(prev => new Set([...prev, word.id]));
            showStatus("✓ Đã đánh dấu thuộc!");
            setTimeout(handleNext, 600);
        } catch {
            showStatus("Lỗi khi đánh dấu.");
        }
    };

    const handleSave = async () => {
        const word = words[currentIndex];
        if (saved.has(word.id)) {
            showStatus("Từ này đã có trong danh sách.");
            return;
        }
        try {
            await saveFlashcardToMyList(word.id);
            setSaved(prev => new Set([...prev, word.id]));
            showStatus("Đã lưu vào danh sách!");
        } catch {
            showStatus("Lỗi khi lưu từ.");
        }
    };

    const speakWord = (text, e) => {
        e?.stopPropagation();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    const currentWord = words[currentIndex];
    const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
    const remaining = words.length - mastered.size;

    if (loading) {
        return (
            <div className="flashcard-page-loading">
                <Spinner animation="border" variant="primary" />
                <p>Đang tải bộ flashcard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flashcard-page-error">
                <FaExclamationTriangle size={50} className="mb-3 text-danger" />
                <h4>Lỗi Tải Dữ Liệu</h4>
                <p>{error}</p>
                <button onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2" />Quay về danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="flashcard-learn-page">
            {/* ── Header ── */}
            <header className="flashcard-learn-header">
                <div className="header-left">
                    <span className="set-subtitle">Bộ thẻ học</span>
                    <h1 className="set-title">{flashcardSet.title}</h1>
                    {flashcardSet.description && (
                        <span className="set-description">{flashcardSet.description}</span>
                    )}
                </div>
                <div className="header-right">
                    <button onClick={() => navigate(-1)} className="close-button">
                        <FaTimes />
                    </button>
                </div>
            </header>

            {/* ── Stats strip ── */}
            <div className="flashcard-stats-strip">
                <div className="stat-item">
                    <span className="stat-value">{words.length}</span>
                    <span className="stat-label">Tổng thẻ</span>
                </div>
                <div className="stat-item stat-mastered">
                    <span className="stat-value">{mastered.size}</span>
                    <span className="stat-label">Đã thuộc</span>
                </div>
                <div className="stat-item stat-saved">
                    <span className="stat-value">{saved.size}</span>
                    <span className="stat-label">Đã lưu</span>
                </div>
                <div className="stat-item stat-remain">
                    <span className="stat-value">{remaining}</span>
                    <span className="stat-label">Còn lại</span>
                </div>
            </div>

            <Container className="flashcard-learn-container">
                {/* ── Progress ── */}
                <div className="progress-section">
                    <div className="progress-header">
                        <span className="progress-text">
                            Thẻ {currentIndex + 1} / {words.length}
                        </span>
                        <span className="progress-percent">{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-bar-background">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    {words.length <= 30 && (
                        <div className="progress-dots">
                            {words.map((w, i) => (
                                <div
                                    key={w.id}
                                    className={`dot ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {words.length > 0 ? (
                    <div className="flashcard-layout">
                        {/* ── Left: Card + Nav ── */}
                        <div className="main-card-area">
                            <div className="flashcard-scene">
                                <div
                                    className={`flashcard-item ${isFlipped ? 'is-flipped' : ''}`}
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <div className="flashcard-face flashcard-front">
                                        <div className="flashcard-content">
                                            <span className="flip-hint">Nhấn để lật thẻ</span>
                                            <div className="word">
                                                {currentWord.word}
                                                {mastered.has(currentWord.id) && (
                                                    <span className="mastered-star"> ★</span>
                                                )}
                                            </div>
                                            {currentWord.phonetic && (
                                                <div className="phonetic">{currentWord.phonetic}</div>
                                            )}
                                            <button
                                                className="speak-button"
                                                onClick={(e) => speakWord(currentWord.word, e)}
                                            >
                                                <FaVolumeUp />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flashcard-face flashcard-back">
                                        <div className="flashcard-content">
                                            <span className="back-label">Nghĩa</span>
                                            <div className="meaning">{currentWord.meaning}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Nav row below card */}
                            <div className="card-nav-row">
                                <button onClick={handlePrev} className="nav-arrow-button">
                                    <FaArrowLeft /> Trước
                                </button>
                                <span className="card-counter-pill">
                                    {currentIndex + 1} / {words.length}
                                </span>
                                <button onClick={handleNext} className="nav-arrow-button">
                                    Tiếp <FaArrowRight />
                                </button>
                            </div>

                            {/* Status */}
                            <div className="status-wrap">
                                {statusMsg && <span className="status-message">{statusMsg}</span>}
                            </div>
                        </div>

                        {/* ── Right: Sidebar ── */}
                        <aside className="flashcard-sidebar">
                            {/* Actions */}
                            <div className="sidebar-card">
                                <p className="sidebar-card-title">Hành động</p>
                                <div className="sidebar-actions">
                                    <button
                                        className={`action-btn save-btn ${saved.has(currentWord.id) ? 'active' : ''}`}
                                        onClick={handleSave}
                                    >
                                        <FaBookmark />
                                        <span className="action-label">
                                            {saved.has(currentWord.id) ? 'Đã lưu' : 'Lưu từ này'}
                                        </span>
                                        <span className="action-badge">{saved.size}</span>
                                    </button>

                                    <button
                                        className={`action-btn mastered-btn ${mastered.has(currentWord.id) ? 'active' : ''}`}
                                        onClick={handleMastered}
                                    >
                                        <FaCheck />
                                        <span className="action-label">
                                            {mastered.has(currentWord.id) ? 'Đã thuộc' : 'Đánh dấu thuộc'}
                                        </span>
                                        <span className="action-badge">{mastered.size}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Word info */}
                            <div className="sidebar-card">
                                <p className="sidebar-card-title">Thông tin thẻ</p>
                                <div className="sidebar-word-info">
                                    <div className="info-row">
                                        <span className="info-key">Từ</span>
                                        <span className="info-val">{currentWord.word}</span>
                                    </div>
                                    {currentWord.phonetic && (
                                        <div className="info-row">
                                            <span className="info-key">IPA</span>
                                            <span className="info-val">{currentWord.phonetic}</span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <span className="info-key">Nghĩa</span>
                                        <span className="info-val">{currentWord.meaning}</span>
                                    </div>
                                    {currentWord.example && (
                                        <div className="info-row">
                                            <span className="info-key">Ví dụ</span>
                                            <span className="info-val">{currentWord.example}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Keyboard shortcuts */}
                            <div className="sidebar-card">
                                <p className="sidebar-card-title">Phím tắt</p>
                                <div className="keyboard-hint-card">
                                    <div className="kb-row"><kbd>Space</kbd> Lật thẻ</div>
                                    <div className="kb-row"><kbd>→</kbd> Thẻ tiếp theo</div>
                                    <div className="kb-row"><kbd>←</kbd> Thẻ trước</div>
                                </div>
                            </div>
                        </aside>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <p>Bộ flashcard này không có thẻ nào.</p>
                        <span>Hãy thêm thẻ vào bộ để bắt đầu học.</span>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default Flashcard;