// Path: assignment-service/src/routes/submission.routes.ts

import { Router } from 'express';
import { 
    createSubmission, 
    getSubmissionsForAssignment, 
    gradeSubmission, 
    getMyGrades,
    getSubmissionReview
} from '../controllers/submission.controller';
import { authenticate } from '../middlewares/auth.middleware';
// PERBAIKAN: Perbaiki jalur impor untuk role.middleware
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

router.post('/assignment/:id', authenticate, checkRole('siswa'), createSubmission);
router.get('/assignment/:id', authenticate, checkRole('guru'), getSubmissionsForAssignment);
router.put('/:id/grade', authenticate, checkRole('guru'), gradeSubmission);
router.get('/my-grades', authenticate, checkRole('siswa'), getMyGrades);
router.get('/review/:id', authenticate, checkRole('siswa'), getSubmissionReview);

export default router;