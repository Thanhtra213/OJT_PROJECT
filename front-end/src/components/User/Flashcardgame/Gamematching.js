import React, { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import "./GameMatching.scss";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const GameMatching = ({ words = [], onFinish }) => {
    const [wordItems, setWordItems] = useState([]);
    const [meaningItems, setMeaningItems] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [selectedMeaning, setSelectedMeaning] = useState(null);
    const [matched, setMatched] = useState(new Set());
    const [wrong, setWrong] = useState(new Set());
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);

    const initGame = useCallback(() => {
        const pool = shuffle(words).slice(0, 6);
        setWordItems(pool);
        setMeaningItems(shuffle(pool));
        setMatched(new Set());
        setWrong(new Set());
        setSelectedWord(null);
        setSelectedMeaning(null);
        setScore(0);
        setDone(false);
    }, [words]);

    useEffect(() => { initGame(); }, [initGame]);

    useEffect(() => {
        if (!selectedWord || !selectedMeaning) return;

        if (selectedWord.id === selectedMeaning.id) {
            const newMatched = new Set([...matched, selectedWord.id]);
            setMatched(newMatched);
            setScore(s => s + 1);
            setSelectedWord(null);
            setSelectedMeaning(null);
            if (newMatched.size === wordItems.length) {
                setTimeout(() => setDone(true), 400);
            }
        } else {
            const wrongKey = `w-${selectedWord.id}-m-${selectedMeaning.id}`;
            setWrong(new Set([wrongKey]));
            const w = selectedWord, m = selectedMeaning;
            setTimeout(() => {
                setWrong(new Set());
                setSelectedWord(null);
                setSelectedMeaning(null);
            }, 700);
        }
    }, [selectedWord, selectedMeaning]);

    const getWordClass = (item) => {
        let cls = "match-item";
        if (matched.has(item.id)) return cls + " correct";
        if (selectedWord?.id === item.id) cls += " selected";
        const wrongKey = `w-${item.id}-m-${selectedMeaning?.id}`;
        if (wrong.has(wrongKey)) cls += " wrong";
        return cls;
    };

    const getMeaningClass = (item) => {
        let cls = "match-item";
        if (matched.has(item.id)) return cls + " correct";
        if (selectedMeaning?.id === item.id) cls += " selected";
        const wrongKey = `w-${selectedWord?.id}-m-${item.id}`;
        if (wrong.has(wrongKey)) cls += " wrong";
        return cls;
    };

    if (done) {
        return (
            <div className="game-result">
                <div className="result-score">{score}/{wordItems.length}</div>
                <p className="result-label">cặp nối đúng</p>
                <div className="result-actions">
                    <Button variant="dark" onClick={initGame}>Chơi lại</Button>
                    {onFinish && <Button variant="outline-secondary" onClick={onFinish}>Thoát</Button>}
                </div>
            </div>
        );
    }

    return (
        <div className="game-matching">
            <div className="game-header">
                <h5 className="game-title">Nối từ với nghĩa</h5>
                <div className="game-meta">
                    <span>Điểm: <b>{score}</b></span>
                    <Button size="sm" variant="outline-secondary" onClick={initGame}>Làm lại</Button>
                </div>
            </div>

            <div className="match-grid">
                <div className="match-col">
                    {wordItems.map(item => (
                        <div
                            key={item.id}
                            className={getWordClass(item)}
                            onClick={() => !matched.has(item.id) && setSelectedWord(item)}
                        >
                            {item.word}
                        </div>
                    ))}
                </div>
                <div className="match-col">
                    {meaningItems.map(item => (
                        <div
                            key={item.id}
                            className={getMeaningClass(item)}
                            onClick={() => !matched.has(item.id) && setSelectedMeaning(item)}
                        >
                            {item.meaning}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameMatching;