import React, { useState, useEffect } from "react";
import { Container, Spinner } from "react-bootstrap";
import { FaTrash, FaPlay, FaArrowLeft, FaBookOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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
    const [pendingGame, setPendingGame] = useState(null);
    const [activeGame, setActiveGame] = useState(null);
    const navigate = useNavigate();

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

    return (
        <div className="mylist-page">
            <Container>
                {/* Back button */}
                <button className="mylist-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> <span>Quay lại</span>
                </button>

                {/* Page header */}
                <div className="mylist-header">
                    <div className="mylist-title-area">
                        <h4>
                            <FaBookOpen className="me-2" style={{color:"#00c896"}} />
                            Danh sách từ của tôi
                            <span className="mylist-count">{myList.length}</span>
                        </h4>
                        <p className="mylist-subtitle">Các từ vựng bạn đã lưu khi học flashcard</p>
                    </div>

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

                {/* Content */}
                {loading ? (
                    <div className="mylist-loading">
                        <Spinner animation="border" style={{color:"#00c896"}} />
                        <p>Đang tải danh sách từ...</p>
                    </div>
                ) : myList.length === 0 ? (
                    <div className="mylist-empty">
                        <FaBookOpen className="mylist-empty-icon" />
                        <h5>Chưa có từ nào</h5>
                        <p>Hãy lưu từ khi học flashcard để ôn tập tại đây!</p>
                        <button className="mylist-go-learn" onClick={() => navigate("/flashcard-list")}>
                            Đi học flashcard
                        </button>
                    </div>
                ) : (
                    <div className="mylist-grid">
                        {myList.map(item => (
                            <div key={item.id} className="mylist-card">
                                <button
                                    className="mylist-remove"
                                    onClick={() => handleRemove(item.id)}
                                    title="Xóa khỏi danh sách"
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
                    <p className="mylist-hint">💡 Cần ít nhất 4 từ để chơi trò chơi ôn tập.</p>
                )}
            </Container>
        </div>
    );
};

export default MyVocabList;