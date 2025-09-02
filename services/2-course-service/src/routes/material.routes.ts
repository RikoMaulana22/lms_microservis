// Path: server/src/routes/material.routes.ts

import { Router } from 'express';
import {
    createMaterialForTopic,
    createGlobalMaterial,
    getGlobalMaterials,
    getMaterialsForTopic,
    deleteMaterial
} from '../controllers/material.controller';
import { authenticate } from 'shared/middlewares/auth.middleware';
import { authorize } from 'shared/middlewares/role.middleware'; // <-- PERBAIKAN: Impor 'authorize'
import { uploadFile } from 'shared/middlewares/upload.middleware'; // <-- PERBAIKAN: Impor 'uploadFile'

const router = Router();

// --- Rute untuk Materi Global (umumnya oleh Admin) ---

// Admin membuat materi global baru
router.post('/global',
    authenticate,
    authorize('admin'), // <-- PERBAIKAN: Gunakan 'authorize'
    uploadFile().single('file'), // <-- PERBAIKAN: Gunakan uploadFile()
    createGlobalMaterial
);

// Semua user yang login bisa melihat materi global
router.get('/global',
    authenticate,
    getGlobalMaterials
);


// --- Rute untuk Materi di dalam Topik (oleh Guru) ---

// Guru membuat materi baru di dalam sebuah topik
router.post('/topics/:topicId',
    authenticate,
    authorize('guru'), // <-- PERBAIKAN: Gunakan 'authorize'
    uploadFile().single('file'), // <-- PERBAIKAN: Gunakan uploadFile()
    createMaterialForTopic
);

// Semua user yang login bisa melihat materi di dalam sebuah topik
router.get('/topics/:topicId',
    authenticate,
    getMaterialsForTopic
);


// --- Rute untuk Mengelola Materi Individual ---

// Guru atau Admin bisa menghapus materi
router.delete('/:materialId',
    authenticate,
    authorize(['guru', 'admin']), // <-- PERBAIKAN: Gunakan 'authorize'
    deleteMaterial
);

export default router;