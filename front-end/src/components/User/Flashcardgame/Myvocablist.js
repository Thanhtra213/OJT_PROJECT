import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaTrash, FaPlay } from "react-icons/fa";
import { getMyVocabList, removeFromMyList } from "../../middleware/flashcardProgressAPI";
import GameMatching from ".Flashcardgame/GameMatching";
import GameFill from "./GameFill";
import GameTyping from "./GameTyping";
import "./MyVocabList.scss";

const MyVocabList = () => {
    const [myList, setMyList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeGame, setActiveGame] = useState(null); // 'match' | 'fill' | 'type' | null

    const fetchList = async () => {
        try {
            setLoading(true);
            const data = await getMyVocabList();
            setMyList(data || []);
        } catch (err) {
            console.error("Lỗi tải danh sách từ:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchList(); }, []);

    const handleRemove = async (itemId) => {
        try {
            await removeFromMyList(itemId);
            setMyList(prev => prev.filter(w => w.id !== itemId));
        } catch {
            console.error("Lỗi xóa từ");
        }
    };

    if (loading) {
        return (
            <div className="mylist-loading">
                <Spinner animation="border" size="sm" /> Đang tải danh sách...
            </div>
        );
    }

    if (activeGame === 'match') {
        return <GameMatching words={myList} onFinish={() => setActiveGame(null)} />;
    }
    if (activeGame === 'fill') {
        return <GameFill words={myList} allWords={myList} onFinish={() => setActiveGame(null)} />;
    }
    if (activeGame === 'type') {
        return <GameTyping words={myList} onFinish={() => setActiveGame(null)} />;
    }

    return (
        <div className="mylist-page">
            <div className="mylist-header">
                <h5>Danh sách từ của tôi <span className="badge bg-secondary">{myList.length}</span></h5>
                {myList.length >= 4 && (
                    <div className="mylist-game-buttons">
                        <Button size="sm" variant="outline-dark" onClick={() => setActiveGame('match')}>
                            <FaPlay className="me-1" /> Nối từ
                        </Button>
                        <Button size="sm" variant="outline-dark" onClick={() => setActiveGame('fill')}>
                            <FaPlay className="me-1" /> Điền từ
                        </Button>
                        <Button size="sm" variant="outline-dark" onClick={() => setActiveGame('type')}>
                            <FaPlay className="me-1" /> Gõ chính tả
                        </Button>
                    </div>
                )}
            </div>

            {myList.length === 0 ? (
                <div className="mylist-empty">
                    <p>Chưa có từ nào. Hãy lưu từ khi học flashcard!</p>
                </div>
            ) : (
                <div className="mylist-grid">
                    {myList.map(item => (
                        <div key={item.id} className="mylist-card">
                            <button
                                className="mylist-remove"
                                onClick={() => handleRemove(item.id)}
                                title="Xóa"
                            >
                                <FaTrash />
                            </button>
                            <div className="mylist-word">{item.word || item.frontText}</div>
                            <div className="mylist-phonetic">{item.phonetic || item.example}</div>
                            <div className="mylist-meaning">{item.meaning || item.backText}</div>
                        </div>
                    ))}
                </div>
            )}

            {myList.length > 0 && myList.length < 4 && (
                <p className="mylist-hint">Cần ít nhất 4 từ để chơi trò chơi.</p>
            )}
        </div>
    );
};

export default MyVocabList;