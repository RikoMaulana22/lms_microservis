// Path: admin-service/src/controllers/admin.controller.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcrypt';
import Papa from 'papaparse';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';
import axios from 'axios';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


const prisma = new PrismaClient();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const CLASS_SERVICE_URL = process.env.CLASS_SERVICE_URL;
const SCHEDULE_SERVICE_URL = process.env.SCHEDULE_SERVICE_URL;
const ANNOUNCEMENT_SERVICE_URL = process.env.ANNOUNCEMENT_SERVICE_URL;
const ATTENDANCE_SERVICE_URL = process.env.ATTENDANCE_SERVICE_URL;
const ASSIGNMENT_SERVICE_URL = process.env.ASSIGNMENT_SERVICE_URL;

export const forwardToAnnouncementService = (method: 'get' | 'post' | 'put' | 'delete') => {
    return async (req: Request, res: Response) => {
        const url = `${ANNOUNCEMENT_SERVICE_URL}${req.path.replace('/admin', '')}`;
        try {
            const response = await axios({
                method,
                url,
                data: req.body,
                params: req.query,
                ...getForwardingHeaders(req),
            });
            res.status(response.status).json(response.data);
        } catch (error: any) {
            console.error(`Error forwarding to announcement-service:`, error.response?.data);
            res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
        }
    };
};

const getForwardingHeaders = (req: Request) => {
    return {
        headers: {
            'Authorization': req.headers.authorization,
        },
    };
};

export const updateClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const form = new FormData();

        // Tambahkan semua field teks dari body ke form baru
        for (const key in req.body) {
            form.append(key, req.body[key]);
        }

        // Jika ada file yang diunggah, tambahkan ke form
        if (req.file) {
            const fileBuffer = fs.readFileSync(req.file.path);
            form.append('image', fileBuffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });
        }

        // Dapatkan header dari form-data, termasuk boundary
        const formHeaders = form.getHeaders();
        const customHeaders = {
            ...getForwardingHeaders(req).headers,
            ...formHeaders,
        };

        // Kirim form ke class-service menggunakan metode PUT
        const response = await axios.put(`${CLASS_SERVICE_URL}/classes/${id}`, form, {
            headers: customHeaders,
        });

        // Hapus file sementara setelah berhasil diteruskan
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json(response.data);

    } catch (error: any) {
        // Hapus file sementara jika terjadi error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Error forwarding to class-service [updateClass]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${USER_SERVICE_URL}/users`, {
            params: req.query,
            ...getForwardingHeaders(req)
        });
        res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error forwarding to user-service [getAllUsers]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
    }
};


export const createUser = async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${USER_SERVICE_URL}/users`, req.body, getForwardingHeaders(req));
        res.status(201).json(response.data);
    } catch (error: any) {
        console.error("Error forwarding to user-service [createUser]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await axios.put(`${USER_SERVICE_URL}/users/${id}`, req.body, getForwardingHeaders(req));
        res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error forwarding to user-service [updateUser]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await axios.delete(`${USER_SERVICE_URL}/users/${id}`, getForwardingHeaders(req));
        res.status(204).send();
    } catch (error: any) {
        console.error("Error forwarding to user-service [deleteUser]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
    }
};

export const getAllSchedules = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${SCHEDULE_SERVICE_URL}/schedules`, { ...getForwardingHeaders(req) });
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data);
    }
};

export const createSchedule = async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${SCHEDULE_SERVICE_URL}/schedules`, req.body, getForwardingHeaders(req));
        res.status(201).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data);
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
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Peran (role) yang dipilih tidak valid.' });
    }
    const filePath = req.file.path;

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const usersToCreate: any[] = [];
        await new Promise<void>((resolve, reject) => {
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                step: (result) => {
                    usersToCreate.push(result.data);
                },
                complete: () => resolve(),
                error: (error: any) => reject(error)
            });
        });

        if (usersToCreate.length === 0) {
            return res.status(400).json({ message: 'Tidak ada data valid yang dapat diproses dari file CSV.' });
        }

        let successCount = 0;
        const errors: any[] = [];

        // Panggil user-service untuk setiap pengguna, satu per satu
        for (const user of usersToCreate) {
            try {
                const payload = { ...user, role }; // Gabungkan data dari CSV dengan peran yang dipilih
                // Kirim permintaan ke user-service untuk membuat pengguna
                await axios.post(`${USER_SERVICE_URL}/users`, payload, getForwardingHeaders(req));
                successCount++;
            } catch (error: any) {
                errors.push({ user: user.username, message: error.response?.data?.message || 'Unknown error' });
            }
        }

        res.status(201).json({
            message: `Proses selesai. Berhasil membuat ${successCount} dari ${usersToCreate.length} pengguna.`,
            errors
        });

    } catch (error) {
        console.error("Gagal memproses file CSV:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat memproses file.' });
    } finally {
        fs.unlinkSync(filePath); // Pastikan file sementara dihapus
    }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Ambil semua kelas dari class-content-service
        const classesResponse = await axios.get(`${CLASS_SERVICE_URL}/classes/all-details`, getForwardingHeaders(req));
        const classes = classesResponse.data;

        const report = [];

        // 2. Lakukan iterasi untuk setiap kelas dan ambil data kehadiran dari attendance-service
        for (const cls of classes) {
            try {
                // Diasumsikan ada endpoint ini di attendance-service
                const attendanceResponse = await axios.get(`${ATTENDANCE_SERVICE_URL}/reports/class/${cls.id}`, getForwardingHeaders(req));
                // 3. Gabungkan data
                report.push(...attendanceResponse.data);
            } catch (error) {
                console.error(`Gagal mengambil laporan kehadiran untuk kelas ID ${cls.id}:`, error);
                // Lanjutkan ke kelas berikutnya jika satu gagal
            }
        }

        res.status(200).json(report);
    } catch (error: unknown) {
        console.error("Gagal membuat laporan kehadiran:", error);
        res.status(500).json({ message: 'Gagal mengambil laporan kehadiran.' });
    }
};

export const getGradeReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Ambil semua kelas dari class-content-service
        const classesResponse = await axios.get(`${CLASS_SERVICE_URL}/classes/all-details`, getForwardingHeaders(req));
        const classes = classesResponse.data;

        const report = [];

        // 2. Lakukan iterasi untuk setiap kelas dan ambil data tugas & nilai dari assignment-service
        for (const cls of classes) {
            try {
                // Diasumsikan ada endpoint ini di assignment-service
                const gradeResponse = await axios.get(`${ASSIGNMENT_SERVICE_URL}/reports/class/${cls.id}`, getForwardingHeaders(req));
                // 3. Gabungkan data
                report.push(...gradeResponse.data);
            } catch (error) {
                console.error(`Gagal mengambil laporan nilai untuk kelas ID ${cls.id}:`, error);
            }
        }
        res.status(200).json(report);
    } catch (error: unknown) {
        console.error("Gagal membuat laporan nilai:", error);
        res.status(500).json({ message: 'Gagal mengambil laporan nilai.' });
    }
};





export const deleteClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await axios.delete(`${CLASS_SERVICE_URL}/classes/${id}`, getForwardingHeaders(req));
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error("Error forwarding to class-service [deleteClass]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data);
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
    try {
        const classPromise = axios.get(`${CLASS_SERVICE_URL}/classes/all`, {
            params: req.query,
            ...getForwardingHeaders(req)
        });
        const usersPromise = axios.get(`${USER_SERVICE_URL}/users`, getForwardingHeaders(req));
        const [classResponse, usersResponse] = await Promise.all([classPromise, usersPromise]);

        const classes = classResponse.data;
        const users = usersResponse.data;
        const userMap = new Map(users.map((user: any) => [user.id, user]));

        const combinedData = classes.map((cls: any) => ({
            ...cls,
            teacher: userMap.get(cls.teacherId) || { fullName: 'Tidak Ditemukan' },
            homeroomTeacher: userMap.get(cls.homeroomTeacherId) || null
        }));

        res.json(combinedData);
    } catch (error: any) {
        console.error("Error orchestrating classes and users:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal mengambil data kelas.' });
    }
};


export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const teacherPromise = axios.get(`${USER_SERVICE_URL}/users?role=guru`, getForwardingHeaders(req));
        const homeroomPromise = axios.get(`${USER_SERVICE_URL}/users?role=wali_kelas`, getForwardingHeaders(req));
        const [teacherResponse, homeroomResponse] = await Promise.all([teacherPromise, homeroomPromise]);
        const allTeachers = [...teacherResponse.data, ...homeroomResponse.data];
        const uniqueTeachers = Array.from(new Map(allTeachers.map(teacher => [teacher.id, teacher])).values());
        res.json(uniqueTeachers);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal mengambil data guru.' });
    }
};

export const createSubject = async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${CLASS_SERVICE_URL}/subjects`, req.body, getForwardingHeaders(req));
        res.status(201).json(response.data);
    } catch (error: any) {
        console.error("Error forwarding to class-content-service [createSubject]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
    }
};

export const updateSubject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const response = await axios.put(`${CLASS_SERVICE_URL}/subjects/${id}`, req.body, getForwardingHeaders(req));
        res.status(200).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data);
    }
};

export const deleteSubject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await axios.delete(`${CLASS_SERVICE_URL}/subjects/${id}`, getForwardingHeaders(req));
        res.status(204).send();
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data);
    }
};

export const getAllSubjects = async (req: Request, res: Response) => {
    try {
        // Teruskan permintaan GET ke class-content-service, termasuk query params seperti 'grade'
        const response = await axios.get(`${CLASS_SERVICE_URL}/subjects`, {
            params: req.query, // Ini akan meneruskan filter 'grade' jika ada
            ...getForwardingHeaders(req)
        });
        res.json(response.data);
    } catch (error: any) {
        console.error("Error forwarding to class-content-service [getAllSubjects]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gagal mengambil data mata pelajaran.' });
    }
};

export const createClass = async (req: Request, res: Response) => {
    try {
        const form = new FormData();

        // Tambahkan semua field teks dari body ke form baru
        for (const key in req.body) {
            form.append(key, req.body[key]);
        }

        // Jika ada file yang diunggah, baca sebagai buffer dan tambahkan ke form
        if (req.file) {
            const fileBuffer = fs.readFileSync(req.file.path);
            form.append('image', fileBuffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });
        }
        
        // Dapatkan header dari form-data, termasuk boundary
        const formHeaders = form.getHeaders();
        const customHeaders = {
            ...getForwardingHeaders(req).headers,
            ...formHeaders,
        };

        // Kirim form ke class-content-service
        const response = await axios.post(`${CLASS_SERVICE_URL}/classes`, form, {
            headers: customHeaders,
        });

        // Hapus file sementara setelah berhasil diteruskan
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(201).json(response.data);

    } catch (error: any) {
        // Hapus file sementara jika terjadi error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Error forwarding to class-service [createClass]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
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
    try {
        const { classId } = req.params;
        const response = await axios.post(`${CLASS_SERVICE_URL}/classes/${classId}/enroll`, req.body, getForwardingHeaders(req));
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error("Error forwarding to class-service [enrollStudent]:", error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data);
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

