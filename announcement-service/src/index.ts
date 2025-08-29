import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import announcementRoutes from './routes/announcement.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/announcements', announcementRoutes);

app.listen(5006, () => {
  console.log('Announcement service is running on port 5006');
});