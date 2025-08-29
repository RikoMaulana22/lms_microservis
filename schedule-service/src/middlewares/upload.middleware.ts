// Path: server/src/middlewares/upload.middleware.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Tentukan direktori penyimpanan untuk materi, pastikan sudah ada
const storageDir = path.join(__dirname, '../../public/uploads/materials');

// Pastikan direktori ada, jika tidak, buatlah
if (!fs.existsSync(storageDir)) {
    console.log(`Direktori penyimpanan tidak ditemukan. Membuat: ${storageDir}`);
    fs.mkdirSync(storageDir, { recursive: true });
}

// Konfigurasi penyimpanan disk untuk Multer
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, storageDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // Buat nama file yang unik untuk menghindari konflik dengan timestamp dan ID random
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Gabungkan nama file asli dengan suffix unik dan ekstensi
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Filter file untuk membatasi tipe file yang diizinkan (penting untuk keamanan)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Daftar tipe file yang diizinkan (MIME types)
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
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true); // Terima file
    } else {
        // Tolak file dengan pesan kesalahan yang jelas
        cb(new Error('Tipe file tidak diizinkan. Hanya file gambar, PDF, dokumen Word, PowerPoint, dan Excel yang diterima.'));
    }
};

// Inisialisasi dan ekspor instance Multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Batas ukuran file: 10 MB
    }
});
