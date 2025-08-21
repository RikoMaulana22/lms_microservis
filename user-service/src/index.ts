// user-service/src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 5001; // Port untuk layanan pengguna
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// Rute dasar untuk memeriksa status layanan
app.get('/', (req: Request, res: Response) => {
  res.send('User Service is running.');
});

// Hubungkan semua rute otentikasi
app.use('/api/auth', authRoutes);

app.listen(PORT, HOST, () => {
  console.log(`🚀 User Service berjalan di http://localhost:${PORT}`);
});