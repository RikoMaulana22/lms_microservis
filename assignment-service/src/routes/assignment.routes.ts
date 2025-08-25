// Path: assignment-service/src/routes/assignment.routes.ts

import { Router } from 'express';
import {
    createAssignmentFromBank,
    getAssignmentsForTopic,
    getAssignmentById,
    getAssignmentSubmissions,
    submitAssignment,
    getSubmissionForReview,
} from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// Rute BARU dan BERSIH
router.post('/topic/:topicId/from-bank', authenticate, checkRole('guru'), createAssignmentFromBank);
router.get('/topic/:topicId', authenticate, getAssignmentsForTopic);
router.get('/:id', authenticate, getAssignmentById);
router.get('/:id/submissions', authenticate, checkRole('guru'), getAssignmentSubmissions); // Untuk guru
router.post('/:assignmentId/submit', authenticate, checkRole('siswa'), submitAssignment);
router.get('/submission/:id/review', authenticate, getSubmissionForReview); // Untuk siswa

export default router;