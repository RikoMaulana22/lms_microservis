import { Router } from 'express';
import { authenticate } from 'shared/middlewares/auth.middleware';
import { authorize } from 'shared/middlewares/role.middleware';
import { 
    getMyProfile, 
    updateMyProfile, 
    getUserById, 
    getAllUsers, 
    createUser, 
    deleteUser 
} from '../controllers/user.controller';

const router = Router();

// Rute untuk pengguna yang terotentikasi (mengelola profil sendiri)
router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);

// Rute khusus Admin untuk mengelola semua pengguna
router.get('/', authenticate, authorize(['admin']), getAllUsers);
router.post('/', authenticate, authorize(['admin']), createUser); // Menambah pengguna baru
router.get('/:id', authenticate, authorize(['admin']), getUserById); // Mendapatkan user spesifik
router.delete('/:id', authenticate, authorize(['admin']), deleteUser); // Menghapus user

export default router;