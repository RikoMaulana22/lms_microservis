// user-service/src/routes/auth.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware'; // Menggunakan import langsung
import { checkRole } from '../middlewares/role.middleware'; // Menggunakan import langsung
import * as authController from '../controllers/auth.controller'; // Mengimpor semua controller

const router = Router();

// Rute untuk login pengguna umum (siswa, guru)
router.post('/login', authController.loginUser);

// Rute khusus untuk login admin
router.post('/admin/login', authController.loginAdmin);

// Rute untuk mendapatkan data pengguna yang sedang login
router.get('/me', authenticate, authController.getMe);

// Rute khusus untuk login wali kelas
router.post('/login/homeroom', authController.loginHomeroomTeacher);

// Rute untuk mengambil semua pengguna (hanya admin)
router.get(
  '/admin/users',
  authenticate,
  checkRole(['admin']),
  authController.getUsers
);

// Rute untuk impor pengguna massal (hanya admin)
router.post(
  '/admin/users/bulk',
  authenticate,
  checkRole(['admin']),
  authController.bulkImportUsers
);

// Rute untuk membuat satu pengguna (hanya admin)
router.post(
  '/admin/users',
  authenticate,
  checkRole(['admin']),
  authController.createUser
);

export default router;