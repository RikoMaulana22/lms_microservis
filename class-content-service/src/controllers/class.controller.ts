// Path: class-content-service/src/controllers/class.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient , Prisma } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

const prisma = new PrismaClient();

// =========================================================================================
//  FUNGSI CRUD UNTUK KELAS (ADMIN & GURU)
// =========================================================================================

/**
 * Membuat kelas baru. Bisa dipanggil oleh admin (menyediakan teacherId di body) 
 * atau oleh guru (teacherId diambil dari token otentikasi).
 */
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, subjectId, teacherId: teacherIdFromForm } = req.body;
        
        let teacherId: number;

        // --- PERBAIKAN LOGIKA PERAN ADMIN ---
        if (req.user?.role === 'admin') {
            // Jika admin, gunakan teacherId dari form yang dikirim frontend
            if (!teacherIdFromForm) {
                res.status(400).json({ message: 'Sebagai admin, Anda harus memilih guru pengajar.' });
                return;
            }
            teacherId = Number(teacherIdFromForm);
        } else {
            // Jika bukan admin (misal: guru), gunakan ID dari token miliknya sendiri
            teacherId = req.user?.userId as number;
        }
        // --- AKHIR PERBAIKAN ---

        const imageUrl = req.file ? req.file.path.replace('public', '').replace(/\\/g, '/') : null;

        if (!name || !subjectId || !teacherId) {
            res.status(400).json({ message: 'Nama kelas, mata pelajaran, dan guru pengajar wajib diisi.' });
            return;
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                description,
                teacherId, // teacherId sekarang sudah ditentukan dengan benar
                subjectId: Number(subjectId),
                imageUrl,
            }
        });
        res.status(201).json(newClass);
    } catch (error: unknown) {
        console.error("Gagal membuat kelas:", error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
            res.status(400).json({ message: 'ID Mata Pelajaran atau Guru tidak valid.' });
            return;
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat membuat kelas.' });
    }
};

/**
 * Memperbarui data kelas berdasarkan ID.
 */
export const updateClass = async (req: Request, res: Response) => {
    // 1. Ambil ID kelas dari parameter URL
    const classId = parseInt(req.params.id, 10);

    // 2. Ambil data baru dari body request
    const { name, description, subjectId, teacherId, homeroomTeacherId } = req.body;

    // --- Validasi Input Sederhana ---
    if (isNaN(classId)) {
        return res.status(400).json({ message: "ID Kelas tidak valid." });
    }
    if (!name || !subjectId || !teacherId || !homeroomTeacherId) {
        return res.status(400).json({ message: "Nama, Mata Pelajaran, Guru, dan Wali Kelas wajib diisi." });
    }

    try {
        // 3. Lakukan update ke database menggunakan Prisma
        const updatedClass = await prisma.class.update({
            where: {
                id: classId,
            },
            data: {
                name,
                description,
                // Gunakan 'connect' untuk menghubungkan relasi berdasarkan ID
                subject: {
                    connect: { id: parseInt(subjectId, 10) }
                },
                // ✅ PERBAIKAN: Gunakan nama relasi 'pengajar' dari schema.prisma
                pengajar: {
                    connect: { id: parseInt(teacherId, 10) }
                },
                // ✅ PERBAIKAN: Gunakan nama relasi 'waliKelas' dari schema.prisma
                waliKelas: {
                    connect: { id: parseInt(homeroomTeacherId, 10) }
                }
            },
            // Sertakan juga data relasi dalam respons agar data di frontend update
            include: {
                subject: true,
                // ✅ PERBAIKAN: Sesuaikan juga di blok 'include'
                pengajar: true,
                waliKelas: true,
            },
        });

        // 4. Kirim respons sukses dengan data yang sudah di-update
        res.status(200).json(updatedClass);

    } catch (error) {
        // 5. Penanganan Error (Sangat Penting!)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Error P2025: Data yang ingin di-update tidak ditemukan (misal: ID kelas salah)
            if (error.code === 'P2025') {
                return res.status(404).json({ message: `Kelas dengan ID ${classId} tidak ditemukan.` });
            }
            // Error P2003: Foreign key constraint failed (misal: subjectId atau teacherId tidak ada)
            if (error.code === 'P2003') {
                return res.status(400).json({ message: "ID Mata Pelajaran, Guru, atau Wali Kelas tidak valid." });
            }
        }

        // Untuk error lainnya yang tidak terduga
        console.error("Error updating class:", error);
        res.status(500).json({ message: "Terjadi kesalahan di server." });
    }
};

/**
 * Menghapus kelas berdasarkan ID.
 */
export const deleteClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const membersCount = await prisma.class_Members.count({
            where: { classId: Number(id) },
        });

        if (membersCount > 0) {
            return res.status(400).json({ message: `Tidak dapat menghapus kelas karena masih memiliki ${membersCount} siswa.` });
        }
        
        await prisma.class.delete({
            where: { id: Number(id) },
        });

        res.status(200).json({ message: 'Kelas berhasil dihapus' });
    } catch (error: unknown) {
        console.error(`Gagal menghapus kelas dengan ID ${id}:`, error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
        }
        res.status(500).json({ message: 'Gagal menghapus kelas karena kesalahan server.' });
    }
};

// =========================================================================================
//  FUNGSI UNTUK MENGAMBIL DATA KELAS
// =========================================================================================

/**
 * Mengambil semua kelas (hanya ID dan nama), biasanya untuk dropdown.
 */
export const getAllClasses = async (req: Request, res: Response): Promise<void> => {
    const grade = req.query.grade as string;
    const whereCondition: any = {};

    if (grade) {
        whereCondition.subject = {
            grade: Number(grade)
        };
    }

    try {
        const classes = await prisma.class.findMany({
            where: whereCondition,
            // --- PERBAIKAN DI SINI ---
            // Gunakan 'include' untuk mengambil data relasi yang dibutuhkan frontend
            include: {
                subject: true, 
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.status(200).json(classes);
    } catch (error: unknown) {
        console.error("Gagal mengambil data kelas:", error);
        res.status(500).json({ message: "Gagal mengambil daftar kelas." });
    }
};

/**
 * Mengambil kelas yang diajar oleh guru yang sedang login.
 */
export const getTeacherClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user?.userId;
        if (!teacherId) {
            res.status(401).json({ message: 'Otentikasi guru diperlukan.' });
            return;
        }
        const classes = await prisma.class.findMany({
            where: { teacherId },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                subject: true,
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.status(200).json(classes);
    } catch (error: unknown) {
        console.error("Gagal mengambil data kelas:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data kelas.' });
    }
};

/**
 * Mengambil kelas yang diikuti oleh siswa yang sedang login.
 */
export const getStudentClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            res.status(401).json({ message: 'Otentikasi siswa diperlukan.' });
            return;
        }
        const enrolledClasses = await prisma.class.findMany({
            where: { members: { some: { studentId } } },
            include: { subject: true, _count: { select: { members: true } } },
            orderBy: { name: 'asc' }
        });
        res.status(200).json(enrolledClasses);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengambil data kelas siswa.' });
    }
};

/**
 * Mengambil detail lengkap sebuah kelas berdasarkan ID.
 */
export const getClassById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const classData = await prisma.class.findUnique({
            where: { id: Number(id) },
            include: {
                subject: true,
                topics: {
                    orderBy: { order: 'asc' },
                    include: { materials: true } // Asumsi relasi lain dikelola service lain
                },
                members: { where: { studentId: userId } }
            },
        });

        if (!classData) {
            res.status(404).json({ message: 'Kelas tidak ditemukan.' });
            return;
        }
        
        const isEnrolled = classData.members.length > 0 || classData.teacherId === userId;
        res.status(200).json({ ...classData, isEnrolled });

    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengambil detail kelas.' });
    }
};


// =========================================================================================
//  FUNGSI TERKAIT PENDAFTARAN & TOPIK
// =========================================================================================

/**
 * Mendaftarkan siswa yang sedang login ke sebuah kelas.
 */
export const enrolInClass = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: classId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
        res.status(401).json({ message: "Otentikasi diperlukan." });
        return;
    }
    try {
        await prisma.class_Members.create({
            data: {
                studentId,
                classId: Number(classId)
            }
        });
        res.status(201).json({ message: "Pendaftaran berhasil!" });
    } catch (error: unknown) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: "Anda sudah terdaftar di kelas ini." });
            return;
        }
        console.error("Gagal mendaftar ke kelas:", error);
        res.status(500).json({ message: "Gagal mendaftar ke kelas" });
    }
};

/**
 * Membuat topik baru di dalam sebuah kelas.
 */
export const createTopicForClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: classId } = req.params;
        const { title, order } = req.body;

        if (!title || order === undefined) {
            res.status(400).json({ message: "Judul topik dan urutan wajib diisi." });
            return;
        }

        const newTopic = await prisma.topic.create({
            data: {
                title,
                order: Number(order),
                classId: Number(classId),
            }
        });
        res.status(201).json(newTopic);
    } catch (error: unknown) {
        console.error("Gagal membuat topik:", error);
        res.status(500).json({ message: 'Gagal membuat topik.' });
    }
};

// =========================================================================================
//  FUNGSI UTILITAS
// =========================================================================================

/**
 * Memeriksa apakah seorang guru adalah wali kelas di kelas manapun.
 */
export const checkIsHomeroomTeacher = async (req: Request, res: Response): Promise<void> => {
    try {
        const { teacherId } = req.params;
        const teacherIdAsNumber = parseInt(teacherId, 10);

        if (isNaN(teacherIdAsNumber)) {
            res.status(400).json({ message: "ID Guru tidak valid."});
            return;
        }

        const homeroomClass = await prisma.class.findFirst({
            where: { homeroomTeacherId: teacherIdAsNumber },
        });
        
        res.status(200).json({ isHomeroomTeacher: !!homeroomClass });
    } catch (error) {
        console.error("Gagal memeriksa status wali kelas:", error);
        res.status(500).json({ message: "Gagal memvalidasi status wali kelas." });
    }
};