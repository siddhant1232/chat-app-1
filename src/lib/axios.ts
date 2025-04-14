import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL:"https://chat-app-vyqv.onrender.com/api",
  withCredentials:true,
})

export default axios;