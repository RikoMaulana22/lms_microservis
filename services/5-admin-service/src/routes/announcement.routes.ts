// services/5-admin-service/src/routes/announcement.routes.ts
import { Router } from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcement.controller';
import { authenticate } from 'shared/middlewares/auth.middleware';
import { authorize } from 'shared/middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, authorize(['admin']), createAnnouncement);
router.get('/', getAnnouncements); // Endpoint publik untuk dibaca semua orang

export default router;