// services/3-grading-service/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/assignment.routes';
import submissionRoutes from './routes/submission.routes';
import progressRoutes from './routes/progress.routes';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Grading Service is running!');
});

// Daftarkan rute
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/progress', progressRoutes);
app.listen(PORT, () => {
  console.log(`🚀 Grading Service running on http://localhost:${PORT}`);
});