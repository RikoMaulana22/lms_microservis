// api-gateway/src/index.ts

import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import morgan from 'morgan'; // Untuk logging
import cors from 'cors'; // Untuk CORS
import helmet from 'helmet'; // Untuk keamanan header
import rateLimit from 'express-rate-limit'; // Untuk rate limiting
import http from 'http'; // Import modul http

// Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 4000;

// ==================================================================
// MIDDLEWARE KEAMANAN & LOGGING
// ==================================================================

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Batasi setiap IP hingga 100 permintaan per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit',
});
app.use(limiter);

// ==================================================================
// KONFIGURASI PROXY
// ==================================================================

const serviceUrls = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  course: process.env.COURSE_SERVICE_URL || 'http://localhost:4002',
  grading: process.env.GRADING_SERVICE_URL || 'http://localhost:4003',
  attendance: process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:4004',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:4005',
};

// --- PERBAIKAN UTAMA DI SINI ---
// Opsi proxy dengan penanganan error menggunakan event 'on'
const proxyOptions: Options = {
  changeOrigin: true,
  on: {
    error: (err, req, res, target) => {
      console.error(`Proxy Error menargetkan ${target}:`, err);

      // Pastikan 'res' adalah objek http.ServerResponse dan header belum dikirim
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

// Definisikan rute proxy
// Kita bisa membuat fungsi kecil agar tidak mengulang target di log error
const createProxy = (target: string) =>
  createProxyMiddleware({ ...proxyOptions, target });

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