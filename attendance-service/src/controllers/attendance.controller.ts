import { Request,Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios'; // <-- Impor Axios

const prisma = new PrismaClient();

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
        // --- PERBAIKAN #1: Validasi via API Call ---
        // Panggil Class-Content-Service untuk memvalidasi topik dan guru
        const topicResponse = await axios.get(`http://localhost:5002/api/topics/${topicId}/details`);
        const topicData = topicResponse.data;

        if (topicData.class.teacherId !== userId) {
            res.status(403).json({ message: 'Akses ditolak. Anda bukan guru pemilik kelas ini.' });
            return;
        }
        // --- Akhir Perbaikan #1 ---

        const existingAttendance = await prisma.attendance.findFirst({
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
    } catch (error: any) {
        console.error("Gagal membuat sesi absensi:", error);
        if (axios.isAxiosError(error)) {
            // Tangani error jika service lain tidak ditemukan atau merespons dengan error
            return ;
             
        }
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
                records: {
                    orderBy: { timestamp: 'asc' },
                    // --- PERBAIKAN #2: Hanya ambil studentId ---
                    select: {
                        studentId: true, // Ambil ID-nya saja
                        timestamp: true,
                        status: true,
                        notes: true,
                        proofUrl: true,
                    }
                }
            }
        });

        if (!attendanceDetails) {
            res.status(404).json({ message: "Sesi absensi tidak ditemukan." });
            return;
        }
        
        // --- Tambahan: Ambil data siswa dari User-Service ---
        const studentIds = [...new Set(attendanceDetails.records.map(rec => rec.studentId))];
        let studentsMap = new Map();

        if (studentIds.length > 0) {
            const usersResponse = await axios.post('http://localhost:8001/api/users/details', { userIds: studentIds });
            const usersData = usersResponse.data;
            usersData.forEach((user: any) => {
                studentsMap.set(user.id, {
                    id: user.id,
                    fullName: user.fullName,
                    nisn: user.nisn
                });
            });
        }
       
        const recordsWithStudentData = attendanceDetails.records.map(rec => ({
            ...rec,
            student: studentsMap.get(rec.studentId) || { fullName: 'Siswa Tidak Ditemukan', nisn: '' }
        }));

        const responseData = {
            ...attendanceDetails,
            records: recordsWithStudentData
        };
        // --- Akhir Tambahan ---

        res.status(200).json(responseData);
    } catch (error: any) {
        console.error("Gagal mengambil detail absensi:", error);
        if (axios.isAxiosError(error)) {
            return ;
        }
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

        const existingRecord = await prisma.attendanceRecord.findFirst({
            where: {
                studentId: studentId,
                attendanceId: parseInt(attendanceId),
            },
        });

        if (existingRecord) {
            return res.status(409).json({ message: 'Anda sudah mencatat kehadiran untuk sesi ini.' });
        }

        // --- PERBAIKAN #3: Simpan ID secara langsung ---
        const newRecord = await prisma.attendanceRecord.create({
            data: {
                status,
                notes: notes || null,
                proofUrl: proofFile ? proofFile.path.replace('public', '').replace(/\\/g, '/') : null,
                studentId: studentId, // Simpan ID sebagai string
                attendanceId: parseInt(attendanceId), // Simpan ID sebagai integer
            },
        });
        // --- Akhir Perbaikan #3 ---

        res.status(201).json({ message: 'Kehadiran berhasil dicatat!', record: newRecord });

    } catch (error: any) {
        console.error("Gagal mencatat kehadiran:", error);
        res.status(500).json({ message: 'Gagal mencatat kehadiran. Periksa log server.' });
    }
};