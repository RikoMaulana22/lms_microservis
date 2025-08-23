// File: user-service/src/index.ts

  import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // <-- 1. Impor 'cors'
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// <-- 2. Konfigurasi CORS untuk mengizinkan frontend Anda
app.use(cors({
  origin: 'http://localhost:3000', // Alamat frontend Anda
  credentials: true, // Izinkan pengiriman cookie atau token
}));

app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(port, () => {
    console.log(`User service listening on port ${port}`);
});