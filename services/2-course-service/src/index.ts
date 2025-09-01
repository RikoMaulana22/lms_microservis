// services/2-course-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // Diperlukan untuk menyajikan file statis

// Impor semua rute yang relevan untuk layanan ini
import classRoutes from './routes/class.routes';
import subjectRoutes from './routes/subject.routes';
import topicRoutes from './routes/topic.routes';
import materialRoutes from './routes/material.routes';

// Muat variabel lingkungan dari file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002; // Port khusus untuk course-service

// Middleware dasar
app.use(cors());
app.use(express.json());

// Middleware untuk menyajikan file yang diunggah (misalnya, gambar sampul kelas)
// Ini mengarahkan permintaan ke /uploads ke folder public/uploads di dalam layanan ini
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));


// Rute health check untuk memastikan layanan berjalan
app.get('/', (req, res) => {
    res.send('Course Service is running!');
});

// Daftarkan semua rute yang telah diimpor dengan prefix API-nya
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/materials', materialRoutes);

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Course Service running on http://localhost:${PORT}`);
});