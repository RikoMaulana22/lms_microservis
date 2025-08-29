// Path: user-service/src/routes/user.routes.ts

import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getAllTeachers
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// =========================================================================================
//  RUTE PROFIL PENGGUNA (Untuk pengguna yang sedang login)
// =========================================================================================
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/teachers', authenticate, checkRole(['admin', 'wali_kelas']), getAllTeachers);
// =========================================================================================
//  RUTE MANAJEMEN PENGGUNA (HANYA UNTUK ADMIN)
// =========================================================================================
router.get('/', authenticate, checkRole('admin'), getAllUsers);
router.post('/', authenticate, checkRole('admin'), createUser);
router.put('/:id', authenticate, checkRole('admin'), updateUser);
router.delete('/:id', authenticate, checkRole('admin'), deleteUser);

export default router;