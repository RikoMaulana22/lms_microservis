// services/1-user-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Konfigurasi CORS yang sama seperti di Gateway
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin ini tidak diizinkan oleh kebijakan CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

// Terapkan CORS dan handler preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('User Service is running!');
});

// Daftarkan rute
app.use('/auth', authRoutes);
app.use('/users', userRoutes); 

app.listen(PORT, () => {
  console.log(`🚀 User Service running on http://localhost:${PORT}`);
});