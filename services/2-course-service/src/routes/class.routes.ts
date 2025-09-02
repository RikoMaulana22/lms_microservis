import { Router } from 'express';
import { 
    createClass, 
    getTeacherClasses, 
    getClassById, 
    enrolInClass,
    createTopicForClass,
    getStudentClasses,
    getAllClasses,
    deleteClass
} from '../controllers/class.controller';
import { authorize } from 'shared/middlewares/role.middleware'; // <-- PERBAIKAN: Impor 'authorize'
import { authenticate } from 'shared/middlewares/auth.middleware';
import { uploadImage } from 'shared/middlewares/upload.middleware'; // <-- PERBAIKAN: Impor 'uploadImage'

const router = Router();

// Rute untuk Guru
router.get('/teacher', authenticate, authorize('guru'), getTeacherClasses);
router.post(
    '/', 
    authenticate, 
    authorize('guru'), 
    uploadImage().single('image'), // <-- PERBAIKAN: Gunakan uploadImage()
    createClass
);

// Rute untuk Siswa
router.get('/student', authenticate, authorize('siswa'), getStudentClasses);
router.post('/:id/enrol', authenticate, authorize('siswa'), enrolInClass);

// Rute untuk Admin Form
router.get('/all', authenticate, authorize('admin'), getAllClasses);

// Rute Umum (Detail Kelas)
router.get('/:id', authenticate, getClassById);

// Rute untuk mengelola topik
router.post('/:id/topics', authenticate, authorize('guru'), createTopicForClass);

// Rute untuk menghapus kelas
router.delete('/:id', authenticate, authorize('guru'), deleteClass);

export default router;