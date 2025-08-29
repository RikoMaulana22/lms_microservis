import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import classRoutes from './routes/class.routes';
import subjectRoutes from './routes/subject.routes';
import topicRoutes from './routes/topic.routes';
import materialRoutes from './routes/material.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/materials', materialRoutes);

app.listen(5002, () => {
  console.log('Class content service is running on port 5002');
});