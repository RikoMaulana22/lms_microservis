import axios from 'axios';

const assignmentApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_ASSIGNMENT || 'http://localhost:5003/api/assignments',
  headers: {
        'Content-Type': 'application/json',
    },
});

assignmentApiClient.interceptors.request.use(
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

export default assignmentApiClient;