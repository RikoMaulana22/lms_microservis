import axios from 'axios';

const scheduleApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_SCHEDULE || 'http://localhost:5007/api/admin',
  headers: {
        'Content-Type': 'application/json',
    },
});

scheduleApiClient.interceptors.request.use(
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

export default scheduleApiClient;