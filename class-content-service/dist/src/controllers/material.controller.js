"use strict";
// Path: server/src/controllers/material.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.getMaterialsForTopic = exports.createGlobalMaterial = exports.createMaterialForTopic = exports.getGlobalMaterials = exports.uploadMaterial = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const uploadMaterial = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { title } = req.body;
        if (!req.file) {
            res.status(400).json({ message: 'File tidak ditemukan untuk diunggah.' });
            return;
        }
        // Buat URL yang bisa diakses publik dari path file
        // Pastikan path ini sesuai dengan cara Anda menyajikan file statis
        const fileUrl = `/uploads/materials/${req.file.filename}`;
        const newMaterial = await prisma.material.create({
            data: {
                title,
                fileUrl,
                topicId: Number(topicId),
            },
        });
        res.status(201).json(newMaterial);
    }
    catch (error) {
        console.error("Gagal mengunggah materi:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengunggah materi." });
    }
};
exports.uploadMaterial = uploadMaterial;
// --- FUNGSI BARU: Mendapatkan materi global untuk siswa/guru ---
const getGlobalMaterials = async (req, res) => {
    try {
        const materials = await prisma.material.findMany({
            // --- PERBAIKAN DITERAPKAN DI SINI ---
            where: { topic: null }, // Filter berdasarkan relasi, bukan ID
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(materials);
    }
    catch (error) {
        res.status(500).json({ message: 'Gagal mengambil materi global.' });
    }
};
exports.getGlobalMaterials = getGlobalMaterials;
const createMaterialForTopic = async (req, res) => {
    const { topicId } = req.params;
    const { title, content, youtubeUrl } = req.body;
    // Validasi dasar
    if (!title) {
        res.status(400).json({ message: 'Judul materi wajib diisi.' });
        return;
    }
    try {
        // Cek apakah ada file yang diunggah
        const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : undefined;
        const newMaterial = await prisma.material.create({
            data: {
                title,
                content,
                youtubeUrl,
                fileUrl, // Bisa jadi undefined jika tidak ada file
                topicId: Number(topicId),
            },
        });
        res.status(201).json(newMaterial);
    }
    catch (error) {
        console.error("Gagal membuat materi:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
exports.createMaterialForTopic = createMaterialForTopic;
// --- FUNGSI UNTUK MEMBUAT MATERI GLOBAL (UNTUK ADMIN) ---
const createGlobalMaterial = async (req, res) => {
    const { title, content, youtubeUrl } = req.body;
    if (!title) {
        res.status(400).json({ message: 'Judul materi wajib diisi.' });
        return;
    }
    try {
        const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : undefined;
        const newMaterial = await prisma.material.create({
            data: {
                title,
                content,
                youtubeUrl,
                fileUrl,
                // topicId tidak diisi karena ini materi global
            },
        });
        res.status(201).json(newMaterial);
    }
    catch (error) {
        console.error("Gagal membuat materi global:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
exports.createGlobalMaterial = createGlobalMaterial;
// --- FUNGSI TAMBAHAN YANG BERGUNA ---
// Mendapatkan semua materi dalam satu topik
const getMaterialsForTopic = async (req, res) => {
    const { topicId } = req.params;
    try {
        const materials = await prisma.material.findMany({
            where: { topicId: Number(topicId) },
            orderBy: { createdAt: 'asc' }
        });
        res.status(200).json(materials);
    }
    catch (error) {
        res.status(500).json({ message: 'Gagal mengambil materi.' });
    }
};
exports.getMaterialsForTopic = getMaterialsForTopic;
// Menghapus materi
const deleteMaterial = async (req, res) => {
    const { materialId } = req.params;
    try {
        // Hapus file fisik jika ada (logika ini perlu disesuaikan)
        // ... kode untuk menghapus file ...
        await prisma.material.delete({ where: { id: Number(materialId) } });
        res.status(200).json({ message: 'Materi berhasil dihapus.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Gagal menghapus materi.' });
    }
};
exports.deleteMaterial = deleteMaterial;
