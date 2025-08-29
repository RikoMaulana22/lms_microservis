import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendance.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/attendance', attendanceRoutes);

app.listen(5004, () => {
  console.log('Attendance service is running on port 5004');
});