import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { FaTrash, FaPlay } from "react-icons/fa";
import { getMyVocabList, removeFromMyList } from "../../../middleware/FlashcardprogressAPI";
import GameSetup from "./Gamelauncher";
import GameMatching from "./Gamematching";
import GameFill from "./Gamefill";
import GameTyping from "./GameTyping";
import "./MyVocalList.scss";

const mapItem = (item) => ({
    id: item.itemId ?? item.itemID ?? item.id,
    word: item.frontText ?? item.word,
    meaning: item.backText ?? item.meaning,
    phonetic: item.example ?? item.phonetic ?? "",
});

const MyVocabList = () => {
    const [myList, setMyList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingGame, setPendingGame] = useState(null); // 'match' | 'fill' | 'type'
    const [activeGame, setActiveGame] = useState(null);   // { type, words }

    const fetchList = async () => {
        try {
            setLoading(true);
            const data = await getMyVocabList();
            setMyList((data || []).map(mapItem));
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

    // Đang trong game
    if (activeGame) {
        const { type, words } = activeGame;
        const finish = () => setActiveGame(null);
        if (type === "match") return <GameMatching words={words} onFinish={finish} />;
        if (type === "fill")  return <GameFill words={words} allWords={words} onFinish={finish} />;
        if (type === "type")  return <GameTyping words={words} onFinish={finish} />;
    }

    // Đang ở màn hình setup
    if (pendingGame) {
        return (
            <GameSetup
                gameType={pendingGame}
                onStart={(words) => {
                    setPendingGame(null);
                    setActiveGame({ type: pendingGame, words });
                }}
                onCancel={() => setPendingGame(null)}
            />
        );
    }

    if (loading) {
        return (
            <div className="mylist-loading">
                <Spinner animation="border" size="sm" /> Đang tải danh sách...
            </div>
        );
    }

    return (
        <div className="mylist-page">
            <div className="mylist-header">
                <h5>Danh sách từ của tôi <span className="badge bg-secondary">{myList.length}</span></h5>
                {myList.length >= 4 && (
                    <div className="mylist-game-buttons">
                        <button className="mylist-game-btn" onClick={() => setPendingGame("match")}>
                            <FaPlay className="me-1" /> Nối từ
                        </button>
                        <button className="mylist-game-btn" onClick={() => setPendingGame("fill")}>
                            <FaPlay className="me-1" /> Điền từ
                        </button>
                        <button className="mylist-game-btn" onClick={() => setPendingGame("type")}>
                            <FaPlay className="me-1" /> Gõ chính tả
                        </button>
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
                            <div className="mylist-word">{item.word}</div>
                            <div className="mylist-phonetic">{item.phonetic}</div>
                            <div className="mylist-meaning">{item.meaning}</div>
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