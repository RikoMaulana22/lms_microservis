// services/5-admin-service/src/controllers/announcement.controller.ts
import { Request, Response } from 'express'; 
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';

const prisma = new PrismaClient();

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, content } = req.body;
        const authorId = req.user?.userId;

        if (!title || !content || !authorId) {
            res.status(400).json({ message: 'Judul, konten, dan author ID harus diisi.' });
            return;
        }
        
        // Kode ini sudah benar. Error terjadi karena Prisma Client belum sinkron dengan skema.
        const announcement = await prisma.announcement.create({
            data: { title, content, authorId },
        });

        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat pengumuman.', error });
    }
};

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
    try {
        // Kode ini sudah benar. Error terjadi karena Prisma Client belum sinkron dengan skema.
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil pengumuman.', error });
    }
};