// src/middleware/placementTestAPI.js
const BASE = `${process.env.REACT_APP_API_URL}/api`;

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});


export const getPlacementTests = async () => {
  try {
    const res = await fetch(`${BASE}/PlacementTest`, { 
      headers: authHeaders() 
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching placement tests:', error);
    return [];
  }
};

export const getPlacementRecommendation = async (attemptId) => {
  try {
    const res = await fetch(`${BASE}/PlacementTest/recommend/${attemptId}`, { 
      headers: authHeaders() 
    });
    if (!res.ok) throw new Error('Không thể tải đề xuất');
    return res.json();
  } catch (error) {
    console.error('Error fetching placement recommendation:', error);
    throw error;
  }
};


export const markAsPlacementTest = async (quizId, data) => {
  try {
    const res = await fetch(`${BASE}/PlacementTest/admin/mark/${quizId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể cập nhật placement test');
    return res.json();
  } catch (error) {
    console.error('Error marking placement test:', error);
    throw error;
  }
};