// services/1-user-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
// --- PERBAIKAN UTAMA DI SINI ---
// Gunakan port dari .env, atau default ke 5000 agar sesuai dengan error Anda
const PORT = process.env.PORT || 5001;

// Konfigurasi CORS yang lebih spesifik
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Tambahkan semua origin frontend Anda
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204 // Untuk browser lama
};

// Aktifkan penanganan preflight untuk semua rute
app.options('*', cors(corsOptions));

// Gunakan middleware cors dengan opsi yang telah ditentukan
app.use(cors(corsOptions));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('User Service is running!');
});

// Daftarkan rute
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 User Service running on http://localhost:${PORT}`);
});