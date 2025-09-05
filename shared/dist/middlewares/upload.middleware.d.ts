import multer from 'multer';
/**
 * Middleware untuk mengunggah gambar.
 * @param destination Sub-folder di dalam 'public/uploads/' untuk menyimpan gambar (contoh: 'class-covers').
 */
export declare const uploadImage: (destination?: string) => multer.Multer;
/**
 * Middleware untuk mengunggah dokumen (PDF, Word).
 * @param destination Sub-folder di dalam 'public/uploads/' untuk menyimpan file (contoh: 'submissions').
 */
export declare const uploadFile: (destination?: string) => multer.Multer;
