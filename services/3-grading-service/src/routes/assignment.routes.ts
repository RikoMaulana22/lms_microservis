// Path: server/src/routes/assignment.routes.ts
import { Router } from 'express';
// PERUBAHAN: Impor fungsi controller yang baru
import { createAssignmentForTopic, getAssignmentsForTopic, getAssignmentById, 
        getMyAssignments, updateAssignment,getAssignmentSubmissions,gradeSubmission,
        getSubmissionForReview, submitAssignment } from '../controllers/assignment.controller';
import { authorize } from 'shared/middlewares/role.middleware';
import { authenticate} from 'shared/middlewares/auth.middleware';


const router = Router();
router.get('/submissions/review/:id', authenticate, getSubmissionForReview);

router.get('/my', authenticate, getMyAssignments);
router.get('/topic/:topicId', authenticate, getAssignmentsForTopic);
router.post('/topic/:topicId', authenticate, authorize('guru'), createAssignmentForTopic);
router.put('/:id', authenticate, authorize('guru'), updateAssignment);
router.get('/:id/submissions', authenticate, authorize('guru'), getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', authenticate, authorize('guru'), gradeSubmission);
router.get('/:id', authenticate, getAssignmentById);

router.post('/submissions/assignment/:assignmentId', authenticate, authorize('siswa'), submitAssignment);


export default router;