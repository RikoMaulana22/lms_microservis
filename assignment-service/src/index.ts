import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import assignmentRoutes from './routes/assignment.routes';
import submissionRoutes from './routes/submission.routes';
import questionBankRoutes from './routes/questionBank.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/question-banks', questionBankRoutes);

app.listen(5003, () => {
  console.log('Assignment service is running on port 5003');
});