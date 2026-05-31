// utils/api.js
// Centralised Axios instance — base URL reads from Vite env vars,
// falling back to the Vite dev-proxy path (/api) for local development.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});

export const analyzeProfile = (username) =>
  api.get(`/analyze/${encodeURIComponent(username)}`);

export const fetchAllProfiles = () =>
  api.get("/profiles");

export default api;
