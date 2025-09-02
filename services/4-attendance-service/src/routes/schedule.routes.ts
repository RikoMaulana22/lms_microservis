import { Router } from 'express';
import { 
    createSchedule, 
    getAllSchedules, 
    getMySchedule, 
    deleteSchedule, 
    updateSchedule,
    getPublicSchedules 
} from '../controllers/schedule.controller';
import { authenticate } from 'shared/middlewares/auth.middleware'; 
import { authorize } from 'shared/middlewares/role.middleware';

const router = Router();

// --- PERBAIKI RUTE ADMIN DENGAN MENAMBAHKAN 'authenticate' ---
router.get('/', authenticate, authorize('admin'), getAllSchedules);
router.post('/', authenticate, authorize('admin'), createSchedule);
router.put('/:id', authenticate, authorize('admin'), updateSchedule);
router.delete('/:id', authenticate, authorize('admin'), deleteSchedule);

// --- Rute untuk Siswa & Guru (Perlu 'authenticate') ---
router.get('/my', authenticate, getMySchedule);

// --- Rute Publik (Sudah Benar, tidak perlu 'authenticate') ---
router.get('/public', getPublicSchedules);

export default router;