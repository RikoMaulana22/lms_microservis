// client/lib/axios.ts

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Interceptor untuk menambahkan token ke setiap request secara otomatis
apiClient.interceptors.request.use(
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

export default apiClient;