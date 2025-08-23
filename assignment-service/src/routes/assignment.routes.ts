// Path: server/src/routes/assignment.routes.ts
import { Router } from 'express';
// PERUBAHAN: Impor fungsi controller yang baru
import { createAssignmentForTopic, getAssignmentsForTopic, getAssignmentById, 
        getMyAssignments, updateAssignment,getAssignmentSubmissions,gradeSubmission,
        getSubmissionForReview, submitAssignment, createAssignmentFromBank } from '../controllers/assignment.controller';
import { checkRole } from '../middlewares/role.middleware';
import { authenticate} from '../middlewares/auth.middleware';


const router = Router();
router.get('/submissions/review/:id', authenticate, getSubmissionForReview);

router.get('/my', authenticate, getMyAssignments);
router.get('/topic/:topicId', authenticate, getAssignmentsForTopic);
router.post('/topic/:topicId', authenticate, checkRole('guru'), createAssignmentForTopic);
router.put('/:id', authenticate, checkRole('guru'), updateAssignment);
router.get('/:id/submissions', authenticate, checkRole('guru'), getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', authenticate, checkRole('guru'), gradeSubmission);
router.get('/:id', authenticate, getAssignmentById);

router.post('/submissions/assignment/:assignmentId', authenticate, checkRole('siswa'), submitAssignment);
router.post('/topic/:topicId/from-bank', authenticate, checkRole('guru'), createAssignmentFromBank);


export default router;