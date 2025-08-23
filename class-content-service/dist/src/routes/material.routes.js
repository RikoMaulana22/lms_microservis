"use strict";
// Path: server/src/routes/material.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const material_controller_1 = require("../controllers/material.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware"); // Pastikan middleware upload sudah ada
const router = (0, express_1.Router)();
// --- Rute untuk Materi Global (umumnya oleh Admin) ---
// Admin membuat materi global baru
router.post('/global', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('admin'), upload_middleware_1.upload.single('file'), material_controller_1.createGlobalMaterial);
// Semua user yang login bisa melihat materi global
router.get('/global', auth_middleware_1.authenticate, material_controller_1.getGlobalMaterials);
// --- Rute untuk Materi di dalam Topik (oleh Guru) ---
// Guru membuat materi baru di dalam sebuah topik
router.post('/topics/:topicId', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('guru'), upload_middleware_1.upload.single('file'), material_controller_1.createMaterialForTopic);
// Semua user yang login bisa melihat materi di dalam sebuah topik
router.get('/topics/:topicId', auth_middleware_1.authenticate, material_controller_1.getMaterialsForTopic);
// --- Rute untuk Mengelola Materi Individual ---
// Guru atau Admin bisa menghapus materi
router.delete('/:materialId', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)(['guru', 'admin']), material_controller_1.deleteMaterial);
exports.default = router;
