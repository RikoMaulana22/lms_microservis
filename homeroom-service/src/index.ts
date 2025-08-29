import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import homeroomRoutes from './routes/homeroom.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/homeroom', homeroomRoutes);

app.listen(5008, () => {
  console.log('Homeroom service is running on port 5008');
});