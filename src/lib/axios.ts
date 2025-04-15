import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_WORKING_MODE === 'production' 
    ? 'https://chat-app-vyqv.onrender.com/api' 
    : 'http://localhost:5001/api',
  withCredentials: true,
});

export default axios;