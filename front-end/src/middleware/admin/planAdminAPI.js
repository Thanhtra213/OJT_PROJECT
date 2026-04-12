import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/admin/plans`;

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
};

export const getAllPlans = async () => {
  const res = await api.get("/view", { headers: getAuthHeaders() });
  return res.data;
};

export const getPlanById = async (id) => {
  const res = await api.get(`/${id}`, { headers: getAuthHeaders() });
  return res.data;
};

export const createPlan = async (data) => {
  const res = await api.post("/create", data, { headers: getAuthHeaders() });
  return res.data;
};

export const updatePlan = async (id, data) => {
  const res = await api.put(`/update/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
};

//Thêm params { force: true } để ép Backend xóa vĩnh viễn
export const deletePlan = async (id) => {
  const res = await api.delete(`/delete/${id}`, { 
    headers: getAuthHeaders(),
    params: { force: true } 
  });
  return res.data;
};