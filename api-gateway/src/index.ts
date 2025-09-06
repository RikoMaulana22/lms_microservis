// api-gateway/src/index.ts

import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 4000;

// ==================================================================
// MIDDLEWARE KEAMANAN & LOGGING
// ==================================================================

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin ini tidak diizinkan oleh kebijakan CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit',
});
app.use(limiter);

// ==================================================================
// KONFIGURASI PROXY
// ==================================================================
const serviceUrls = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  course: process.env.COURSE_SERVICE_URL || 'http://localhost:5002',
  grading: process.env.GRADING_SERVICE_URL || 'http://localhost:5003',
  attendance: process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:5004',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:5005',
};

// --- PERBAIKAN DI SINI ---
// Hapus pathRewrite dari proxyOptions bersama
const proxyOptions: Options = {
  changeOrigin: true,
  on: {
    error: (err, req, res, target) => {
      console.error(`Proxy Error menargetkan ${target}:`, err);
      if (res instanceof http.ServerResponse && !res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: 'Layanan tidak tersedia atau mengalami masalah.',
            error: err.message,
          })
        );
      }
    },
  },
};

// Terapkan pathRewrite secara spesifik untuk setiap rute
app.use('/api/auth', createProxyMiddleware({
  ...proxyOptions,
  target: serviceUrls.user,
  pathRewrite: { '^/api/auth': '/auth' }, // /api/auth/login -> /auth/login
}));

app.use('/api/users', createProxyMiddleware({
  ...proxyOptions,
  target: serviceUrls.user,
  pathRewrite: { '^/api/users': '/users' }, // /api/users/1 -> /users/1
}));

app.use('/api/courses', createProxyMiddleware({
  ...proxyOptions,
  target: serviceUrls.course,
  pathRewrite: { '^/api/courses': '/courses' },
}));

app.use('/api/grading', createProxyMiddleware({
  ...proxyOptions,
  target: serviceUrls.grading,
  pathRewrite: { '^/api/grading': '/grading' },
}));

app.use('/api/attendance', createProxyMiddleware({
  ...proxyOptions,
  target: serviceUrls.attendance,
  pathRewrite: { '^/api/attendance': '/attendance' },
}));

app.use('/api/admin', createProxyMiddleware({
  ...proxyOptions,
  target: serviceUrls.admin,
  pathRewrite: { '^/api/admin': '/admin' },
}));
// --- BATAS AKHIR PERBAIKAN ---


// ==================================================================
// PENANGANAN RUTE TIDAK DITEMUKAN & ERROR GLOBAL
// ==================================================================

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan di API Gateway.' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server.' });
});

app.listen(PORT, () => {
  console.log(`API Gateway berjalan di port ${PORT}`);
});