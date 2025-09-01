// api-gateway/src/index.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 4000;

// Definisikan target untuk setiap layanan
const serviceTargets = {
    USER_SERVICE: 'http://localhost:4001',
    COURSE_SERVICE: 'http://localhost:4002',
    GRADING_SERVICE: 'http://localhost:4003',
    ATTENDANCE_SERVICE: 'http://localhost:4004',
    ADMIN_SERVICE: 'http://localhost:4005'
};

// Arahkan rute ke layanan yang sesuai
app.use('/api/auth', createProxyMiddleware({ target: serviceTargets.USER_SERVICE, changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: serviceTargets.USER_SERVICE, changeOrigin: true }));
app.use('/api/classes', createProxyMiddleware({ target: serviceTargets.COURSE_SERVICE, changeOrigin: true }));
app.use('/api/subjects', createProxyMiddleware({ target: serviceTargets.COURSE_SERVICE, changeOrigin: true }));
app.use('/api/topics', createProxyMiddleware({ target: serviceTargets.COURSE_SERVICE, changeOrigin: true }));
app.use('/api/materials', createProxyMiddleware({ target: serviceTargets.COURSE_SERVICE, changeOrigin: true }));
app.use('/api/assignments', createProxyMiddleware({ target: serviceTargets.GRADING_SERVICE, changeOrigin: true }));
app.use('/api/submissions', createProxyMiddleware({ target: serviceTargets.GRADING_SERVICE, changeOrigin: true }));
app.use('/api/schedules', createProxyMiddleware({ target: serviceTargets.ATTENDANCE_SERVICE, changeOrigin: true }));
app.use('/api/attendance', createProxyMiddleware({ target: serviceTargets.ATTENDANCE_SERVICE, changeOrigin: true }));
app.use('/api/admin', createProxyMiddleware({ target: serviceTargets.ADMIN_SERVICE, changeOrigin: true }));
app.use('/api/homeroom', createProxyMiddleware({ target: serviceTargets.ADMIN_SERVICE, changeOrigin: true }));

app.listen(PORT, () => console.log(`API Gateway is running on port ${PORT}`));