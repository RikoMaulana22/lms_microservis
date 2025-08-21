// announcement-service/src/index.ts
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import announcementRoutes from '../src/routes/announcement.routes';

dotenv.config();
const app: Express = express();
const PORT = Number(process.env.PORT) || 5006;

app.use(cors());
app.use(express.json());
app.use('/api/announcements', announcementRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Announcement Service berjalan di http://localhost:${PORT}`);
});