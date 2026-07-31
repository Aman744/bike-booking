import axios from 'axios';

// Create base axios instance for v1 endpoints
export const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || 'https://bike-booking-backend-j4xd.onrender.com/api/v1') 
    : '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses to handle global errors (e.g. auth failures)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, we can trigger global states if needed
    return Promise.reject(error);
  }
);

export default api;
