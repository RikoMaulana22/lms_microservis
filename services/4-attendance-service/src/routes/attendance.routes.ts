import { Router } from 'express';
import { createAttendance, markAttendanceRecord, getAttendanceDetails  } from '../controllers/attendance.controller';
import {  authorize } from 'shared/middlewares/role.middleware';
import { authenticate } from 'shared/middlewares/auth.middleware'; // <-- TAMBAHKAN IMPOR
import { uploadFile } from 'shared/middlewares/upload.middleware'; // Impor middleware upload


const router = Router();

router.post('/topic/:topicId', authenticate, authorize('guru'), createAttendance);
router.get('/:id', authenticate, getAttendanceDetails);
router.post('/:id/record', authenticate, authorize('siswa'), uploadFile().single('proof'), markAttendanceRecord);




export default router;