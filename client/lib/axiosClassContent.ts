import axios from 'axios';

const classContentApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_CLASS || 'http://localhost:5002/api',
  headers: {
        'Content-Type': 'application/json',
    },
});

classContentApiClient.interceptors.request.use(
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

export default classContentApiClient;