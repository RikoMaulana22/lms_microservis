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

// --- KONFIGURASI CORS YANG BENAR DAN LENGKAP ---
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

// **KUNCI UTAMA 1**: Terapkan CORS sebagai middleware PERTAMA
app.use(cors(corsOptions));

// **KUNCI UTAMA 2**: Tangani SEMUA permintaan preflight (OPTIONS) secara eksplisit
// Ini akan merespons browser SEBELUM permintaan diteruskan ke proxy
app.options('*', cors(corsOptions));
// --- BATAS AKHIR KONFIGURASI CORS ---

// Middleware lainnya bisa setelah CORS
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
// KONFIGURASI PROXY (INI HARUS SETELAH SEMUA MIDDLEWARE DI ATAS)
// ==================================================================
const serviceUrls = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  course: process.env.COURSE_SERVICE_URL || 'http://localhost:5002',
  grading: process.env.GRADING_SERVICE_URL || 'http://localhost:5003',
  attendance: process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:5004',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:5005',
};

const proxyOptions: Options = {
  changeOrigin: true,
   pathRewrite: {
    '^/api': '', // Ini akan mengubah /api/auth/login menjadi /auth/login
  },
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

const createProxy = (target: string) =>
  createProxyMiddleware({ ...proxyOptions, target });

app.use('/api/auth', createProxy(serviceUrls.user));
app.use('/api/users', createProxy(serviceUrls.user));
app.use('/api/courses', createProxy(serviceUrls.course));
app.use('/api/grading', createProxy(serviceUrls.grading));
app.use('/api/attendance', createProxy(serviceUrls.attendance));
app.use('/api/admin', createProxy(serviceUrls.admin));

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