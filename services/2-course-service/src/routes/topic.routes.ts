// Path: src/routes/topic.routes.ts
import { Router } from 'express';
import { updateTopic, deleteTopic } from '../controllers/topic.controller';
import { authorize } from 'shared/middlewares/role.middleware'; // <-- PERBAIKAN: Impor 'authorize'
import { authenticate } from 'shared/middlewares/auth.middleware';


const router = Router();

// Gunakan 'authorize' untuk mengecek peran 'guru'
router.put('/:id', authenticate, authorize('guru'), updateTopic); // <-- PERBAIKAN: Gunakan 'authorize'
router.delete('/:id', authenticate, authorize('guru'), deleteTopic); // <-- PERBAIKAN: Gunakan 'authorize'
export default router;