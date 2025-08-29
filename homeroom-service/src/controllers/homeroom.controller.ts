// Path: homeroom-service/src/controllers/homeroom.controller.ts

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * @description Mengambil data dasar untuk dashboard wali kelas: info kelas dan daftar ID siswa.
 */
export const getHomeroomDashboard = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId;

    if (!teacherId) {
        return res.status(401).json({ message: "Otentikasi diperlukan." });
    }

    try {
        const homeroomInfo = await prisma.homeroom.findUnique({
            where: { teacherId: Number(teacherId) },
            include: {
                students: {
                    select: { studentId: true }
                }
            }
        });

        if (!homeroomInfo) {
            return res.status(404).json({ message: 'Anda tidak ditugaskan sebagai wali kelas.' });
        }
        
        res.json(homeroomInfo);

    } catch (error: unknown) {
        console.error("Error getHomeroomDashboard:", error);
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Gagal memuat data dashboard.', error: error.message });
        }
        res.status(500).json({ message: 'Terjadi kesalahan tidak diketahui.' });
    }
};

/**
 * @description Mengambil detail data (nilai & absensi) untuk SATU siswa dari service lain.
 */
export const getStudentDetailsForHomeroom = async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    const teacherId = req.user?.userId;

     if (!teacherId) {
        return res.status(401).json({ message: "Otentikasi diperlukan." });
    }

    try {
        const membership = await prisma.homeroomStudent.findFirst({
            where: {
                studentId: Number(studentId),
                homeroom: { teacherId: Number(teacherId) }
            }
        });

        if (!membership) {
            return res.status(403).json({ message: 'Akses ditolak. Anda bukan wali kelas siswa ini.' });
        }

        const gradesPromise = axios.get(`http://localhost:5003/api/submissions/student/${studentId}`);
        const attendancePromise = axios.get(`http://localhost:5008/api/attendances/student/${studentId}`);
        
        const [gradesResponse, attendanceResponse] = await Promise.all([gradesPromise, attendancePromise]);
        
        res.json({
            grades: gradesResponse.data,
            attendances: attendanceResponse.data
        });

    } catch (error: unknown) {
        console.error("Gagal mengambil detail siswa:", error);
        if (axios.isAxiosError(error)) {
            return res.status(502).json({ 
                message: 'Gagal berkomunikasi dengan layanan lain.', 
                serviceError: error.message 
            });
        }
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Gagal mengambil detail siswa.', error: error.message });
        }
        res.status(500).json({ message: 'Terjadi kesalahan tidak diketahui saat mengambil detail siswa.' });
    }
};

/**
 * @description Menambahkan catatan baru untuk seorang siswa oleh wali kelasnya.
 */
export const addHomeroomNote = async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.userId;
    const { content, studentId, type } = req.body;

    if (!teacherId) {
        return res.status(401).json({ message: "Otentikasi diperlukan." });
    }

    try {
        const homeroomInfo = await prisma.homeroom.findUnique({
             where: { teacherId: Number(teacherId) }
        });

        if (!homeroomInfo) {
            return res.status(403).json({ message: 'Akses ditolak. Anda bukan wali kelas.' });
        }

        const newNote = await prisma.studentNote.create({
            data: {
                content,
                studentId: Number(studentId),
                classId: homeroomInfo.classId,
                authorId: Number(teacherId),
                type: type || 'BIMBINGAN_KONSELING',
            }
        });

        res.status(201).json(newNote);
    } catch (error: unknown) {
        console.error("Error addHomeroomNote:", error);
         if (error instanceof Error) {
            return res.status(500).json({ message: 'Gagal menyimpan catatan.', error: error.message });
        }
        res.status(500).json({ message: 'Gagal menyimpan catatan.' });
    }
};