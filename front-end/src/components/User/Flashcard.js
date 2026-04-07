import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { Container, Button, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaArrowRight, FaVolumeUp, FaTimes, FaExclamationTriangle, FaBookmark, FaCheck } from "react-icons/fa";
import { getFlashcardSetById } from "../../middleware/flashcardAPI";
import { learnFlashcard, saveFlashcardToMyList } from "../../middleware/FlashcardprogressAPI";
import "./Flashcard.scss";

const Flashcard = () => {
    const { setId } = useParams();
    const [flashcardSet, setFlashcardSet] = useState({ title: "", items: [] });
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
        phonetic: item.example || "",
    }));
}, [flashcardSet.items]);
    

    useEffect(() => {
        const fetchFlashcards = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getFlashcardSetById(setId);
                if (data && data.items) {
                    setFlashcardSet({ title: data.title, items: data.items });
                } else {
                    setFlashcardSet({ title: "Không tìm thấy", items: [] });
                }
            } catch (err) {
                setError(err.response?.data?.message || "Không thể tải flashcard.");
            } finally {
                setLoading(false);
            }
        };
        fetchFlashcards();
    }, [setId]);

    const showStatus = (msg) => {
        setStatusMsg(msg);
        setTimeout(() => setStatusMsg(""), 2000);
    };

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % words.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev === 0 ? words.length - 1 : prev - 1));
    };

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
            showStatus("🔖 Đã lưu vào danh sách!");
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
                <Button variant="primary" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2" />Quay về danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="flashcard-learn-page">
            <header className="flashcard-learn-header">
                <h1 className="set-title">{flashcardSet.title}</h1>
                <button onClick={() => navigate(-1)} className="close-button"><FaTimes /></button>
            </header>

            <Container className="flashcard-learn-container">
                <div className="progress-section">
                    <p className="progress-text">
                        Tiến độ: {currentIndex + 1} / {words.length}
                        &nbsp;·&nbsp;
                        <span className="mastered-count">Đã thuộc: {mastered.size}</span>
                    </p>
                    <div className="progress-bar-background">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {words.length > 0 ? (
                    <>
                        <div className="main-card-area">
                            <button onClick={handlePrev} className="nav-arrow-button prev">
                                <FaArrowLeft />
                            </button>

                            <div className="flashcard-scene">
                                <div
                                    className={`flashcard-item ${isFlipped ? 'is-flipped' : ''}`}
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <div className="flashcard-face flashcard-front">
                                        <div className="flashcard-content">
                                            <div className="word">
                                                {currentWord.word}
                                                {mastered.has(currentWord.id) && <span className="mastered-star"> ★</span>}
                                            </div>
                                            <div className="phonetic">{currentWord.phonetic}</div>
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
                                            <div className="meaning">{currentWord.meaning}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleNext} className="nav-arrow-button next">
                                <FaArrowRight />
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flashcard-action-buttons">
                            <button
                                className={`action-btn save-btn ${saved.has(currentWord.id) ? 'active' : ''}`}
                                onClick={handleSave}
                            >
                                <FaBookmark className="me-2" />
                                {saved.has(currentWord.id) ? 'Đã lưu' : 'Lưu từ'}
                            </button>

                            <button
                                className={`action-btn mastered-btn ${mastered.has(currentWord.id) ? 'active' : ''}`}
                                onClick={handleMastered}
                            >
                                <FaCheck className="me-2" />
                                {mastered.has(currentWord.id) ? 'Đã thuộc' : 'Đánh dấu thuộc'}
                            </button>
                        </div>

                        {statusMsg && <p className="status-message">{statusMsg}</p>}
                    </>
                ) : (
                    <div className="empty-state">
                        <p>Bộ flashcard này không có thẻ nào.</p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default Flashcard;