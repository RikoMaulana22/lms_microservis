// Path: index.ts

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/admin.routes';
import settingRoutes from './routes/setting.routes';

// Muat variabel lingkungan dari file .env sesegera mungkin
dotenv.config();

const app = express();
const port = process.env.PORT || 5007;

// Konfigurasi CORS untuk mengizinkan permintaan dari frontend (localhost:3000)
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware untuk mem-parsing body permintaan dalam format JSON
app.use(express.json());

// Menggunakan rute yang telah diimpor
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingRoutes);

app.listen(port, () => {
  console.log(`🚀 Admin service berjalan di port ${port}`);

  // Pemeriksaan penting untuk semua variabel lingkungan yang dibutuhkan
  const requiredEnvVars = [
    'JWT_SECRET',
    'USER_SERVICE_URL',
    'CLASS_SERVICE_URL',
    'SCHEDULE_SERVICE_URL',
    'ANNOUNCEMENT_SERVICE_URL',
    'ATTENDANCE_SERVICE_URL',
    'ASSIGNMENT_SERVICE_URL'
  ];

  let allVarsLoaded = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ FATAL ERROR: Variabel lingkungan '${envVar}' tidak ditemukan!`);
      allVarsLoaded = false;
    }
  }

  if (allVarsLoaded) {
    console.log(`✅ Semua konfigurasi dan variabel lingkungan berhasil dimuat.`);
  } else {
    console.error('   Pastikan semua variabel yang diperlukan ada di dalam file .env.');
    // Di lingkungan produksi, Anda mungkin ingin menghentikan proses di sini
    // process.exit(1);
  }
});