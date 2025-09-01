// services/5-admin-service/src/routes/setting.routes.ts
import { Router } from 'express';
import { getAllSettings, updateSettings } from '../controllers/setting.controller';
import { authenticate } from 'shared/middlewares/auth.middleware';
import { authorize } from 'shared/middlewares/role.middleware';

const router = Router();

router.get('/', getAllSettings); // Bisa diakses publik untuk dibaca frontend
router.put('/', authenticate, authorize(['admin']), updateSettings); // Hanya admin yang bisa mengubah

export default router;