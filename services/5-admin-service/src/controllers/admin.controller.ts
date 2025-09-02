// services/5-admin-service/src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';
import bcrypt from 'bcrypt';
import Papa from 'papaparse';
import fs from 'fs';
import axios from 'axios'; // Diperlukan untuk komunikasi antar-service

const prisma = new PrismaClient();

// Definisikan tipe Role secara lokal karena tidak ada di skema admin-service
type Role = 'admin' | 'guru' | 'wali_kelas' | 'siswa';

// Definisikan base URL untuk service lain (sebaiknya dari .env)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:4002';
const GRADING_SERVICE_URL = process.env.GRADING_SERVICE_URL || 'http://grading-service:4003';
const ATTENDANCE_SERVICE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://attendance-service:4004';


// =============================================
// MANAJEMEN PENGGUNA (via User Service)
// =============================================

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const response = await axios.get(`${USER_SERVICE_URL}/api/users`, { params: req.query });
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Gagal mengambil data pengguna:`, error);
        res.status(500).json({ message: `Gagal mengambil data pengguna` });
    }
};

export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const response = await axios.post(`${USER_SERVICE_URL}/api/users`, req.body);
        res.status(response.status).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: "Gagal membuat pengguna baru." });
    }
};

export const bulkCreateUsers = async (req: Request, res: Response) => {
    // Fungsi ini sangat kompleks dan seharusnya berada di user-service.
    // Admin service hanya bertugas meneruskan file.
    // Namun, jika harus di sini, logikanya adalah mem-proxy request.
    // Untuk saat ini, kita kembalikan pesan bahwa fungsionalitas ini harus dipindahkan.
    res.status(501).json({ message: "Fungsionalitas bulk create harus diimplementasikan di User Service." });
};


export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const response = await axios.put(`${USER_SERVICE_URL}/api/users/${id}`, req.body);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate pengguna' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const response = await axios.delete(`${USER_SERVICE_URL}/api/users/${id}`, {
             headers: { 'X-User-ID': req.user?.userId?.toString() } // Mengirim ID admin untuk validasi
        });
        res.status(200).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal menghapus pengguna.' });
    }
};

// =============================================
// MANAJEMEN KELAS & MAPEL (via Course Service)
// =============================================

export const getAllClasses = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${COURSE_SERVICE_URL}/api/classes/all`, { params: req.query });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kelas." });
    }
};

export const createClass = async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${COURSE_SERVICE_URL}/api/classes`, req.body);
        res.status(201).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat kelas baru.' });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await axios.delete(`${COURSE_SERVICE_URL}/api/classes/${id}`);
        res.status(200).json(response.data);
    } catch (error: any) {
         res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal menghapus kelas.' });
    }
};

export const getAllSubjects = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${COURSE_SERVICE_URL}/api/subjects`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data mata pelajaran.' });
    }
};

export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${USER_SERVICE_URL}/api/users?role=guru&role=wali_kelas`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data guru.' });
    }
};


// =============================================
// MANAJEMEN WALI KELAS (via Course Service & User Service)
// =============================================

export const assignHomeroomTeacher = async (req: AuthRequest, res: Response) => {
     try {
        const { classId } = req.params;
        const { teacherId } = req.body;
        const response = await axios.put(`${COURSE_SERVICE_URL}/api/classes/${classId}/assign-homeroom`, { teacherId });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Gagal menetapkan wali kelas." });
    }
};

export const getAvailableClassesForHomeroom = async (req: AuthRequest, res: Response) => {
    try {
        const response = await axios.get(`${COURSE_SERVICE_URL}/api/classes/available-for-homeroom`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kelas." });
    }
};

export const getClassEnrollments = async (req: Request, res: Response) => {
    const { classId } = req.params;
    try {
        // Fungsi ini butuh data dari 2 service, jadi kita panggil keduanya
        const classDetailsPromise = axios.get(`${COURSE_SERVICE_URL}/api/classes/${classId}/enrollment-details`);
        const availableTeachersPromise = axios.get(`${USER_SERVICE_URL}/api/users/available-homeroom`);
        
        const [classDetailsRes, availableTeachersRes] = await Promise.all([classDetailsPromise, availableTeachersPromise]);

        res.json({
            classDetails: classDetailsRes.data.classDetails,
            availableStudents: classDetailsRes.data.availableStudents,
            availableTeachers: availableTeachersRes.data
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data pendaftaran.' });
    }
};

export const enrollStudent = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { studentId } = req.body;
        const response = await axios.post(`${COURSE_SERVICE_URL}/api/classes/${classId}/enroll`, { studentId });
        res.status(201).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal mendaftarkan siswa.' });
    }
};

export const unenrollStudent = async (req: Request, res: Response) => {
    try {
        const { classId, studentId } = req.params;
        const response = await axios.delete(`${COURSE_SERVICE_URL}/api/classes/${classId}/unenroll/${studentId}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengeluarkan siswa.' });
    }
};

// =============================================
// MANAJEMEN MATERI GLOBAL (via Course Service)
// =============================================
export const uploadGlobalMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
     // Admin service hanya meneruskan file ke Course Service
    res.status(501).json({ message: "Fungsionalitas ini harus diimplementasikan dengan meneruskan file ke Course Service." });
};

export const getGlobalMaterialsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const response = await axios.get(`${COURSE_SERVICE_URL}/api/materials/global/all`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil materi global.' });
    }
};

export const deleteGlobalMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await axios.delete(`${COURSE_SERVICE_URL}/api/materials/global/${id}`);
        res.status(200).json({ message: 'Materi global berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus materi.' });
    }
};

// =============================================
// LAPORAN (Agregasi dari banyak service)
// =============================================

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Laporan ini kompleks, idealnya ada endpoint khusus di service yang relevan
        // atau service agregator.
        const response = await axios.get(`${ATTENDANCE_SERVICE_URL}/api/reports/attendance`, { params: req.query });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil laporan kehadiran.' });
    }
};

export const getGradeReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const response = await axios.get(`${GRADING_SERVICE_URL}/api/reports/grades`, { params: req.query });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil laporan nilai.' });
    }
};