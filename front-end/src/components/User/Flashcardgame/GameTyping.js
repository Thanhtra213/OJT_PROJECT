import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "react-bootstrap";
import { FaVolumeUp } from "react-icons/fa";
import "./GameTyping.scss";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const GameTyping = ({ words = [], onFinish }) => {
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [done, setDone] = useState(false);
    const inputRef = useRef(null);

    const initGame = useCallback(() => {
        setQuestions(shuffle(words));
        setCurrentIdx(0);
        setCorrectCount(0);
        setInputValue("");
        setAnswered(false);
        setFeedback(null);
        setDone(false);
    }, [words]);

    useEffect(() => { initGame(); }, [initGame]);

    useEffect(() => {
        if (!answered && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIdx, answered]);

    const speakWord = (word) => {
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(word);
            u.lang = 'en-US';
            speechSynthesis.speak(u);
        }
    };

    const handleSubmit = () => {
        if (answered || !inputValue.trim()) return;
        setAnswered(true);
        const correct = questions[currentIdx].word;
        const isCorrect = inputValue.trim().toLowerCase() === correct.toLowerCase();
        if (isCorrect) setCorrectCount(c => c + 1);
        setFeedback({ correct: isCorrect, correctAnswer: correct });
    };

    const handleNext = () => {
        if (currentIdx + 1 >= questions.length) {
            setDone(true);
        } else {
            setCurrentIdx(i => i + 1);
            setInputValue("");
            setAnswered(false);
            setFeedback(null);
        }
    };

    if (!questions.length) return null;

    if (done) {
        return (
            <div className="game-result">
                <div className="result-score">{correctCount}/{questions.length}</div>
                <p className="result-label">từ gõ đúng</p>
                <div className="result-actions">
                    <Button variant="dark" onClick={initGame}>Làm lại</Button>
                    {onFinish && <Button variant="outline-secondary" onClick={onFinish}>Thoát</Button>}
                </div>
            </div>
        );
    }

    const q = questions[currentIdx];

    return (
        <div className="game-typing">
            <div className="game-header">
                <h5 className="game-title">Gõ từ tiếng Anh</h5>
                <div className="game-meta">
                    <span>{currentIdx + 1}/{questions.length} &nbsp; ✓{correctCount}</span>
                    <Button size="sm" variant="outline-secondary" onClick={initGame}>Làm lại</Button>
                </div>
            </div>

            <div className="typing-card">
                <div className="typing-meaning">{q.meaning}</div>
                {q.phonetic && <div className="typing-phonetic">{q.phonetic}</div>}

                <button className="speak-btn" onClick={() => speakWord(q.word)}>
                    <FaVolumeUp className="me-2" />Nghe phát âm
                </button>

                <div className="typing-input-row">
                    <input
                        ref={inputRef}
                        type="text"
                        className={`typing-input ${answered ? (feedback?.correct ? 'correct' : 'wrong') : ''}`}
                        placeholder="Gõ từ tiếng Anh..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        disabled={answered}
                    />
                    {!answered && (
                        <Button variant="dark" onClick={handleSubmit}>Kiểm tra</Button>
                    )}
                </div>

                {feedback && (
                    <div className={`typing-feedback ${feedback.correct ? 'success' : 'danger'}`}>
                        {feedback.correct
                            ? "Chính xác!"
                            : <>Sai rồi. Đáp án đúng: <b>{feedback.correctAnswer}</b></>
                        }
                    </div>
                )}
            </div>

            {answered && (
                <div className="typing-next-row">
                    <Button variant="dark" onClick={handleNext}>
                        {currentIdx + 1 < questions.length ? "Tiếp →" : "Xem kết quả"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default GameTyping;