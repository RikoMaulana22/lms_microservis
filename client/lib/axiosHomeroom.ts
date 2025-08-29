import axios from 'axios';

const homeroomApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_HOMEROOM || 'http://localhost:5008/api/homeroom',
  headers: {
        'Content-Type': 'application/json',
    },
});

homeroomApiClient.interceptors.request.use(
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

export default homeroomApiClient;