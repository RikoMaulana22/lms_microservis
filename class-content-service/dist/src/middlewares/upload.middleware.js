"use strict";
// Path: server/src/middlewares/upload.middleware.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Tentukan direktori penyimpanan
const storageDir = 'public/uploads/materials';
// Pastikan direktori ada, jika tidak, buat direktorinya
if (!fs_1.default.existsSync(storageDir)) {
    fs_1.default.mkdirSync(storageDir, { recursive: true });
}
// Konfigurasi penyimpanan disk untuk Multer
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storageDir);
    },
    filename: (req, file, cb) => {
        // Buat nama file yang unik untuk menghindari konflik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
// Filter file untuk membatasi tipe file yang diizinkan (opsional tapi direkomendasikan)
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error('Tipe file tidak diizinkan!')); // Tolak file
    }
};
// Inisialisasi dan ekspor instance Multer
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Batas ukuran file 10MB
    }
});
