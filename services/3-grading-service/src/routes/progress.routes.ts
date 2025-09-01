// services/3-grading-service/src/routes/progress.routes.ts
import { Router } from 'express';
import { getAssignmentsAndProgressByTopicIds } from '../controllers/progress.controller';
import { authenticate } from 'shared/middlewares/auth.middleware'; // Sesuaikan path

const router = Router();

router.get('/by-topics', authenticate, getAssignmentsAndProgressByTopicIds);

export default router;