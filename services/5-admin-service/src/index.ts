// services/5-admin-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.routes';
import homeroomRoutes from './routes/homeroom.routes';
import announcementRoutes from './routes/announcement.routes';
import { errorHandler } from 'shared/middlewares/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Admin Service is running!');
});

// Daftarkan rute
app.use('/api/admin', adminRoutes);
app.use('/api/homeroom', homeroomRoutes);
app.use('/api/announcements', announcementRoutes);
app.use(errorHandler);



app.listen(PORT, () => {
  console.log(`🚀 Admin Service running on http://localhost:${PORT}`);
});
