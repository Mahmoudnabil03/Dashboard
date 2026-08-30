import axios from 'axios';

// Centralized API client.
// In production the API and the SPA are served by the SAME Cloudflare Worker,
// so requests go to the same origin at "/api". Override with REACT_APP_API_URL
// for local `npm start` against a running Worker (e.g. http://localhost:8787/api
// from `npx wrangler dev`).
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Attach the JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected on an authenticated route, clear session and redirect.
// Ignore 401s from /auth/* (failed login/register should not log you out).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
