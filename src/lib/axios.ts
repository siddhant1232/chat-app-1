import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL:import.meta.env.BACKEND_URL,
  withCredentials:true,
})

export default axios;