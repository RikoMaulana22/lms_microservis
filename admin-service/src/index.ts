// admin-service/src/index.ts
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.routes';
import settingRoutes from './routes/setting.routes';

dotenv.config();
const app: Express = express();
const PORT = Number(process.env.PORT) || 5007;

app.use(cors({
  origin: 'http://localhost:3000', // alamat frontend
  credentials: true,
}));
app.use(express.json());

// ⚡ Daftarkan semua rute admin
app.use('/api/admin', adminRoutes);

// Rute khusus setting
app.use('/api/admin/settings', settingRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Admin Service berjalan di http://localhost:${PORT}`);
});
