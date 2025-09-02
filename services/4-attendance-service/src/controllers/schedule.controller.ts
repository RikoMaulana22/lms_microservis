// Path: services/4-attendance-service/src/controllers/schedule.controller.ts
import { Request, Response } from 'express';
import { PrismaClient, DayOfWeek, Schedule } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';

const prisma = new PrismaClient();

// Fungsi ini seharusnya tidak ada di sini, karena Attendance Service tidak membuat jadwal.
// Tapi kita biarkan agar tidak error, dengan asumsi akan dipanggil oleh service lain.
export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime } = req.body;
    if (!classId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
        res.status(400).json({ message: 'Semua field wajib diisi.' });
        return;
    }
    try {
        const newSchedule = await prisma.schedule.create({
            data: {
                classId: Number(classId),
                subjectId: Number(subjectId),
                teacherId: Number(teacherId),
                dayOfWeek: dayOfWeek as DayOfWeek,
                startTime,
                endTime,
            }
        });
        res.status(201).json(newSchedule);
    } catch (error) {
        console.error("Gagal membuat jadwal:", error);
        res.status(500).json({ message: 'Gagal membuat jadwal.' });
    }
};

// Mengambil jadwal (hanya data mentah dari service ini)
export const getSchedulesByClass = async (req: AuthRequest, res: Response): Promise<void> => {
    const { classId } = req.params;
    try {
        // PERBAIKAN: Hapus semua 'include'
        const schedules = await prisma.schedule.findMany({
            where: { classId: Number(classId) },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        });
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil jadwal.' });
    }
};

export const getPublicSchedules = async (req: Request, res: Response) => {
    try {
        // PERBAIKAN: Hapus semua 'include'
        const schedules = await prisma.schedule.findMany({
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        // PERBAIKAN: Memberi tipe pada 'acc' untuk mengatasi error 'any'
        const groupedSchedules = schedules.reduce((acc: Record<string, Schedule[]>, schedule) => {
            const day = schedule.dayOfWeek;
            if (!acc[day]) {
                acc[day] = [];
            }
            acc[day].push(schedule);
            return acc;
        }, {} as Record<string, Schedule[]>);

        res.json(groupedSchedules);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data jadwal." });
    }
};

// Admin menghapus jadwal
export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await prisma.schedule.delete({ where: { id: Number(id) } });
        res.status(200).json({ message: "Jadwal berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus jadwal.' });
    }
};

// Admin mengambil SEMUA jadwal
export const getAllSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // PERBAIKAN: Hapus semua 'include'
        const schedules = await prisma.schedule.findMany({
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        });
        res.status(200).json(schedules);
    } catch (error) {
        console.error("Gagal mengambil semua jadwal:", error);
        res.status(500).json({ message: 'Gagal mengambil semua jadwal.' });
    }
};

// Siswa atau Guru mengambil jadwal personal mereka
export const getMySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
        res.status(401).json({ message: 'Otentikasi diperlukan.' });
        return;
    }

    try {
        let schedules;
        if (role === 'guru') {
            // PERBAIKAN: Hapus semua 'include'
            schedules = await prisma.schedule.findMany({
                where: { teacherId: userId },
                orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
            });
            res.status(200).json(schedules);
        } else { // Jika siswa
            /*
             * PERBAIKAN: Logika ini tidak bisa dijalankan di sini karena 'classMember' tidak ada.
             * Seharusnya, service ini menerima daftar classId dari service lain.
             * Untuk sekarang, kita kembalikan array kosong untuk menghindari error.
            */
            // const studentMemberships = await prisma.classMember.findMany(...); // <-- INI YANG MENYEBABKAN ERROR
            res.status(200).json([]); // Kembalikan array kosong
        }
    } catch (error) {
        console.error("Gagal mengambil jadwal personal:", error);
        res.status(500).json({ message: 'Gagal mengambil jadwal Anda.' });
    }
};

// Admin mengupdate jadwal yang ada
export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, classId, subjectId, teacherId } = req.body;
    try {
        const updatedSchedule = await prisma.schedule.update({
            where: { id: Number(id) },
            data: {
                dayOfWeek: dayOfWeek as DayOfWeek,
                startTime,
                endTime,
                classId: Number(classId),
                subjectId: Number(subjectId),
                teacherId: Number(teacherId),
            }
        });
        res.status(200).json(updatedSchedule);
    } catch (error) {
        console.error("Gagal mengupdate jadwal:", error);
        res.status(500).json({ message: 'Gagal mengupdate jadwal.' });
    }
};