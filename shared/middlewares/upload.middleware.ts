// Path: server/src/middlewares/upload.middleware.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Tentukan direktori penyimpanan
const storageDir = 'public/uploads/materials';
type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

// Pastikan direktori ada, jika tidak, buat direktorinya
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

// Konfigurasi penyimpanan disk untuk Multer
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, storageDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // Buat nama file yang unik untuk menghindari konflik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter file untuk membatasi tipe file yang diizinkan (opsional tapi direkomendasikan)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Daftar tipe file yang diizinkan
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

        'text/csv',
        'application/csv',
        'application/vnd.ms-excel'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true); // Terima file
    } else {
        cb(new Error('Tipe file tidak diizinkan!')); // Tolak file
    }
};

// Inisialisasi dan ekspor instance Multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Batas ukuran file 10MB
    }
});

const createStorage = (destination: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Pastikan direktori tujuan ada, jika tidak, buat
      const fullPath = path.join('public', destination);
      fs.mkdirSync(fullPath, { recursive: true });
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });
};

// Konfigurasi upload yang bisa disesuaikan
export const uploadImage = (destination: string = 'images') => multer({
  storage: createStorage(destination),
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB
  fileFilter: fileFilter(/image\/(jpeg|png|gif|jpg)/),
});

export const uploadFile = (destination: string = 'files') => multer({
  storage: createStorage(destination),
  limits: { fileSize: 1024 * 1024 * 10 }, // 10 MB
  fileFilter: fileFilter(/application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)/),
});