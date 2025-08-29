// Path: class-content-service/src/routes/class.routes.ts

import { Router } from 'express';
import {
    createClass,
    updateClass,
    deleteClass,
    getAllClasses,
    getTeacherClasses,
    getStudentClasses,
    getClassById,
    enrolInClass,
    createTopicForClass,
    checkIsHomeroomTeacher
} from '../controllers/class.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Rute untuk mendapatkan semua kelas (ringkas) & kelas yang diikuti siswa
router.get('/all', authenticate, getAllClasses);
router.get('/student', authenticate, checkRole('siswa'), getStudentClasses);

// Rute untuk guru mendapatkan kelas yang diajarnya
router.get('/teacher', authenticate, checkRole(['guru', 'wali_kelas']), getTeacherClasses);

// Rute untuk memeriksa status wali kelas (digunakan oleh user-service)
router.get('/homeroom-check/:teacherId', checkIsHomeroomTeacher);

// Rute CRUD untuk Kelas
router.get('/:id', authenticate, getClassById);
router.post('/:id/enroll', authenticate, checkRole('siswa'), enrolInClass);
router.post('/:id/topics', authenticate, checkRole(['guru', 'wali_kelas', 'admin']), createTopicForClass);

// --- PERBAIKAN DI SINI ---
// Pastikan rute POST untuk membuat kelas mengizinkan 'admin' dan 'guru'
router.post('/', authenticate, upload.single('image'), checkRole(['admin', 'guru']), createClass);
router.put('/:id', authenticate, checkRole(['admin', 'guru']), updateClass);
router.delete('/:id', authenticate, checkRole(['admin', 'guru']), deleteClass);

export default router;