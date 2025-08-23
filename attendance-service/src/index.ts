// attendance-service/src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import attendanceRoutes from './routes/attendance.routes';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 5008; // Gunakan port unik, misal 5008
const HOST = '0.0.0.0';
app.use(cors({
  origin: 'http://localhost:3000', // Alamat frontend Anda
  credentials: true, // Izinkan pengiriman cookie atau token
}));
app.use(cors());
app.use(express.json());

// Rute dasar untuk memeriksa status layanan
app.get('/', (req: Request, res: Response) => {
  res.send('Attendance Service is running.');
});

// Hubungkan semua rute absensi
app.use('/api/attendance', attendanceRoutes);

app.listen(PORT, HOST, () => {
  console.log(`🚀 Attendance Service berjalan di http://localhost:${PORT}`);
});