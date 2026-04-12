import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { getFlashcardSets, getFlashcardSetsByCourseId, getFlashcardSetById } from "../../../middleware/flashcardAPI";
import { getMyVocabList } from "../../../middleware/FlashcardprogressAPI";
import { getCourses } from "../../../middleware/courseAPI";
import "./GameLauncher.scss";

const COUNT_OPTIONS = [5, 10, 20, "Tất cả"];

const GAME_LABELS = {
    match: "Nối từ",
    fill: "Điền từ",
    type: "Gõ chính tả",
};

const mapItem = (item) => ({
    id: item.itemId ?? item.itemID ?? item.id,
    word: item.frontText ?? item.word,
    meaning: item.backText ?? item.meaning,
    phonetic: item.example ?? item.phonetic ?? "",
});

const GameLauncher = ({ gameType, onStart, onCancel }) => {
    const [source, setSource] = useState("saved"); // "saved" | "public" | "course"
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [publicSets, setPublicSets] = useState([]);
    const [courseSets, setCourseSets] = useState([]);
    const [selectedSetId, setSelectedSetId] = useState(null);
    const [allWords, setAllWords] = useState([]);
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [loadingSets, setLoadingSets] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        getFlashcardSets().then(setPublicSets).catch(() => {});
        getCourses()
            .then((res) => setCourses(res?.courses || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (source !== "course" || !selectedCourseId) return;
        setLoadingSets(true);
        setSelectedSetId(null);
        setAllWords([]);
        getFlashcardSetsByCourseId(selectedCourseId)
            .then(setCourseSets)
            .catch(() => setCourseSets([]))
            .finally(() => setLoadingSets(false));
    }, [selectedCourseId, source]);

    useEffect(() => {
        setAllWords([]);
        if (source === "saved") {
            setLoading(true);
            getMyVocabList()
                .then((data) => setAllWords((data || []).map(mapItem)))
                .catch(() => {})
                .finally(() => setLoading(false));
            return;
        }
        if (!selectedSetId) return;
        setLoading(true);
        getFlashcardSetById(selectedSetId)
            .then((data) => setAllWords((data?.items || []).map(mapItem)))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [source, selectedSetId]);

    const sets = source === "course" ? courseSets : publicSets;
    const finalCount = count === "Tất cả" ? allWords.length : Math.min(count, allWords.length);
    const selectedWords = allWords.slice(0, finalCount);
    const canStart = selectedWords.length >= 4;

    const handleSourceChange = (s) => {
        setSource(s);
        setSelectedSetId(null);
        setSelectedCourseId(null);
        setAllWords([]);
        setShowPreview(false);
    };

    const handleSetSelect = (id) => {
        setSelectedSetId(id);
        setShowPreview(false);
    };

    const startWarn = () => {
        if (source === "public" && !selectedSetId) return "Chọn một bộ flashcard để tiếp tục.";
        if (source === "course" && !selectedCourseId) return "Chọn khóa học trước.";
        if (source === "course" && !selectedSetId) return "Chọn một bộ flashcard để tiếp tục.";
        return "Cần ít nhất 4 từ để bắt đầu.";
    };

    return (
        <div className="game-setup">
            <div className="gs-header">
                <button className="gs-back" onClick={onCancel}>← Quay lại</button>
                <h5 className="gs-title">{GAME_LABELS[gameType]} — Cài đặt</h5>
            </div>

            {/* Nguồn từ */}
            <section className="gs-section">
                <p className="gs-label">Nguồn từ vựng</p>
                <div className="gs-pills">
                    {[
                        { key: "saved", label: "Từ đã lưu" },
                        { key: "public", label: "Bộ từ công khai" },
                        { key: "course", label: "Theo khóa học" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            className={`gs-pill ${source === key ? "active" : ""}`}
                            onClick={() => handleSourceChange(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Chọn course */}
            {source === "course" && (
                <section className="gs-section">
                    <p className="gs-label">Chọn khóa học</p>
                    {courses.length === 0 ? (
                        <p className="gs-empty">Không có khóa học nào.</p>
                    ) : (
                        <div className="gs-set-list">
                            {courses.map((c) => (
                                <button
                                    key={c.courseID}
                                    className={`gs-set-item ${selectedCourseId === c.courseID ? "active" : ""}`}
                                    onClick={() => setSelectedCourseId(c.courseID)}
                                >
                                    <span className="gs-set-title">{c.title ?? c.courseName ?? `Khóa học ${c.courseID}`}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Chọn bộ flashcard */}
            {(source === "public" || (source === "course" && selectedCourseId)) && (
                <section className="gs-section">
                    <p className="gs-label">Chọn bộ flashcard</p>
                    {loadingSets ? (
                        <div className="gs-loading">
                            <Spinner animation="border" size="sm" /> Đang tải bộ từ...
                        </div>
                    ) : sets.length === 0 ? (
                        <p className="gs-empty">Khóa học này chưa có bộ flashcard nào.</p>
                    ) : (
                        <div className="gs-set-list">
                            {sets.map((s) => {
                                const id = s.setID ?? s.setId;
                                return (
                                    <button
                                        key={id}
                                        className={`gs-set-item ${selectedSetId === id ? "active" : ""}`}
                                        onClick={() => handleSetSelect(id)}
                                    >
                                        <span className="gs-set-title">{s.title}: </span>
                                        {s.description && (
                                            <span className="gs-set-desc">{s.description}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* Số lượng từ */}
            {(source === "saved" || selectedSetId) && (
                <section className="gs-section">
                    <p className="gs-label">
                        Số lượng từ
                        {!loading && allWords.length > 0 && (
                            <span className="gs-total"> ({allWords.length} từ có sẵn)</span>
                        )}
                    </p>
                    <div className="gs-pills">
                        {COUNT_OPTIONS.map((opt) => {
                            const disabled = typeof opt === "number" && opt > allWords.length;
                            return (
                                <button
                                    key={opt}
                                    className={`gs-pill ${count === opt ? "active" : ""} ${disabled ? "disabled" : ""}`}
                                    onClick={() => !disabled && setCount(opt)}
                                    disabled={disabled}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Preview */}
            {loading ? (
                <div className="gs-loading">
                    <Spinner animation="border" size="sm" /> Đang tải từ...
                </div>
            ) : allWords.length > 0 && (
                <section className="gs-section">
                    <button
                        className="gs-preview-toggle"
                        onClick={() => setShowPreview((v) => !v)}
                    >
                        {showPreview ? "Ẩn danh sách" : `Xem trước ${finalCount} từ sẽ làm`}
                    </button>
                    {showPreview && (
                        <div className="gs-preview-list">
                            {selectedWords.map((w) => (
                                <div key={w.id} className="gs-preview-item">
                                    <span className="gs-preview-word">{w.word}</span>
                                    <span className="gs-preview-meaning">{w.meaning}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Footer */}
            <div className="gs-footer">
                {!canStart && !loading && (
                    <p className="gs-warn">{startWarn()}</p>
                )}
                <button
                    className="gs-start"
                    onClick={() => onStart(selectedWords)}
                    disabled={!canStart}
                >
                    Bắt đầu {GAME_LABELS[gameType]}
                </button>
            </div>
        </div>
    );
};

export default GameLauncher;