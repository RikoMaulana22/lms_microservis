"use strict";
// Path: server/src/config/multer.config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Tentukan direktori tujuan
const uploadDir = 'public/uploads/materials/';
// Buat direktori jika belum ada saat aplikasi pertama kali berjalan
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Konfigurasi penyimpanan
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Simpan file di folder public/uploads/materials
    },
    filename: function (req, file, cb) {
        // Buat nama file yang unik untuk menghindari tumpang tindih
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
exports.default = upload;
