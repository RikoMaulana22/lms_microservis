import { Request, Response, NextFunction } from 'express';
// --- PERBAIKAN 1: Impor tipe Role dan PrismaClient dari @prisma/client ---
import { PrismaClient, Role } from '@prisma/client'; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TokenPayload, AuthRequest } from 'shared/middlewares/auth.middleware';

const prisma = new PrismaClient();

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: 'Username dan password wajib diisi' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(404).json({ message: 'Username tidak ditemukan' });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Password salah' });
      return;
    }

    const payload: TokenPayload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// --- FUNGSI BARU: Login Khusus Admin ---
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ message: 'Username dan password wajib diisi' });
            return;
        }
        
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(404).json({ message: 'Akun admin tidak ditemukan' });
            return;
        }

        if (user.role !== 'admin') {
            res.status(403).json({ message: 'Akses ditolak. Akun ini bukan admin.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Password salah' });
            return;
        }

        const payload: TokenPayload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

        res.status(200).json({
            message: 'Login admin berhasil!',
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error saat login admin:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

// Fungsi getMe sudah benar karena hanya mengakses model User
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Otentikasi gagal." });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
            }
        });

        if (!user) {
            res.status(404).json({ message: "Pengguna tidak ditemukan." });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error saat mengambil data pengguna:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// --- DIHAPUS ---
// Fungsi loginHomeroomTeacher dihapus dari sini karena memerlukan akses ke model 'Class'.
// Logika ini harus diimplementasikan di 'homeroom.controller.ts' di dalam admin-service,
// yang kemudian akan memanggil user-service untuk validasi password.

// --- CATATAN ---
// Fungsi getUsers, createUser, updateUser, deleteUser seharusnya berada di user.controller.ts, bukan di sini.
// Logika di dalamnya yang mengakses 'class', 'schedule', dan 'announcement' juga harus dihapus
// karena melanggar prinsip microservice.