// homeroom-service/src/index.ts
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import homeroomRoutes from './routes/homeroom.routes';

dotenv.config();
const app: Express = express();
const PORT = Number(process.env.PORT) || 5005;

app.use(cors());
app.use(express.json());
app.use('/api/homeroom', homeroomRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Homeroom Service berjalan di http://localhost:${PORT}`);
});