// class-content-service/src/index.ts

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Import semua rute yang relevan untuk layanan ini
import classRoutes from './routes/class.routes';
import subjectRoutes from './routes/subject.routes';
import topicRoutes from './routes/topic.routes';
import materialRoutes from './routes/material.routes';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 5002; // Gunakan port unik, misal 5002
const HOST = '0.0.0.0';
app.use(cors({
  origin: 'http://localhost:3000', // Alamat frontend Anda
  credentials: true, // Izinkan pengiriman cookie atau token
}));
app.use(cors());
app.use(express.json());

// Rute dasar untuk memeriksa status layanan
app.get('/', (req: Request, res: Response) => {
  res.send('Class & Content Service is running.');
});

// Hubungkan semua rute ke Express
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/materials', materialRoutes);

app.listen(PORT, HOST, () => {
  console.log(`🚀 Class & Content Service berjalan di http://localhost:${PORT}`);
});