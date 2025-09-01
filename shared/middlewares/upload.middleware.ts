import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Tipe callback untuk filter file, diimpor langsung dari multer
type MulterFileFilterCallback = FileFilterCallback;

/**
 * Fungsi helper untuk membuat filter file berdasarkan tipe MIME.
 * @param allowedMimes Regular expression untuk tipe file yang diizinkan.
 */
const createFileFilter = (allowedMimes: RegExp) => {
  return (req: Request, file: Express.Multer.File, cb: MulterFileFilterCallback) => {
    // Uji tipe file dengan regular expression
    if (allowedMimes.test(file.mimetype)) {
      cb(null, true); // Terima file
    } else {
      // Tolak file dengan error yang jelas
      cb(null, false);
    }
  };
};

/**
 * Fungsi helper untuk membuat konfigurasi penyimpanan disk.
 * @param destination Sub-folder di dalam 'public/' untuk menyimpan file.
 */
const createStorage = (destination: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Semua file disimpan di dalam folder 'public' agar bisa diakses
      const fullPath = path.join('public', destination);
      // Buat direktori jika belum ada
      fs.mkdirSync(fullPath, { recursive: true });
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Buat nama file yang unik untuk menghindari tumpukan nama
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });
};

/**
 * Middleware untuk mengunggah gambar.
 * @param destination Sub-folder di dalam 'public/uploads/' untuk menyimpan gambar (contoh: 'class-covers').
 */
export const uploadImage = (destination: string = 'images') => multer({
  storage: createStorage(`uploads/${destination}`),
  limits: { fileSize: 1024 * 1024 * 5 }, // Batas 5 MB
  fileFilter: createFileFilter(/image\/(jpeg|png|gif|jpg)/),
});

/**
 * Middleware untuk mengunggah dokumen (PDF, Word).
 * @param destination Sub-folder di dalam 'public/uploads/' untuk menyimpan file (contoh: 'submissions').
 */
export const uploadFile = (destination: string = 'files') => multer({
  storage: createStorage(`uploads/${destination}`),
  limits: { fileSize: 1024 * 1024 * 10 }, // Batas 10 MB
  fileFilter: createFileFilter(/application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)/),
});