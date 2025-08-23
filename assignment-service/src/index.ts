// assignment-service/src/index.ts

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/assignment.routes';
import submissionRoutes from './routes/submission.routes';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 5003; // Port unik
const HOST = '0.0.0.0';
app.use(cors({
  origin: 'http://localhost:3000', // Alamat frontend Anda
  credentials: true, // Izinkan pengiriman cookie atau token
}));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Assignment & Grading Service is running.');
});

app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

app.listen(PORT, HOST, () => {
  console.log(`🚀 Assignment & Grading Service berjalan di http://localhost:${PORT}`);
});