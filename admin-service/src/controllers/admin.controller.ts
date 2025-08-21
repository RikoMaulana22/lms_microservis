// Path: admin-service/src/controllers/admin.controller.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient    } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcrypt';
import Papa from 'papaparse';
import fs from 'fs';
import multer from 'multer';

const prisma = new PrismaClient();

type Role = 'guru' | 'siswa' | 'admin' | 'wali_kelas';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const role = req.query.role as Role;
    const whereCondition: { role?: Role } = {};
    if (role && (role === 'guru' || role === 'siswa')) {
        whereCondition.role = role;
    }
    try {
        const users = await prisma.user.findMany({
            where: whereCondition,
            select: { id: true, username: true, fullName: true, nisn: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(users);
    } catch (error: unknown) {
        console.error(`Gagal mengambil data pengguna:`, error);
        res.status(500).json({ message: `Gagal mengambil data pengguna` });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.setting.findMany();
        const settingsObject = settings.reduce((obj: any, item) => {
            obj[item.key] = item.value;
            return obj;
        }, {});
        res.status(200).json(settingsObject);
    } catch (error) {
        console.error("Gagal mengambil pengaturan:", error);
        res.status(500).json({ message: "Gagal mengambil pengaturan sistem." });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    const settingsToUpdate = req.body;
    try {
        await prisma.$transaction(
            Object.entries(settingsToUpdate).map(([key, value]) =>
                prisma.setting.upsert({
                    where: { key: key },
                    update: { value: value as string },
                    create: { key: key, value: value as string },
                })
            )
        );
        res.status(200).json({ message: "Pengaturan berhasil diperbarui." });
    } catch (error) {
        console.error("Gagal memperbarui pengaturan:", error);
        res.status(500).json({ message: "Gagal memperbarui pengaturan sistem." });
    }
};

export const bulkCreateUsers = async (req: AuthRequest, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File CSV tidak ditemukan.' });
    }
    const { role } = req.body;
    if (!['guru', 'siswa', 'wali_kelas'].includes(role)) {
        return res.status(400).json({ message: 'Peran (role) yang dipilih tidak valid.' });
    }
    const filePath = req.file.path;
    
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const usersToProcess = await new Promise<any[]>((resolve, reject) => {
            const users: any[] = [];
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                step: (result) => {
                    const row = result.data as any;
                    if (!row.username || !row.password || !row.fullName || !row.email) {
                        console.warn('[CSV Import] Melewatkan baris karena data tidak lengkap:', row);
                        return;
                    }
                    users.push(row);
                },
                complete: () => { resolve(users); },
                error: (error: any) => { reject(error); }
            });
        });

        if (usersToProcess.length === 0) {
            return res.status(400).json({ message: 'Tidak ada data valid yang dapat diproses dari file CSV.' });
        }

        await prisma.$transaction(async (tx: any) => {
            for (const row of usersToProcess) {
                const hashedPassword = await bcrypt.hash(row.password, 10);
                const userData: any = {
                    fullName: row.fullName,
                    username: row.username,
                    email: row.email,
                    password: hashedPassword,
                    role: role,
                };
                if (role === 'siswa') {
                    userData.nisn = row.nisn || null;
                }
                const newUser = await tx.user.create({ data: userData });
                if (role === 'wali_kelas' && row.homeroomClassId) {
                    await tx.class.update({
                        where: { id: parseInt(row.homeroomClassId) },
                        data: { homeroomTeacherId: newUser.id }
                    });
                }
            }
        });
        res.status(201).json({ message: `${usersToProcess.length} akun ${role} berhasil dibuat.` });
    } catch (error: unknown) { // Menangani error sebagai tipe 'unknown'
        console.error("Gagal membuat kelas:", error);
        // Lakukan pemeriksaan tipe secara eksplisit
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
            res.status(400).json({ message: 'ID Mata Pelajaran tidak valid.' });
            return;
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat membuat kelas.' });
    } finally {
        fs.unlinkSync(filePath);
    }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const attendanceData = await prisma.class.findMany({
            orderBy: { name: 'asc' },
            select: {
                name: true,
                teacher: { select: { fullName: true } },
                _count: { select: { members: true } },
                topics: {
                    where: { attendance: { isNot: null } },
                    select: {
                        title: true,
                        attendance: {
                            select: {
                                title: true,
                                openTime: true,
                                _count: { select: { records: true } }
                            }
                        }
                    }
                }
            }
        });
        const report = attendanceData.flatMap((cls: any) =>
            cls.topics.map((topic: any) => ({
                className: cls.name,
                teacherName: cls.teacher.fullName,
                totalStudents: cls._count.members,
                topicTitle: topic.title,
                attendanceTitle: topic.attendance!.title,
                studentsPresent: topic.attendance!._count.records,
                openTime: topic.attendance!.openTime,
            }))
        );
        res.status(200).json(report);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengambil laporan kehadiran.' });
    }
};

export const getGradeReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const classesWithAssignments = await prisma.class.findMany({
            include: {
                teacher: { select: { fullName: true } },
                _count: { select: { members: true } },
                topics: {
                    include: {
                        assignments: {
                            include: {
                                _count: { select: { submissions: true } },
                                submissions: {
                                    where: { score: { not: null } },
                                    select: { score: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const report = [];
        for (const cls of classesWithAssignments as any[]) {
            for (const topic of cls.topics as any[]) {
                for (const assignment of topic.assignments as any[]) {
                    const gradedSubmissions = assignment.submissions;
                    let averageScore = 0;
                    if (gradedSubmissions.length > 0) {
                        const totalScore = gradedSubmissions.reduce((sum: number, sub: { score: number | null }) => sum + (sub.score ?? 0), 0);
                        averageScore = totalScore / gradedSubmissions.length;
                    }
                    report.push({
                        className: cls.name,
                        teacherName: cls.teacher.fullName,
                        assignmentTitle: assignment.title,
                        totalSubmissions: assignment._count.submissions,
                        totalStudents: cls._count.members,
                        averageScore: parseFloat(averageScore.toFixed(2)),
                    });
                }
            }
        }
        res.status(200).json(report);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengambil laporan nilai.' });
    }
};

export const createUser = async (req: AuthRequest, res: Response) => {
    const { username, email, password, fullName, role, nisn, homeroomClassId } = req.body;
    if (!username || !email || !password || !fullName || !role) {
        return res.status(400).json({ message: "Field dasar wajib diisi." });
    }
    if (role === 'wali_kelas' && !homeroomClassId) {
        return res.status(400).json({ message: "Silakan pilih kelas untuk wali kelas." });
    }
    try {
        const newUser = await prisma.$transaction(async (tx: any) => {
            const existingUser = await tx.user.findFirst({ where: { OR: [{ username }, { email }] } });
            if (existingUser) {
                throw new Error("Username atau email sudah digunakan.");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const createdUser = await tx.user.create({
                data: {
                    username, email, password: hashedPassword, fullName, role,
                    nisn: role === 'siswa' ? nisn : null,
                }
            });
            if (role === 'wali_kelas' && homeroomClassId) {
                await tx.class.update({
                    where: { id: parseInt(homeroomClassId) },
                    data: { homeroomTeacherId: createdUser.id }
                });
            }
            return createdUser;
        });
        const { password: _, ...userToReturn } = newUser;
        res.status(201).json(userToReturn);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "Username atau email sudah digunakan.") {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: "Gagal membuat pengguna baru." });
    }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { fullName, username, role, nisn, password } = req.body;
    try {
        const dataToUpdate: any = { fullName, username, role, nisn };
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengupdate pengguna' });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const classToDelete = await prisma.class.findUnique({
            where: { id: Number(id) },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });
        if (classToDelete && classToDelete._count.members > 0) {
            return res.status(400).json({
                message: `Gagal menghapus: Kelas masih memiliki ${classToDelete._count.members} siswa terdaftar.`
            });
        }
        await prisma.class.delete({
            where: { id: Number(id) },
        });
        res.status(200).json({ message: 'Kelas berhasil dihapus' });
    } catch (error: unknown) {
        console.error('Gagal menghapus kelas:', error);
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
        }
        res.status(500).json({ message: 'Gagal menghapus kelas karena kesalahan server.' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user?.userId;
    const userIdToDelete = Number(id);
    if (userIdToDelete === adminId) {
        res.status(400).json({ message: "Anda tidak dapat menghapus akun Anda sendiri." });
        return;
    }
    try {
        const teachingClasses = await prisma.class.count({ where: { teacherId: userIdToDelete } });
        if (teachingClasses > 0) {
            res.status(400).json({ message: `Gagal: Pengguna ini masih menjadi guru di ${teachingClasses} kelas.` });
            return;
        }
        const announcements = await prisma.announcement.count({ where: { authorId: userIdToDelete } });
        if (announcements > 0) {
            res.status(400).json({ message: `Gagal: Pengguna ini adalah penulis dari ${announcements} pengumuman.` });
            return;
        }
        const schedules = await prisma.schedule.count({ where: { teacherId: userIdToDelete } });
        if (schedules > 0) {
            res.status(400).json({ message: `Gagal: Pengguna ini masih memiliki ${schedules} jadwal mengajar.` });
            return;
        }
        
        await prisma.user.delete({ where: { id: userIdToDelete } });
        res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal menghapus pengguna.' });
    }
};

export const uploadGlobalMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
    const { title } = req.body;
    if (!req.file || !title) {
        res.status(400).json({ message: 'Judul dan file wajib diisi.' });
        return;
    }
    try {
        const fileUrl = `/uploads/materials/${req.file.filename}`;
        const newMaterial = await prisma.material.create({
            data: { title, fileUrl },
        });
        res.status(201).json(newMaterial);
    } catch (error: unknown) {
        res.status(500).json({ message: "Gagal mengunggah materi." });
    }
};

export const getGlobalMaterialsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const materials = await prisma.material.findMany({
            where: { topic: null },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(materials);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengambil materi global.' });
    }
};

export const deleteGlobalMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await prisma.material.delete({ where: { id: Number(id) } });
        res.status(200).json({ message: 'Materi global berhasil dihapus.' });
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal menghapus materi.' });
    }
};

export const getAvailableClassesForHomeroom = async (req: AuthRequest, res: Response) => {
    try {
        const classes = await prisma.class.findMany({
            where: {
                homeroomTeacherId: null
            },
            select: {
                id: true,
                name: true,
            }
        });
        res.json(classes);
    } catch (error: unknown) {
        res.status(500).json({ message: "Gagal mengambil data kelas." });
    }
};

export const getAllClasses = async (req: Request, res: Response) => {
    const { grade } = req.query;
        let whereClause: any = {};

    if (grade && typeof grade === 'string') {
        whereClause.subject = {
            grade: parseInt(grade, 10)
        };
    }

    try {
        const classes = await prisma.class.findMany({
            where: whereClause,
            include: {
                subject: { select: { name: true, grade: true } },
                teacher: { select: { fullName: true } },
                homeroomTeacher: { select: { fullName: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json(classes);
    } catch (error: unknown) {
        console.error("Gagal mengambil data kelas untuk admin:", error);
        res.status(500).json({ message: "Gagal mengambil data kelas." });
    }
};

export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: { in: ['guru', 'wali_kelas'] } },
            select: { id: true, fullName: true }
        });
        res.json(teachers);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengambil data guru.' });
    }
};

export const getAllSubjects = async (req: Request, res: Response) => {
    try {
        const subjects = await prisma.subject.findMany({
            select: { id: true, name: true }
        });
        res.json(subjects);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengambil data mata pelajaran.' });
    }
};

export const createClass = async (req: Request, res: Response) => {
    const { name, description, subjectId, teacherId } = req.body;
    if (!name || !subjectId || !teacherId) {
        return res.status(400).json({ message: 'Nama kelas, mata pelajaran, dan guru wajib diisi.' });
    }
    try {
        const newClass = await prisma.class.create({
            data: {
                name,
                description,
                subjectId: parseInt(subjectId),
                teacherId: parseInt(teacherId)
            }
        });
        res.status(201).json(newClass);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal membuat kelas baru.' });
    }
};

export const assignHomeroomTeacher = async (req: AuthRequest, res: Response) => {
    const { classId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
        try {
            const updatedClass = await prisma.class.update({
                where: { id: Number(classId) },
                data: {
                    homeroomTeacherId: null
                }
            });
            return res.status(200).json(updatedClass);
        } catch (error: unknown) {
            console.error("Gagal menghapus wali kelas:", error);
            return res.status(500).json({ message: "Gagal menghapus wali kelas." });
        }
    }

    try {
        const teacher = await prisma.user.findFirst({
            where: { id: Number(teacherId), role: 'wali_kelas' }
        });
        
        if (!teacher) {
            return res.status(404).json({ message: "Wali Kelas tidak ditemukan atau ID tidak valid." });
        }

        const updatedClass = await prisma.class.update({
            where: { id: Number(classId) },
            data: {
                homeroomTeacherId: Number(teacherId)
            }
        });
        res.status(200).json(updatedClass);
    } catch (error: unknown) {
        console.error("Gagal menetapkan wali kelas:", error);
        res.status(500).json({ message: "Gagal menetapkan wali kelas." });
    }
};

export const getClassEnrollments = async (req: Request, res: Response) => {
    const { classId } = req.params;
    try {
        const targetClass = await prisma.class.findUnique({
            where: { id: parseInt(classId) },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, fullName: true, nisn: true } }
                    }
                },
                homeroomTeacher: {
                    select: { id: true, fullName: true }
                } 
            }
        });

        if (!targetClass) {
            return res.status(404).json({ message: "Kelas tidak ditemukan." });
        }

        const enrolledStudentIds = targetClass.members.map((m: { studentId: any; }) => m.studentId);
        const availableStudents = await prisma.user.findMany({
            where: {
                role: 'siswa',
                id: { notIn: enrolledStudentIds }
            },
            select: { id: true, fullName: true }
        });

        const assignedHomeroomTeacherIds = (await prisma.class.findMany({
            where: {
                homeroomTeacherId: { not: null },
                id: { not: parseInt(classId) } 
            },
            select: { homeroomTeacherId: true }
        })).map((c: { homeroomTeacherId: any; }) => c.homeroomTeacherId as number);

        const availableTeachers = await prisma.user.findMany({
            where: {
                role: 'wali_kelas',
            },
            select: { id: true, fullName: true },
            orderBy: { fullName: 'asc' }
        });

        res.json({
            classDetails: targetClass,
            availableStudents: availableStudents,
            availableTeachers: availableTeachers
        });

    } catch (error: unknown) {
        console.error("Gagal mengambil data pendaftaran:", error);
        res.status(500).json({ message: 'Gagal mengambil data pendaftaran.' });
    }
};

export const testGetAllWaliKelas = async (req: Request, res: Response) => {
    console.log("--- MENJALANKAN TES: Mencari semua user dengan role 'wali_kelas' ---");
    try {
        const allWaliKelas = await prisma.user.findMany({
            where: {
                role: 'wali_kelas'
            }
        });
        console.log("--- HASIL TES ---");
        console.log(allWaliKelas);
        
        res.status(200).json({
            message: "Hasil tes pencarian 'wali_kelas'. Cek terminal backend Anda untuk detail.",
            count: allWaliKelas.length,
            data: allWaliKelas
        });

    } catch (error: unknown) {
        res.status(500).json({ message: 'Tes gagal', error });
    }
};

export const enrollStudent = async (req: Request, res: Response) => {
    const { classId } = req.params;
    const { studentId } = req.body;
    try {
        await prisma.class_Members.create({
            data: {
                classId: parseInt(classId),
                studentId: parseInt(studentId),
            }
        });
        res.status(201).json({ message: 'Siswa berhasil didaftarkan.' });
    } catch (error: unknown) {
        res.status(409).json({ message: 'Siswa sudah terdaftar di kelas ini.' });
    }
};

export const unenrollStudent = async (req: Request, res: Response) => {
    const { classId, studentId } = req.params;
    try {
        await prisma.class_Members.delete({
            where: {
                studentId_classId: {
                    studentId: parseInt(studentId),
                    classId: parseInt(classId),
                }
            }
        });
        res.status(200).json({ message: 'Siswa berhasil dikeluarkan.' });
    } catch (error: unknown) {
        res.status(500).json({ message: 'Gagal mengeluarkan siswa.' });
    }
};