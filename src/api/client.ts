import axios from "axios";
import { getToken, clearToken } from "./storage";

const baseURL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  },
);

export default api;
