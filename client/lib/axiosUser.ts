import axios from 'axios';

const userApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_USER || 'http://localhost:5001/api',
  headers: {
        'Content-Type': 'application/json',
    },
});

userApiClient.interceptors.request.use(
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

export default userApiClient;