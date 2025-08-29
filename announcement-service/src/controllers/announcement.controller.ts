// Path: src/controllers/announcement.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// --- Untuk Pengguna Umum (Guru/Siswa) ---
// Mengambil beberapa pengumuman terbaru untuk ditampilkan di dashboard
export const getLatestAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const announcements = await prisma.announcement.findMany({
            take: 5, // Ambil 5 pengumuman terbaru
            orderBy: { createdAt: 'desc' },
            // Dihapus: `include` tidak bisa digunakan karena tabel User ada di service lain
        });
        res.status(200).json(announcements);
    } catch (error) {
        console.error("Error fetching latest announcements:", error);
        res.status(500).json({ message: 'Gagal mengambil pengumuman.' });
    }
};

// --- Untuk Admin ---
// Admin mengambil semua pengumuman untuk dikelola
export const getAllAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            // Dihapus: `include` tidak bisa digunakan
        });
        res.status(200).json(announcements);
    } catch (error) {
        console.error("Error fetching all announcements:", error);
        res.status(500).json({ message: 'Gagal mengambil pengumuman.' });
    }
};

// Admin membuat pengumuman baru
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, content } = req.body;
    const authorId = req.user?.userId; // Diambil dari token

    if (!title || !content) {
        res.status(400).json({ message: 'Judul dan konten wajib diisi.' });
        return;
    }
    if (!authorId) {
        // Error spesifik jika pengguna tidak terautentikasi
        res.status(401).json({ message: 'Akses ditolak. Author ID tidak ditemukan.' });
        return;
    }

    try {
        const newAnnouncement = await prisma.announcement.create({
            data: { title, content, authorId },
        });
        res.status(201).json(newAnnouncement);
    } catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).json({ message: 'Gagal membuat pengumuman.' });
    }
};

// Admin menghapus pengumuman
export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await prisma.announcement.delete({
            // Perbaikan: ID di database adalah String (UUID/CUID), bukan Number
            where: { id: Number(id) }
        });
        // Respon standar untuk DELETE yang sukses adalah 204 No Content
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ message: 'Gagal menghapus pengumuman.' });
    }
};