// admin-service/src/index.ts
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.routes';
import settingRoutes from './routes/setting.routes'; // Hapus ini jika Anda memutuskan untuk tidak menggunakannya

dotenv.config();
const app: Express = express();
const PORT = Number(process.env.PORT) || 5007;

app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Admin Service berjalan di http://localhost:${PORT}`);
});