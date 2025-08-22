// Path: admin-service/src/routes/admin.routes.ts

import { Router } from 'express';
// --- Impor semua fungsi dari controller admin ---
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getGlobalMaterialsAdmin,
    uploadGlobalMaterial,
    deleteGlobalMaterial,
    getAttendanceReport,
    getGradeReport,
    assignHomeroomTeacher,
    getAllClasses,
    getAvailableClassesForHomeroom,
    getAllTeachers,
    getAllSubjects,
    createClass,
    getClassEnrollments,
    enrollStudent,
    unenrollStudent,
    bulkCreateUsers,
    deleteClass,
    testGetAllWaliKelas,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';
import { getSettings, updateSettings } from '../controllers/setting.controller';


const router = Router();

// =========================================================================================
//  PERBAIKAN: JANGAN LETAKKAN RUTE LOGIN DI SINI. RUTE LOGIN ADALAH RUTE PUBLIK.
//  Rute login sudah benar ada di file auth.routes.ts
// =========================================================================================

// ===================================
//  RUTE MANAJEMEN PENGGUNA
// ===================================

// GET /api/admin/users
router.get('/users', authenticate, checkRole('admin'), getUsers);

// Rute manajemen pengguna lainnya
router.post('/users', authenticate, checkRole('admin'), createUser);
router.put('/users/:id', authenticate, checkRole('admin'), updateUser);
router.delete('/users/:id', authenticate, checkRole('admin'), deleteUser);
router.post('/users/bulk', authenticate, checkRole('admin'), upload.single('file'), bulkCreateUsers);

// ===================================
//  RUTE MANAJEMEN KELAS
// ===================================

// Rute manajemen kelas (duplicate dihapus)
router.get('/classes', authenticate, checkRole('admin'), getAllClasses);
router.post('/classes', authenticate, checkRole('admin'), createClass);
router.delete('/classes/:id', authenticate, checkRole('admin'), deleteClass);
router.get('/classes/available-for-homeroom', authenticate, checkRole('admin'), getAvailableClassesForHomeroom);
router.get('/teachers', authenticate, checkRole('admin'), getAllTeachers);
router.get('/subjects', authenticate, checkRole('admin'), getAllSubjects);

// Rute untuk menetapkan wali kelas (perbaikan: rute ganda dihapus, middleware ditambahkan)
router.put('/classes/:classId/assign-homeroom', authenticate, checkRole('admin'), assignHomeroomTeacher);
router.put('/classes/:classId/homeroom', authenticate, checkRole('admin'), assignHomeroomTeacher);

// Rute manajemen pendaftaran siswa (enrollment)
router.get('/classes/:classId/enrollments', authenticate, checkRole('admin'), getClassEnrollments);
router.post('/classes/:classId/enrollments', authenticate, checkRole('admin'), enrollStudent);
router.delete('/classes/:classId/enrollments/:studentId', authenticate, checkRole('admin'), unenrollStudent);

// ===================================
//  RUTE MATERI GLOBAL DAN LAPORAN
// ===================================

router.get('/materials/global', authenticate, checkRole('admin'), getGlobalMaterialsAdmin);
router.post('/materials/global', authenticate, checkRole('admin'), upload.single('file'), uploadGlobalMaterial);
router.delete('/materials/global/:id', authenticate, checkRole('admin'), deleteGlobalMaterial);

router.get('/reports/attendance', authenticate, checkRole('admin'), getAttendanceReport);
router.get('/reports/grades', authenticate, checkRole('admin'), getGradeReport);

// ===================================
//  RUTE TES
// ===================================

router.get('/test/walikelas', testGetAllWaliKelas);

//==================================
//setting
//==================================
router.get('/settings', getSettings); // Endpoint ini tidak perlu otentikasi
router.put('/settings', authenticate, checkRole('admin'), updateSettings);

export default router;