import { Router } from 'express';
import { getHomeroomDashboard, addHomeroomNote,getStudentDetailsForHomeroom,deleteStudentAttendance,updateStudentAttendance,updateStudentGrade} from '../controllers/homeroom.controller';
import { authenticate } from 'shared/middlewares/auth.middleware';
import { authorize } from 'shared/middlewares/role.middleware';

const router = Router();

// Rute untuk mengambil semua data dashboard wali kelas
router.get('/dashboard', authenticate, authorize(['guru', 'wali_kelas']), getHomeroomDashboard);

// Rute untuk menambah catatan baru untuk siswa
router.post('/notes', authenticate, authorize(['guru', 'wali_kelas']), addHomeroomNote);

// Rute untuk mendapatkan detail lengkap seorang siswa (nilai & absensi)
router.get('/student/:studentId', authenticate, authorize(['guru', 'wali_kelas']), getStudentDetailsForHomeroom);
// Rute untuk memperbarui absensi harian siswa
router.put('/attendance/:attendanceId', authenticate, authorize(['guru', 'wali_kelas']), updateStudentAttendance);
// Rute untuk memperbarui nilai siswa
router.put('/grades/:gradeId', authenticate, authorize(['guru', 'wali_kelas']), updateStudentGrade);
router.delete('/attendance/:attendanceId', authenticate, authorize(['guru', 'wali_kelas']), deleteStudentAttendance);


export default router;