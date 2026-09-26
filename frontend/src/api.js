import axios from "axios";

// Centralized API client.
// In production the API and the SPA are served by the SAME Cloudflare Worker,
// so requests go to the same origin at "/api". Override with REACT_APP_API_URL
// for local `npm start` against a running Worker (e.g. http://localhost:8787/api
// from `npx wrangler dev`).
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true,
});

// In-memory session token (preferred). localStorage is only a one-time
// migration source for sessions created before httpOnly cookies shipped.
let memToken = null;
export function setSessionToken(t) {
  memToken = t || null;
  if (!t) {
    try { localStorage.removeItem("token"); localStorage.removeItem("user"); } catch {}
  }
}
function currentToken() {
  if (memToken) return memToken;
  try { return localStorage.getItem("token"); } catch { return null; }
}

// Attach auth to every request. Cookie sessions (httpOnly) ride along via
// withCredentials; Bearer header covers migrated/older sessions.
api.interceptors.request.use((config) => {
  const token = currentToken();
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

// If the session is rejected on an authenticated route, clear it and redirect.
// Auth and public pages handle their own errors, so they are excluded here.
const PUBLIC_PATHS = ["/login", "/verify", "/forgot-password", "/reset-password", "/terms", "/privacy", "/cookies", "/compliance"];
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = (error.config && error.config.url) || "";
      const here = window.location.pathname;
      const isAuthCall = url.indexOf("/auth/") !== -1;
      const isPublicPage = PUBLIC_PATHS.some((p) => here === p || here.indexOf(p + "/") === 0);
      if (!isAuthCall && !isPublicPage) {
        setSessionToken(null);
        window.dispatchEvent(new Event("storage"));
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
