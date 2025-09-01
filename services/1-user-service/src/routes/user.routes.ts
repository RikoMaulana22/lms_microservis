// services/1-user-service/src/routes/user.routes.ts
import { Router } from 'express';
import { getUserById, getAllUsers } from '../controllers/user.controller';
// import { authenticate } from 'shared/src/middlewares/auth.middleware'; // Nanti ditambahkan

const router = Router();

// Endpoint ini akan dipanggil oleh layanan lain
router.get('/:id', getUserById);
router.get('/', getAllUsers);

export default router;