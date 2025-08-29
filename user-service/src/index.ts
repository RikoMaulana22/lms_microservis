// Path: user-service/src/index.ts

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes'; // Impor rute pengguna yang baru

// Muat variabel lingkungan dari file .env sesegera mungkin
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Konfigurasi CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());

// Menggunakan rute
app.use('/api/auth', authRoutes); // Untuk /api/auth/login
app.use('/api/users', userRoutes); // Untuk /api/users, /api/users/profile, dll.

app.listen(port, () => {
  console.log(`🚀 User service berjalan di port ${port}`);

  // Pemeriksaan variabel lingkungan penting
  const requiredEnvVars = ['JWT_SECRET', 'CLASS_SERVICE_URL'];
  let allVarsLoaded = true;
  for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
          console.error(`❌ FATAL ERROR: Variabel lingkungan '${envVar}' tidak ditemukan!`);
          allVarsLoaded = false;
      }
  }

  if (allVarsLoaded) {
      console.log(`✅ Semua konfigurasi penting berhasil dimuat.`);
  } else {
      console.error('   Pastikan semua variabel yang diperlukan ada di dalam file .env.');
  }
});