// Path: schedule-service/src/routes/schedule.routes.ts
import { Router } from 'express';
import { 
    createSchedule, 
    getAllSchedules, 
    getMySchedule, 
    deleteSchedule, 
    updateSchedule,
    getSchedulesByClass,
    getTeachers // <-- Pastikan ini diimpor
} from '../controllers/schedule.controller';
import { authenticate } from '../middlewares/auth.middleware'; 
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// Rute untuk mengambil semua jadwal (untuk tabel di halaman utama)
router.get('/', authenticate, checkRole(['admin', 'wali_kelas']), getAllSchedules);

// Rute untuk mengambil daftar guru (untuk dropdown di form modal)
router.get('/teachers', authenticate, getTeachers);

// Rute CRUD untuk jadwal
router.post('/', authenticate, checkRole('admin'), createSchedule);
router.put('/:id', authenticate, checkRole('admin'), updateSchedule);
router.delete('/:id', authenticate, checkRole('admin'), deleteSchedule);

// Rute untuk pengguna lain
router.get('/my', authenticate, getMySchedule);
router.get('/class/:classId', authenticate, getSchedulesByClass);

export default router;