// import axios from 'axios';

// export const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_WORKING_MODE === 'production' 
//     ? 'https://chat-app-vyqv.onrender.com/api' 
//     : 'http://localhost:5001/api',
//   withCredentials: true,
// });

// // Add response interceptor for consistent error handling
// axiosInstance.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) {
//       // Handle unauthorized errors
//       window.location.href = '/signin';
//     }
//     return Promise.reject(error);
//   }
// );

// export default axios;