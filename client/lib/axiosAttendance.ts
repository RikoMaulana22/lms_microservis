import axios from 'axios';

const attendanceApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_ATTENDANCE || 'http://localhost:5008/api/attendances',
  headers: {
        'Content-Type': 'application/json',
    },
});

attendanceApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default attendanceApiClient;