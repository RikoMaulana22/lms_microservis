import { Request, Response } from 'express';
import { PrismaClient, Role  } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';

const prisma = new PrismaClient();

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

        if (user.role === 'wali_kelas') {
            try {
                const validationResponse = await axios.get(`http://localhost:5002/api/classes/homeroom-check/${user.id}`);
                if (!validationResponse.data?.isHomeroomTeacher) {
                    return res.status(403).json({ message: 'Akses ditolak. Anda bukan wali kelas aktif.' });
                }
            } catch (error) {
                console.error('Gagal validasi wali kelas:', error);
                return res.status(500).json({ message: 'Gagal memvalidasi peran wali kelas.' });
            }
        }
        
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat login.' });
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
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: req.user?.userId },
            data: dataToUpdate,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
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
    const { fullName, username, password, email, role, nisn, homeroomClassId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                fullName,
                username,
                password: hashedPassword,
                email,
                role,
                nisn: role === 'siswa' ? nisn : null,
                homeroomClassId: role === 'wali_kelas' ? Number(homeroomClassId) : null,
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
    const { fullName, username, role, nisn, password } = req.body;
    try {
        const dataToUpdate: any = { fullName, username, role, nisn: role === 'siswa' ? nisn : null };
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
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