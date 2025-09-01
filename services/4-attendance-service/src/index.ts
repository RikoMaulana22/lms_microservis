// services/4-attendance-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scheduleRoutes from './routes/schedule.routes';
import attendanceRoutes from './routes/attendance.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Attendance Service is running!');
});

// Daftarkan rute
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Attendance Service running on http://localhost:${PORT}`);
});