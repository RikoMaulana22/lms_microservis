// Path: admin-service/src/controllers/setting.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mengambil semua pengaturan
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    // Mengubah array menjadi objek agar lebih mudah diakses di frontend
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as { [key: string]: string });
    res.status(200).json(settingsObject);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pengaturan', error });
  }
};

// Memperbarui pengaturan
export const updateSettings = async (req: Request, res: Response) => {
  const { settings } = req.body; // settings diharapkan berupa objek { key: value, ... }

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Format data tidak valid' });
  }

  try {
    const updatePromises = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Pengaturan berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui pengaturan', error });
  }
};