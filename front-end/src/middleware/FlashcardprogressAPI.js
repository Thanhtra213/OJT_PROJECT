import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Gọi khi học 1 flashcard (Mastered / NotYet / Skip)
// actionType: "Mastered" | "NotYet" | "Skip"
const ACTION_MAP = {
    Mastered: 1,
    NotYet: 2,
    Skip: 3
};

export const learnFlashcard = async ({ itemId, actionType }) => {
    const res = await axios.post(
        `${API_BASE}/flashcard/progress/learn`,
        {
            itemId,
            actionType: ACTION_MAP[actionType],
            isCorrect: true 
            
        },
        
        { headers: getAuthHeader() }
    );
    return res.data;
    
};

// Lưu 1 từ vào danh sách riêng của student
export const saveFlashcardToMyList = async (itemId) => {
    const res = await axios.post(
        `${API_BASE}/user/vocabulary/save`,
        { itemId },
        { headers: getAuthHeader() }
    );
    return res.data;
};

// Lấy danh sách từ đã lưu
export const getMyVocabList = async () => {
    const res = await axios.get(
        `${API_BASE}/user/vocabulary/list`,
        { headers: getAuthHeader() }
    );
    return res.data;
};

// Xóa từ khỏi danh sách
export const removeFromMyList = async (itemId) => {
    const res = await axios.delete(
        `${API_BASE}/user/vocabulary/${itemId}`,
        { headers: getAuthHeader() }
    );
    return res.data;
};

// Lấy tiến trình học của 1 bộ flashcard
export const getFlashcardProgress = async (setId) => {
    const res = await axios.get(
        `${API_BASE}/flashcard/progress/set/${setId}`, 
        { headers: getAuthHeader() }
    );
    return res.data;
};