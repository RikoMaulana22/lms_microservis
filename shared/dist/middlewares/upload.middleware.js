"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Fungsi helper untuk membuat filter file berdasarkan tipe MIME.
 * @param allowedMimes Regular expression untuk tipe file yang diizinkan.
 */
const createFileFilter = (allowedMimes) => {
    return (req, file, cb) => {
        // Uji tipe file dengan regular expression
        if (allowedMimes.test(file.mimetype)) {
            cb(null, true); // Terima file
        }
        else {
            // Tolak file dengan error yang jelas
            cb(null, false);
        }
    };
};
/**
 * Fungsi helper untuk membuat konfigurasi penyimpanan disk.
 * @param destination Sub-folder di dalam 'public/' untuk menyimpan file.
 */
const createStorage = (destination) => {
    return multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            // Semua file disimpan di dalam folder 'public' agar bisa diakses
            const fullPath = path_1.default.join('public', destination);
            // Buat direktori jika belum ada
            fs_1.default.mkdirSync(fullPath, { recursive: true });
            cb(null, fullPath);
        },
        filename: (req, file, cb) => {
            // Buat nama file yang unik untuk menghindari tumpukan nama
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
        },
    });
};
/**
 * Middleware untuk mengunggah gambar.
 * @param destination Sub-folder di dalam 'public/uploads/' untuk menyimpan gambar (contoh: 'class-covers').
 */
const uploadImage = (destination = 'images') => (0, multer_1.default)({
    storage: createStorage(`uploads/${destination}`),
    limits: { fileSize: 1024 * 1024 * 5 }, // Batas 5 MB
    fileFilter: createFileFilter(/image\/(jpeg|png|gif|jpg)/),
});
exports.uploadImage = uploadImage;
/**
 * Middleware untuk mengunggah dokumen (PDF, Word).
 * @param destination Sub-folder di dalam 'public/uploads/' untuk menyimpan file (contoh: 'submissions').
 */
const uploadFile = (destination = 'files') => (0, multer_1.default)({
    storage: createStorage(`uploads/${destination}`),
    limits: { fileSize: 1024 * 1024 * 10 }, // Batas 10 MB
    fileFilter: createFileFilter(/application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)/),
});
exports.uploadFile = uploadFile;
