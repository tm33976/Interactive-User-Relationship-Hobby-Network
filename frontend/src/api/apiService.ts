import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


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