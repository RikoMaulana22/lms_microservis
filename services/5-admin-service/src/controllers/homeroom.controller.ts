// Path: server/src/controllers/homeroom.controller.ts

import { Response } from 'express';
// PERBAIKAN: Path impor salah, seharusnya ke 'shared'
import { AuthRequest } from 'shared/middlewares/auth.middleware'; 
import axios from 'axios'; // Diperlukan untuk komunikasi antar-service

// Definisikan base URL untuk service lain (sebaiknya dari .env)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:4002';
const GRADING_SERVICE_URL = process.env.GRADING_SERVICE_URL || 'http://grading-service:4003';
const ATTENDANCE_SERVICE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://attendance-service:4004';

// ===================================================================
// CATATAN PENTING:
// Fungsionalitas Wali Kelas (Homeroom) sangat bergantung pada data dari
// berbagai service. Controller ini bertindak sebagai agregator, memanggil
// service lain untuk mengumpulkan data.
// ===================================================================

export const getHomeroomDashboard = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId;
    try {
        // Logika ini sangat kompleks dan memerlukan agregasi data dari semua service.
        // Cara terbaik adalah membuat endpoint khusus di service yang relevan atau
        // service agregator baru. Untuk saat ini, kita akan memanggil beberapa endpoint.

        // 1. Dapatkan kelas yang diampu dari Course Service
        const classResponse = await axios.get(`${COURSE_SERVICE_URL}/api/classes/homeroom-details/${teacherId}`);
        const homeroomClass = classResponse.data;

        if (!homeroomClass) {
            return res.status(404).json({ message: 'Anda tidak ditugaskan sebagai wali kelas.' });
        }
        
        const studentIds = homeroomClass.members.map((member: { user: { id: number } }) => member.user.id);

        if (studentIds.length === 0) {
            return res.json({ ...homeroomClass, dailyAttendances: [] });
        }
        
        // 2. Dapatkan rekap absensi dari Attendance Service
        const attendanceResponse = await axios.get(`${ATTENDANCE_SERVICE_URL}/api/attendance/recap/students?studentIds=${studentIds.join(',')}`);
        const combinedAttendances = attendanceResponse.data;
        
        const responseData = {
            ...homeroomClass,
            dailyAttendances: combinedAttendances
        };

        res.json(responseData);
    } catch (error) {
        console.error("Error getHomeroomDashboard:", error);
        res.status(500).json({ message: 'Gagal memuat data dashboard.' });
    }
};

export const addHomeroomNote = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId;
    try {
        // Logika ini seharusnya ada di Course Service karena menyangkut data kelas dan siswa
        const response = await axios.post(`${COURSE_SERVICE_URL}/api/notes/homeroom`, {
            ...req.body,
            authorId: teacherId
        });
        res.status(201).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal menyimpan catatan.' });
    }
};

export const getStudentDetailsForHomeroom = async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    const teacherId = req.user?.userId;
    try {
        // 1. Validasi Wali Kelas via Course Service
        await axios.get(`${COURSE_SERVICE_URL}/api/students/${studentId}/validate-homeroom/${teacherId}`);

        // 2. Ambil data nilai dari Grading Service
        const gradesPromise = axios.get(`${GRADING_SERVICE_URL}/api/grades/student/${studentId}`);
        
        // 3. Ambil data absensi dari Attendance Service
        const attendancePromise = await axios.get(`${ATTENDANCE_SERVICE_URL}/api/attendance/student/${studentId}`);

        const [gradesResponse, attendanceResponse] = await Promise.all([gradesPromise, attendancePromise]);

        res.json({
            dailyAttendances: attendanceResponse.data,
            grades: gradesResponse.data
        });

    } catch (error: any) {
        console.error("Gagal mengambil detail siswa:", error);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal mengambil detail siswa.' });
    }
};

export const updateStudentAttendance = async (req: AuthRequest, res: Response) => {
    try {
        // Forward request ke Attendance Service
        const { attendanceId } = req.params;
        const response = await axios.put(`${ATTENDANCE_SERVICE_URL}/api/daily-attendance/${attendanceId}`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui absensi.' });
    }
};

export const deleteStudentAttendance = async (req: AuthRequest, res: Response) => {
    try {
        // Forward request ke Attendance Service
        const { attendanceId } = req.params;
        const response = await axios.delete(`${ATTENDANCE_SERVICE_URL}/api/daily-attendance/${attendanceId}`);
        res.status(200).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal menghapus catatan absensi.' });
    }
};

export const updateStudentGrade = async (req: AuthRequest, res: Response) => {
    try {
        // Forward request ke Grading Service
        const { gradeId } = req.params;
        const response = await axios.put(`${GRADING_SERVICE_URL}/api/grades/${gradeId}`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui nilai.' });
    }
};