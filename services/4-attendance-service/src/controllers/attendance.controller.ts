// Path: src/controllers/attendance.controller.ts
import { Response } from 'express';
import { PrismaClient, DailyAttendanceStatus } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';
import axios from 'axios'; // Diperlukan untuk komunikasi antar service

const prisma = new PrismaClient();

// Sebaiknya URL ini disimpan di environment variables
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:4002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4001';


// ==========================
// 📌 Buat Sesi Absensi
// ==========================
export const createAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { topicId } = req.params;
    const { title, openTime, closeTime } = req.body;
    const userId = req.user?.userId;

    if (!title || !openTime || !closeTime) {
        res.status(400).json({ message: 'Judul, waktu buka, dan waktu tutup wajib diisi.' });
        return;
    }

    try {
        /*
         * ARSITEKTUR MICROSERVICE:
         * Verifikasi kepemilikan guru harus dilakukan via API call ke Course Service.
         * 1. Panggil Course Service untuk mendapatkan detail topik.
         * Contoh: const { data: topicDetails } = await axios.get(`${COURSE_SERVICE_URL}/internal/topics/${topicId}`);
         * 2. Bandingkan `topicDetails.class.teacherId` dengan `userId` yang login.
         * if (topicDetails.class.teacherId !== userId) {
         * return res.status(403).json({ message: 'Akses ditolak.' });
         * }
        */
        
        // PERBAIKAN: Hapus query langsung ke prisma.topic
        const existingAttendance = await prisma.attendance.findUnique({
            where: { topicId: parseInt(topicId) }
        });

        if (existingAttendance) {
            res.status(409).json({ message: 'Sesi absensi untuk topik ini sudah ada.' });
            return;
        }

        const newAttendance = await prisma.attendance.create({
            data: {
                title,
                openTime: new Date(openTime),
                closeTime: new Date(closeTime),
                topicId: parseInt(topicId),
            },
        });

        res.status(201).json(newAttendance);
    } catch (error) {
        console.error("Gagal membuat sesi absensi:", error);
        res.status(500).json({ message: 'Gagal membuat sesi absensi.' });
    }
};

// ==========================
// 📌 Detail Sesi Absensi
// ==========================
export const getAttendanceDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const attendanceDetails = await prisma.attendance.findUnique({
            where: { id: parseInt(id) },
            include: {
                // PERBAIKAN: Hapus 'select' untuk relasi 'student'
                records: {
                    orderBy: { timestamp: 'asc' },
                    select: {
                        timestamp: true,
                        status: true,
                        notes: true,
                        proofUrl: true,
                        studentId: true // Ambil ID-nya saja
                    }
                }
            }
        });

        if (!attendanceDetails) {
            res.status(404).json({ message: "Sesi absensi tidak ditemukan." });
            return;
        }

        /*
         * ARSITEKTUR MICROSERVICE:
         * Untuk menampilkan nama siswa, frontend perlu:
         * 1. Kumpulkan semua `studentId` dari `attendanceDetails.records`.
         * 2. Buat panggilan API ke `user-service` untuk mendapatkan detail user.
         * 3. Gabungkan data di sisi frontend.
        */

        res.status(200).json(attendanceDetails);
    } catch (error) {
        console.error("Gagal mengambil detail absensi:", error);
        res.status(500).json({ message: "Gagal mengambil detail absensi." });
    }
};

// ==========================
// 📌 Catat Kehadiran Siswa
// ==========================
export const markAttendanceRecord = async (req: AuthRequest, res: Response) => {
    const { id: attendanceId } = req.params;
    const studentId = req.user?.userId;
    const { status, notes } = req.body;
    const proofFile = req.file;

    if (!studentId) {
        return res.status(401).json({ message: 'Otentikasi diperlukan.' });
    }
    if (!status) {
        return res.status(400).json({ message: 'Status kehadiran wajib diisi.' });
    }

    try {
        const attendanceSession = await prisma.attendance.findUnique({
            where: { id: parseInt(attendanceId) },
        });

        if (!attendanceSession) {
            return res.status(404).json({ message: 'Sesi absensi tidak ditemukan.' });
        }

        const now = new Date();
        if (now < attendanceSession.openTime || now > attendanceSession.closeTime) {
            return res.status(403).json({ message: 'Tidak dapat mengisi absensi di luar waktu yang ditentukan.' });
        }

        const existingRecord = await prisma.attendanceRecord.findUnique({
            where: {
                studentId_attendanceId: { // Menggunakan unique constraint
                    studentId: studentId,
                    attendanceId: parseInt(attendanceId),
                }
            },
        });

        if (existingRecord) {
            return res.status(409).json({ message: 'Anda sudah mencatat kehadiran untuk sesi ini.' });
        }

        // PERBAIKAN: Simpan 'studentId' secara langsung, bukan melalui 'connect'
        const newRecord = await prisma.attendanceRecord.create({
            data: {
                status: status as DailyAttendanceStatus, // Pastikan tipe status sesuai
                notes: notes || null,
                proofUrl: proofFile ? proofFile.path.replace('public', '').replace(/\\/g, '/') : null,
                studentId: studentId,
                attendanceId: parseInt(attendanceId),
            },
        });

        res.status(201).json({ message: 'Kehadiran berhasil dicatat!', record: newRecord });

    } catch (error: any) {
        console.error("Gagal mencatat kehadiran:", error);
        res.status(500).json({ message: 'Gagal mencatat kehadiran. Periksa log server.' });
    }
};