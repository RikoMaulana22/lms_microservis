// Path: admin-service/src/routes/admin.routes.ts

import { Router } from 'express';
import {
    getAllUsers, createUser, updateUser, deleteUser, bulkCreateUsers,
    getAllClasses, createClass, updateClass, deleteClass, getAvailableClassesForHomeroom,
    assignHomeroomTeacher, getClassEnrollments, enrollStudent, unenrollStudent,
    getAllSubjects,
    getAllTeachers,
    getGlobalMaterialsAdmin, uploadGlobalMaterial, deleteGlobalMaterial,
    getAttendanceReport, getGradeReport,
    getAllSchedules, createSchedule,
    forwardToAnnouncementService,
    testGetAllWaliKelas,
    createSubject,
    deleteSubject
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// MANAJEMEN PENGGUNA (HANYA UNTUK ADMIN)
router.get('/users', authenticate, checkRole('admin'), getAllUsers);
router.post('/users', authenticate, checkRole('admin'), createUser);
router.put('/users/:id', authenticate, checkRole('admin'), updateUser);
router.delete('/users/:id', authenticate, checkRole('admin'), deleteUser);
router.post('/users/bulk', authenticate, checkRole('admin'), upload.single('file'), bulkCreateUsers);

// MANAJEMEN KELAS & TERKAIT
router.get('/classes', authenticate, checkRole('admin'), getAllClasses);
router.post('/classes', authenticate, checkRole('admin'), upload.single('image'), createClass);
router.put('/classes/:id', authenticate, checkRole('admin'), upload.single('image'), updateClass);
router.delete('/classes/:id', authenticate, checkRole('admin'), deleteClass);
router.get('/classes/available-for-homeroom', authenticate, checkRole('admin'), getAvailableClassesForHomeroom);
router.put('/classes/:classId/assign-homeroom', authenticate, checkRole('admin'), assignHomeroomTeacher);
router.post('/subjects', authenticate, checkRole('admin'), createSubject);
router.delete('/subjects/:id', authenticate, checkRole('admin'), deleteSubject);

// MANAJEMEN PENDAFTARAN KELAS
router.get('/classes/:classId/enrollments', authenticate, checkRole('admin'), getClassEnrollments);
router.post('/classes/:classId/enrollments', authenticate, checkRole('admin'), enrollStudent);
router.delete('/classes/:classId/enrollments/:studentId', authenticate, checkRole('admin'), unenrollStudent);

// DATA PENDUKUNG (GURU & MAPEL)
router.get('/teachers', authenticate, checkRole('admin'), getAllTeachers);
router.get('/subjects', authenticate, checkRole('admin'), getAllSubjects);

// MANAJEMEN JADWAL
router.get('/schedules', authenticate, checkRole('admin'), getAllSchedules);
router.post('/schedules', authenticate, checkRole('admin'), createSchedule);

// MANAJEMEN PENGUMUMAN
router.get('/announcements', authenticate, forwardToAnnouncementService('get'));
router.post('/announcements', authenticate, checkRole('admin'), forwardToAnnouncementService('post'));
router.put('/announcements/:id', authenticate, checkRole('admin'), forwardToAnnouncementService('put'));
router.delete('/announcements/:id', authenticate, checkRole('admin'), forwardToAnnouncementService('delete'));

// MATERI GLOBAL & LAPORAN
router.get('/materials/global', authenticate, checkRole('admin'), getGlobalMaterialsAdmin);
router.post('/materials/global', authenticate, checkRole('admin'), upload.single('file'), uploadGlobalMaterial);
router.delete('/materials/global/:id', authenticate, checkRole('admin'), deleteGlobalMaterial);
router.get('/reports/attendance', authenticate, checkRole('admin'), getAttendanceReport);
router.get('/reports/grades', authenticate, checkRole('admin'), getGradeReport);

// RUTE TES
router.get('/test/walikelas', testGetAllWaliKelas);

export default router;