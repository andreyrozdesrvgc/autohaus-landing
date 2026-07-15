import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND}/api`;
const STORAGE_KEY = "autohaus_admin_token";

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(STORAGE_KEY, token);
  else localStorage.removeItem(STORAGE_KEY);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export const adminAxios = axios.create({ baseURL: API, withCredentials: true });

adminAxios.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export async function adminLogin(email, password) {
  const { data } = await adminAxios.post("/admin/login", { email, password });
  setToken(data.token);
  return data;
}

export async function adminLogout() {
  try { await adminAxios.post("/admin/logout"); } catch {}
  clearToken();
}

export async function fetchMe() {
  const { data } = await adminAxios.get("/admin/me");
  return data;
}

export async function saveContent(content) {
  const { data } = await adminAxios.put("/admin/content", content);
  return data;
}

export async function uploadMedia(file, onProgress) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await adminAxios.post("/admin/media", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data; // { id, url, filename, content_type, size }
}
