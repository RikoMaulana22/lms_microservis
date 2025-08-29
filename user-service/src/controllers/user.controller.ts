// Path: user-service/src/controllers/user.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();
const CLASS_SERVICE_URL = process.env.CLASS_SERVICE_URL; // Menggunakan variabel lingkungan
 // Menggunakan variabel lingkungan
// =========================================================================================
//  FUNGSI LOGIN
// =========================================================================================
export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        // Validasi tambahan untuk wali kelas
        if (user.role === 'wali_kelas') {
            try {
                // Pastikan CLASS_SERVICE_URL terdefinisi
                if (!CLASS_SERVICE_URL) {
                    console.error("FATAL: CLASS_SERVICE_URL tidak terdefinisi di .env");
                    return res.status(500).json({ message: 'Konfigurasi server tidak lengkap.' });
                }
                const validationResponse = await axios.get(`${CLASS_SERVICE_URL}/classes/homeroom-check/${user.id}`);
                if (!validationResponse.data?.isHomeroomTeacher) {
                    return res.status(403).json({ message: 'Akses ditolak. Anda bukan wali kelas yang aktif di kelas manapun.' });
                }
            } catch (error) {
                console.error('Gagal validasi wali kelas:', error);
                return res.status(500).json({ message: 'Gagal memvalidasi peran wali kelas.' });
            }
        }
        
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("FATAL ERROR: JWT_SECRET tidak terdefinisi.");
            return res.status(500).json({ message: 'Kesalahan internal pada konfigurasi server.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '24h' });
        const { password: _, ...userResponse } = user;
        res.json({ token, user: userResponse });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
    }
};

// =========================================================================================
//  FUNGSI PROFIL PENGGUNA
// =========================================================================================
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.userId },
            select: { id: true, fullName: true, username: true, email: true, role: true, nisn: true }
        });
        if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil profil.' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    const { fullName, username, email, password } = req.body;
    try {
        const dataToUpdate: any = { fullName, username, email };
        if (password && password.length > 0) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: req.user?.userId },
            data: dataToUpdate,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
             return res.status(409).json({ message: `Username atau email sudah digunakan.` });
        }
        res.status(500).json({ message: 'Gagal memperbarui profil.' });
    }
};



// =========================================================================================
//  FUNGSI MANAJEMEN PENGGUNA (UNTUK ADMIN)
// =========================================================================================
export const getAllUsers = async (req: Request, res: Response) => {
    const role = req.query.role as Role;
    try {
        const users = await prisma.user.findMany({
            where: role ? { role } : {},
            select: { id: true, username: true, fullName: true, email: true, role: true, nisn: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data pengguna." });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { fullName, username, password, email, role } = req.body;
    if (!fullName || !username || !password || !email || !role) {
        return res.status(400).json({ message: "Semua field (fullName, username, password, email, role) wajib diisi." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                fullName,
                username,
                password: hashedPassword,
                email,
                role,
            }
        });
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ message: "Pengguna berhasil dibuat.", user: userWithoutPassword });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: `Username atau email sudah ada.` });
        }
        res.status(500).json({ message: "Gagal membuat pengguna baru." });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullName, username, role, email, password } = req.body;
    try {
        const dataToUpdate: any = { fullName, username, role, email };
        if (password && password.length > 0) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
         if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
             return res.status(409).json({ message: `Username atau email sudah digunakan.` });
        }
        res.status(500).json({ message: "Gagal memperbarui data pengguna." });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus pengguna." });
    }
};

export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: 'guru' },
            select: {
                id: true,
                fullName: true,
            }
        });
        res.status(200).json(teachers);
    } catch (error) {
        console.error("Gagal mengambil data guru:", error);
        res.status(500).json({ message: "Gagal mengambil data guru." });
    }
};