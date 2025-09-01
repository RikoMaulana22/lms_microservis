import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mengambil semua pengaturan
export const getAllSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await prisma.setting.findMany();
        // Mengubah array menjadi objek agar lebih mudah diakses di frontend
        const settingsObject = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string>);
        res.status(200).json(settingsObject);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil pengaturan.' });
    }
};

// Memperbarui pengaturan (bisa beberapa sekaligus)
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settingsToUpdate: Record<string, string> = req.body;

        const updatePromises = Object.keys(settingsToUpdate).map(key =>
            prisma.setting.upsert({
                where: { key },
                update: { value: settingsToUpdate[key] },
                create: { key, value: settingsToUpdate[key] },
            })
        );

        await Promise.all(updatePromises);
        res.status(200).json({ message: 'Pengaturan berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui pengaturan.' });
    }
};