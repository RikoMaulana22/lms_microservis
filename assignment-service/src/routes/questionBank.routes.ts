// assignment-service/src/routes/questionBank.routes.ts

import { Router } from 'express';
import { getQuestionsFromBank, createQuestionInBank } from '../controllers/questionBank.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// Endpoint untuk mengambil semua soal dari bank soal (hanya guru)
router.get('/', authenticate, checkRole('guru'), getQuestionsFromBank);

// Endpoint untuk membuat soal baru di bank soal (hanya guru)
router.post('/', authenticate, checkRole('guru'), createQuestionInBank);

export default router;