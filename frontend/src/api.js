import axios from 'axios';

// Centralized API client.
// In production the API and the SPA are served by the SAME Cloudflare Worker,
// so requests go to the same origin at "/api". Override with REACT_APP_API_URL
// for local development against the Express backend (e.g. http://localhost:5000/api).
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

// If the token is rejected, bounce back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
