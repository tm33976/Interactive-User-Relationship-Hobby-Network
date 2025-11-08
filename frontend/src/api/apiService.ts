import axios from 'axios';

// --- THIS IS THE FIX ---
// Vite uses 'import.meta.env' for environment variables
// We read the VITE_API_URL, but fall back to our local URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// --- END OF FIX ---

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const handleApiError = (error: any) => {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.data.message || 'An unknown API error occurred';
  }
  return error.message || 'An unknown error occurred';
};

export default apiService;