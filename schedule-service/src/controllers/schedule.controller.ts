// Path: schedule-service/src/controllers/schedule.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';

const prisma = new PrismaClient();
type DayOfWeek = 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU' | 'MINGGU';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

const getForwardingHeaders = (req: Request) => {
    return { headers: { Authorization: req.headers.authorization || '' } };
};


export const getTeachers = async (req: Request, res: Response) => {
    if (!USER_SERVICE_URL) {
        return res.status(500).json({ message: 'URL User service tidak terkonfigurasi.' });
    }
    try {
        // Asumsi: user-service memiliki endpoint '/api/users/teachers' untuk mengambil semua guru
        const response = await axios.get(`${USER_SERVICE_URL}/users/teachers`, {
            headers: { Authorization: req.headers.authorization || '' }
        });
        res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Gagal mengambil data guru dari user-service:", error.message);
        res.status(error.response?.status || 500).json(
            error.response?.data || { message: 'Gagal menghubungi user service.' }
        );
    }
};

/**
 * @description Mengambil semua jadwal. (FIXED)
 * Memperbaiki nama relasi Prisma dan mentransformasi output agar sesuai dengan frontend.
 */
export const getAllSchedules = async (req: Request, res: Response) => {
    try {
        const schedulesFromDb = await prisma.schedule.findMany({
            include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        });

        if (schedulesFromDb.length === 0) {
            return res.status(200).json([]);
        }

        const teacherIds = [...new Set(schedulesFromDb.map(s => s.teacherId))];
        
        // PENTING: Ganti `prisma.user` menjadi `prisma.teacher` jika model Anda bernama Teacher.
        const teachers = await prisma.user.findMany({
            where: { id: { in: teacherIds } },
            select: { id: true, fullName: true }
        });

        const teacherMap = new Map(teachers.map(t => [t.id, t]));

        const schedules = schedulesFromDb.map(schedule => ({
            ...schedule,
            teacher: teacherMap.get(schedule.teacherId) || { fullName: 'Guru Tidak Ditemukan' }
        }));

        res.status(200).json(schedules);

    } catch (error: any) {
        console.error("Error fetching all schedules:", error);
        res.status(500).json({ message: 'Gagal mengambil data jadwal dari database.' });
    }
};

/**
 * @description Membuat jadwal baru.
 */
export const createSchedule = async (req: Request, res: Response) => {
    const { dayOfWeek, startTime, endTime, classId, subjectId, teacherId } = req.body;

    // Validasi dasar untuk memastikan semua data ada
    if (!dayOfWeek || !startTime || !endTime || !classId || !subjectId || !teacherId) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    try {
        const newSchedule = await prisma.schedule.create({
            data: {
                dayOfWeek: dayOfWeek as DayOfWeek,
                startTime,
                endTime,
                classId: Number(classId),
                subjectId: Number(subjectId),
                teacherId: Number(teacherId),
            }
        });
        // Kirim respon sukses dengan data yang baru dibuat
        res.status(201).json(newSchedule);
    } catch (error: any) {
        // Log error spesifik dari Prisma di terminal backend
        console.error("Error creating schedule:", error);
        // Kirim pesan error yang lebih informatif ke frontend
        if (error.code === 'P2003') { // Kode error Prisma untuk foreign key constraint
            return res.status(400).json({ message: `Gagal menyimpan: Salah satu ID (Kelas, Mapel, atau Guru) tidak valid.` });
        }
        res.status(500).json({ message: 'Terjadi kesalahan internal saat menyimpan jadwal.' });
    }
};

// --- Sisa fungsi lainnya tetap sama ---

/**
 * @description Mengambil semua user dari User Service.
 */
export const getAllUsers = async (req: Request, res: Response) => {
    if (!USER_SERVICE_URL) {
        return res.status(500).json({ message: 'URL User service tidak terkonfigurasi.' });
    }
    try {
        const response = await axios.get(`${USER_SERVICE_URL}/users`, getForwardingHeaders(req));
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data);
    }
};

/**
 * @description Mengambil jadwal untuk satu kelas spesifik.
 */
export const getSchedulesByClass = async (req: AuthRequest, res: Response) => {
    const { classId } = req.params;
    try {
        // Langkah 1: Ambil jadwal untuk kelas spesifik, tanpa data guru.
        const schedulesFromDb = await prisma.schedule.findMany({
            where: { classId: Number(classId) },
            include: { 
                subject: true,
                class: true // Sertakan juga data kelas jika perlu
            }
        });

        if (schedulesFromDb.length === 0) {
            return res.status(200).json([]);
        }

        // Langkah 2: Kumpulkan ID guru yang unik dari jadwal tersebut.
        const teacherIds = [...new Set(schedulesFromDb.map(s => s.teacherId))];

        // Langkah 3: Ambil data guru yang relevan dalam satu query.
        // Ganti `prisma.user` jika model Anda bernama lain (misal: `prisma.teacher`)
        const teachers = await prisma.user.findMany({
            where: {
                id: { in: teacherIds }
            },
            select: {
                id: true,
                fullName: true
            }
        });

        const teacherMap = new Map(teachers.map(t => [t.id, t]));

        // Langkah 4: Gabungkan data jadwal dengan data guru.
        const schedules = schedulesFromDb.map(schedule => ({
            ...schedule,
            teacher: teacherMap.get(schedule.teacherId) || { fullName: 'N/A' }
        }));

        res.status(200).json(schedules);

    } catch (error) {
        console.error("Error fetching schedules by class:", error);
        res.status(500).json({ message: 'Gagal mengambil jadwal kelas.' });
    }
};

/**
 * @description Mengambil jadwal personal (untuk guru atau siswa).
 */
export const getMySchedule = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    try {
        let schedules;
        if (userRole === 'guru' || userRole === 'wali_kelas') {
            schedules = await prisma.schedule.findMany({ where: { teacherId: userId } });
        } else if (userRole === 'siswa') {
            return res.status(404).json({ message: 'Jadwal siswa belum diimplementasikan.' });
        }
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil jadwal Anda.' });
    }
};

/**
 * @description Mengupdate jadwal.
 */
export const updateSchedule = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const updatedSchedule = await prisma.schedule.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.status(200).json(updatedSchedule);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate jadwal.' });
    }
};

/**
 * @description Menghapus jadwal.
 */
export const deleteSchedule = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.schedule.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus jadwal.' });
    }
};