// Path: homeroom-service/src/routes/homeroom.routes.ts
import { Router } from 'express';
import {
    getHomeroomDashboard,
    addHomeroomNote,
    getStudentDetailsForHomeroom,
} from '../controllers/homeroom.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// Rute Wali Kelas
// PERBAIKAN: Gunakan string biasa 'HOMEROOM_TEACHER', bukan enum
router.get('/dashboard', authenticate, checkRole('HOMEROOM_TEACHER'), getHomeroomDashboard);
router.post('/notes', authenticate, checkRole('HOMEROOM_TEACHER'), addHomeroomNote);
router.get('/students/:studentId/details', authenticate, checkRole('HOMEROOM_TEACHER'), getStudentDetailsForHomeroom);

export default router;