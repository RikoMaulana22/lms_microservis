// services/1-user-service/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';
const prisma = new PrismaClient();

// Fungsi untuk mendapatkan detail user berdasarkan ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: Number(id) },
            select: { // Hanya kirim data yang aman dan diperlukan
                id: true,
                fullName: true,
                email: true,
                role: true,
                nisn: true,
            }
        });

        if (!user) {
            res.status(404).json({ message: 'User tidak ditemukan' });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data user', error });
    }
};

// Fungsi untuk mendapatkan semua user (berguna untuk admin)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                role: true,
                nisn: true,
            }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data semua user', error });
    }
};

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, fullName: true, username: true, email: true, role: true, nisn: true }
        });
        if (!user) {
            res.status(404).json({ message: 'User tidak ditemukan' });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil profil' });
    }
};

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { fullName, email } = req.body;
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { fullName, email },
            select: { id: true, fullName: true, username: true, email: true, role: true, nisn: true }
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui profil' });
    }
};