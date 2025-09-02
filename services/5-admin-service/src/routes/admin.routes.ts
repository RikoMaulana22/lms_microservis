import { Router } from 'express';
// --- Impor fungsi baru dari controller ---
import { getUsers,
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
    getAvailableClassesForHomeroom ,
    getAllTeachers,
    getAllSubjects,
    createClass,
    getClassEnrollments,
    enrollStudent,
    unenrollStudent,
    bulkCreateUsers,
    deleteClass,
    

    
  } from '../controllers/admin.controller';
import { authenticate } from 'shared/middlewares/auth.middleware'; // Pastikan authenticate diimpor
import { authorize } from 'shared/middlewares/role.middleware';   // Pastikan checkRole diimpor
import { uploadFile } from 'shared/middlewares/upload.middleware'; // Impor middleware upload


const router = Router();


// GET /api/admin/users
router.get('/users', authenticate, authorize('admin'), getUsers);

router.delete('/classes/:id', authenticate, authorize('admin'), deleteClass);


// POST /api/admin/users
router.post('/users', authenticate, authorize('admin'), createUser);

// --- PERBAIKI RUTE UPDATE DAN DELETE DI SINI ---
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

// --- RUTE BARU: Untuk Manajemen Materi Global (Perlu perbaikan) ---
router.get('/materials/global', authenticate, authorize('admin'), getGlobalMaterialsAdmin);
router.post('/materials/global', authenticate, authorize('admin'), uploadFile().single('file'), uploadGlobalMaterial);
router.delete('/materials/global/:id', authenticate, authorize('admin'), deleteGlobalMaterial);
// --- Rute untuk Laporan (Perlu perbaikan) ---
router.get('/reports/attendance', authenticate, authorize('admin'), getAttendanceReport);
router.get('/reports/grades', authenticate, authorize('admin'), getGradeReport);
// --- RUTE BARU UNTUK KELOLA KELAS (Perlu perbaikan) ---
// --- RUTE UNTUK MANAJEMEN KELAS ---
router.get('/classes', authenticate, authorize('admin'), getAllClasses);
router.get('/teachers', authenticate, authorize('admin'), getAllTeachers);
router.get('/subjects', authenticate, authorize('admin'), getAllSubjects);
router.post('/classes', authenticate, authorize('admin'), createClass);
router.get('/classes', authenticate, authorize('admin'), getAllClasses);
router.put('/classes/:classId/assign-homeroom', authenticate, authorize('admin'), assignHomeroomTeacher);
router.get(
    '/classes/available-for-homeroom', 
    authenticate, 
    authorize('admin'), 
    getAvailableClassesForHomeroom
);

// Rute untuk manajemen pendaftaran siswa (enrollment)
router.get('/classes/:classId/enrollments', authenticate, authorize('admin'), getClassEnrollments);
router.post('/classes/:classId/enrollments', authenticate, authorize('admin'), enrollStudent);
router.delete('/classes/:classId/enrollments/:studentId', authenticate, authorize('admin'), unenrollStudent);

router.post('/users/bulk', authenticate, authorize('admin'), uploadFile().single('file'), bulkCreateUsers);

router.put('/classes/:classId/homeroom', assignHomeroomTeacher);




export default router;