import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 4000;

// Definisikan rute dan target microservice
const routes = {
    '/api/auth': 'http://localhost:4001', // User Service
    '/api/users': 'http://localhost:4001', // User Service
    '/api/classes': 'http://localhost:4002', // Course Service
    '/api/subjects': 'http://localhost:4002', // Course Service
    '/api/assignments': 'http://localhost:4003', // Grading Service
    '/api/submissions': 'http://localhost:4003', // Grading Service
    '/api/attendance': 'http://localhost:4004', // Attendance Service
    '/api/schedules': 'http://localhost:4004', // Attendance Service
    '/api/admin': 'http://localhost:4005', // Admin Service
    '/api/homeroom': 'http://localhost:4005' // Admin Service (Wali Kelas)
};

for (const route in routes) {
    const target = routes[route as keyof typeof routes];
    app.use(route, createProxyMiddleware({ target, changeOrigin: true }));
}

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));