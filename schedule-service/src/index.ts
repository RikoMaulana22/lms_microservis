import dotenv from 'dotenv';
import express from 'express';
import cors, { CorsOptions } from 'cors'; 
import scheduleRoutes from './routes/schedule.routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/schedules', scheduleRoutes);

app.listen(5005, () => {
  console.log('Schedule service running on port 5005');
});