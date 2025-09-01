// services/1-user-service/src/routes/user.routes.ts
import { Router } from 'express';
import { getMyProfile, updateMyProfile,getUserById, getAllUsers } from '../controllers/user.controller';
// import { authenticate } from 'shared/src/middlewares/auth.middleware'; // Nanti ditambahkan
import { authenticate } from 'shared/middlewares/auth.middleware';

const router = Router();

// Endpoint ini akan dipanggil oleh layanan lain
router.get('/:id', getUserById);
router.get('/', getAllUsers);
router.get('/me', authenticate, getMyProfile); // Endpoint untuk profil sendiri
router.put('/me', authenticate, updateMyProfile); // Endpoint untuk update profil sendiri

router.get('/:id', authenticate, getUserById); // Endpoint untuk layanan lain/admin
router.get('/', authenticate, getAllUsers); // Endpoint untuk admin
export default router;