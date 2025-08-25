// schedule-service/src/index.ts
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scheduleRoutes from './routes/schedule.routes';

dotenv.config();
const app: Express = express();
const PORT = Number(process.env.PORT) || 5004;
app.use(cors({
  origin: 'http://localhost:3000', // Alamat frontend Anda
  credentials: true, // Izinkan pengiriman cookie atau token
}));
app.use(cors());
app.use(express.json());
app.use('/schedules', scheduleRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Schedule Service berjalan di http://localhost:${PORT}`);
});