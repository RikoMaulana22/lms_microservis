// Path: server/src/controllers/class.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';
import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4001/api';
const GRADING_SERVICE_URL = process.env.GRADING_SERVICE_URL || 'http://localhost:4003/api';
const teacherResponse = await axios.get(`${USER_SERVICE_URL}/users/${classData.teacherId}`);

const prisma = new PrismaClient();

// --- TIDAK ADA PERUBAHAN PADA FUNGSI INI ---
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, subjectId } = req.body;
        const teacherId = req.user?.userId;

        // --- PERBAIKAN DI SINI ---
        // Hapus 'public' dari path sebelum disimpan ke database
        const imageUrl = req.file ? req.file.path.replace('public', '').replace(/\\/g, '/') : null;

        if (!name || !subjectId || !teacherId) {
            res.status(400).json({ message: 'Nama kelas, ID mata pelajaran, dan ID guru wajib diisi.' });
            return;
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                description,
                teacherId,
                subjectId: Number(subjectId),
                imageUrl: imageUrl, // Path yang disimpan sekarang lebih bersih (misal: /uploads/materials/...)
            }
        });
        res.status(201).json(newClass);
    } catch (error) {
        // ... (blok catch tidak berubah)
        console.error("Gagal membuat kelas:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            res.status(400).json({ message: 'ID Mata Pelajaran tidak valid.' });
            return;
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat membuat kelas.' });
    }
};

// --- TIDAK ADA PERUBAHAN PADA FUNGSI INI ---
export const getTeacherClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user?.userId;
        if (!teacherId) {
            res.status(401).json({ message: 'Otentikasi guru diperlukan.' });
            return;
        }
        const classes = await prisma.class.findMany({
            where: { teacherId },
            select: { // <-- Ubah dari include menjadi select
                id: true,
                name: true,
                imageUrl: true, // <-- TAMBAHKAN INI
                subject: true,
                _count: {
                    select: { members: true }
                }
            }
        });
        res.status(200).json(classes);
    } catch (error) {
        console.error("Gagal mengambil data kelas:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data kelas.' });
    }
};

// --- PERBAIKAN PADA FUNGSI INI ---
// GANTIKAN FUNGSI LAMA DENGAN VERSI BARU INI
// Path: server/src/controllers/class.controller.ts

export const getClassById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // 1. Ambil data inti dari database Course Service
        const classData = await prisma.class.findUnique({
            where: { id: Number(id) },
            include: {
                subject: true,
                topics: { orderBy: { order: 'asc' } },
                members: { where: { studentId: userId } }, // Hanya cek untuk user saat ini
            },
        });

        if (!classData) {
            res.status(404).json({ message: "Kelas tidak ditemukan" });
            return;
        }
        
        // Simpan token untuk meneruskan autentikasi
        const authToken = req.headers['authorization'];

        // 2. Panggil API ke layanan lain secara paralel untuk efisiensi
        const [teacherResponse, progressResponse] = await Promise.all([
            // Panggil User Service untuk data guru
            axios.get(`${USER_SERVICE_URL}/users/${classData.teacherId}`, {
                 headers: { Authorization: authToken }
            }),

            // Panggil Grading Service untuk data tugas dan progres siswa
            axios.get(`${GRADING_SERVICE_URL}/progress/by-topics`, {
                params: { topicIds: classData.topics.map(t => t.id).join(',') },
                headers: { Authorization: authToken }
            })
        ]);

        const teacherData = teacherResponse.data;
        const assignmentsWithProgress = progressResponse.data;

        // 3. Gabungkan semua data
        const processedTopics = classData.topics.map(topic => {
            // Cocokkan tugas yang diterima dari grading-service dengan topiknya
            const assignmentsForTopic = assignmentsWithProgress.filter(
                (assignment: any) => assignment.topicId === topic.id
            );
            return { ...topic, assignments: assignmentsForTopic };
        });

        // 4. Tentukan status pendaftaran (enrollment)
        const isEnrolled = classData.members.length > 0 || classData.teacherId === userId;

        // 5. Buat objek respons akhir
        const { members, ...classInfo } = classData;
        const responseData = {
            ...classInfo,
            topics: processedTopics,
            teacher: teacherData,
            isEnrolled,
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Gagal mengambil detail kelas:", error);
        res.status(500).json({ message: 'Gagal mengambil detail kelas.' });
    }
};

// --- TIDAK ADA PERUBAHAN PADA FUNGSI INI ---
export const enrolInClass = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: classId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
        res.status(401).json({ message: "Otentikasi diperlukan." });
        return;
    }
    try {
        const existingMembership = await prisma.class_Members.findUnique({
            where: {
                studentId_classId: {
                    studentId,
                    classId: Number(classId)
                }
            }
        });

        if (existingMembership) {
            res.status(409).json({ message: "Anda sudah terdaftar di kelas ini." });
            return;
        }

        await prisma.class_Members.create({
            data: {
                studentId,
                classId: Number(classId)
            }
        });
        
        res.status(201).json({ message: "Pendaftaran berhasil!" });
    } catch (error) {
        console.error("Gagal mendaftar ke kelas:", error);
        res.status(500).json({ message: "Gagal mendaftar ke kelas" });
    }
};


// --- FIX DI SINI: FUNGSI DITAMBAHKAN NAMUN MEMBUTUHKAN PERBAIKAN SKEMA PRISMA ---
// Fungsi ini untuk membuat Topik/Pertemuan baru di dalam sebuah kelas.
export const createTopicForClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: classId } = req.params;
        const { title, order } = req.body;

        if (!title || order === undefined) {
            res.status(400).json({ message: "Judul topik dan urutan wajib diisi." });
            return;
        }

        // PERHATIAN: Baris di bawah ini akan menyebabkan error jika model 'Topic' tidak ada di schema.prisma.
        // Pastikan Anda telah menambahkan model 'Topic' dan menjalankan 'npx prisma generate'.
        const newTopic = await prisma.topic.create({
            data: {
                title,
                order: Number(order),
                classId: Number(classId),
            }
        });
        res.status(201).json(newTopic);
    } catch (error) {
        // Galat ini kemungkinan besar terjadi karena 'prisma.topic' tidak ada.
        console.error("Gagal membuat topik:", error);
        res.status(500).json({ message: 'Gagal membuat topik. Pastikan model Topic ada di skema database.' });
    }
};

export const getAllClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                name: true
            },
            orderBy: { name: 'asc' }
        });
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil daftar kelas." });
    }
};

// GANTIKAN FUNGSI LAMA DENGAN VERSI BARU INI
export const getStudentClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId; // Gunakan ID siswa dari token

        if (!studentId) {
            res.status(403).json({ message: "User tidak terautentikasi." });
            return;
        }

        const classes = await prisma.class.findMany({
            where: {
                members: {      // Cari di dalam tabel relasi Class_Members
                    some: {
                        studentId: studentId,
                    },
                },
            },
            include: {
                subject: true,
                _count: {
                    select: { members: true },
                },
            },
        });

        res.status(200).json(classes);
    } catch (error) {
        console.error("Gagal mengambil kelas siswa:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.class.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus kelas:', error);
    res.status(500).json({ message: 'Gagal menghapus kelas', error });
  }
};