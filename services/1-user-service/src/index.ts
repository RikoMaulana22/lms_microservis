// services/1-user-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
// Tambahkan rute lain jika ada, misalnya userRoutes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('User Service is running!');
});

// Daftarkan rute
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 User Service running on http://localhost:${PORT}`);
});