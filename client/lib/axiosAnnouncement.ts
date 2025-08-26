import axios from 'axios';

const announcementApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_ANNOUNCEMENT || 'http://localhost:5006/api/announcements',
  headers: {
        'Content-Type': 'application/json',
    },
});

announcementApiClient.interceptors.request.use(
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

export default announcementApiClient;