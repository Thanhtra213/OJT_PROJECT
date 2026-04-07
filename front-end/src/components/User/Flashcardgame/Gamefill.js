import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import "./GameFill.scss";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const GameFill = ({ words = [], allWords = [], onFinish }) => {
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState(null); // { correct: bool, correctAnswer: string }
    const [done, setDone] = useState(false);

    const buildQuestions = useCallback(() => {
        const pool = shuffle(words);
        return pool.map(w => {
            const distractors = shuffle(allWords.filter(x => x.id !== w.id)).slice(0, 3).map(x => x.word);
            return { ...w, choices: shuffle([w.word, ...distractors]) };
        });
    }, [words, allWords]);

    const initGame = useCallback(() => {
        setQuestions(buildQuestions());
        setCurrentIdx(0);
        setCorrectCount(0);
        setAnswered(false);
        setFeedback(null);
        setDone(false);
    }, [buildQuestions]);

    useEffect(() => { initGame(); }, [initGame]);

    const handleChoice = (chosen) => {
        if (answered) return;
        setAnswered(true);
        const correct = questions[currentIdx].word;
        const isCorrect = chosen === correct;
        if (isCorrect) setCorrectCount(c => c + 1);
        setFeedback({ correct: isCorrect, correctAnswer: correct, chosen });
    };

    const handleNext = () => {
        if (currentIdx + 1 >= questions.length) {
            setDone(true);
        } else {
            setCurrentIdx(i => i + 1);
            setAnswered(false);
            setFeedback(null);
        }
    };

    const getChoiceClass = (choice) => {
        if (!answered) return "fill-choice";
        if (choice === questions[currentIdx].word) return "fill-choice correct";
        if (choice === feedback?.chosen && !feedback?.correct) return "fill-choice wrong";
        return "fill-choice";
    };

    if (!questions.length) return null;

    if (done) {
        return (
            <div className="game-result">
                <div className="result-score">{correctCount}/{questions.length}</div>
                <p className="result-label">câu trả lời đúng</p>
                <div className="result-actions">
                    <Button variant="dark" onClick={initGame}>Làm lại</Button>
                    {onFinish && <Button variant="outline-secondary" onClick={onFinish}>Thoát</Button>}
                </div>
            </div>
        );
    }

    const q = questions[currentIdx];

    return (
        <div className="game-fill">
            <div className="game-header">
                <h5 className="game-title">Điền từ còn thiếu</h5>
                <div className="game-meta">
                    <span>{currentIdx + 1}/{questions.length} &nbsp; ✓{correctCount}</span>
                    <Button size="sm" variant="outline-secondary" onClick={initGame}>Làm lại</Button>
                </div>
            </div>

            <div className="fill-card">
                <div className="fill-prompt">
                    <span className="fill-label">Nghĩa:</span>
                    <span className="fill-meaning">{q.meaning}</span>
                </div>
                {q.phonetic && <div className="fill-phonetic">{q.phonetic}</div>}

                <div className="fill-choices">
                    {q.choices.map(c => (
                        <button
                            key={c}
                            className={getChoiceClass(c)}
                            onClick={() => handleChoice(c)}
                            disabled={answered}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {feedback && (
                    <div className={`fill-feedback ${feedback.correct ? 'success' : 'danger'}`}>
                        {feedback.correct
                            ? "Chính xác!"
                            : `Sai rồi. Đáp án đúng: ${feedback.correctAnswer}`
                        }
                    </div>
                )}
            </div>

            {answered && (
                <div className="fill-next-row">
                    <Button variant="dark" onClick={handleNext}>
                        {currentIdx + 1 < questions.length ? "Câu tiếp →" : "Xem kết quả"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default GameFill;