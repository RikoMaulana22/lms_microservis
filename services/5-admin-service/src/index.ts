// services/5-admin-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.routes';
import homeroomRoutes from './routes/homeroom.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Admin Service is running!');
});

// Daftarkan rute
app.use('/api/admin', adminRoutes);
app.use('/api/homeroom', homeroomRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Admin Service running on http://localhost:${PORT}`);
});