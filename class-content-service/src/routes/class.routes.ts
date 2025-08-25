// File: class-content-service/src/routes/class.routes.ts

import { Router } from 'express';
import {
    createClass,
    getTeacherClasses,
    getClassById,
    enrolInClass,
    createTopicForClass,
    getStudentClasses,
    getAllClasses,
    deleteClass,
    checkIsHomeroomTeacher
} from '../controllers/class.controller';
import { checkRole } from '../middlewares/role.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Rute untuk Guru
router.get('/teacher', authenticate, checkRole('guru'), getTeacherClasses);
router.post(
    '/',
    authenticate,
    checkRole('guru'),
    upload.single('image'), // Middleware untuk menangani upload gambar
    createClass
);

// Rute untuk Siswa
router.get('/student', authenticate, checkRole('siswa'), getStudentClasses);
router.post('/:id/enrol', authenticate, checkRole('siswa'), enrolInClass);

// Rute untuk Admin
router.get('/all', authenticate, checkRole('admin'), getAllClasses);
router.get('/', authenticate, checkRole('admin'), getAllClasses);

// Rute Umum (bisa diakses siswa dan guru setelah login)
router.get('/:id', authenticate, getClassById);

// Rute untuk mengelola topik (hanya guru)
router.post('/:id/topics', authenticate, checkRole('guru'), createTopicForClass);

// Rute untuk menghapus kelas (hanya guru)
router.delete('/:id', authenticate, checkRole('guru'), deleteClass);

router.get('/homeroom-check/:teacherId', checkIsHomeroomTeacher);

export default router;