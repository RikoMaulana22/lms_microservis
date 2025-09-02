// Path: src/routes/subject.routes.ts
import { Router } from 'express';
import { getAllSubjects, getGroupedSubjects,  createSubject, updateSubject, deleteSubject } from '../controllers/subject.controller';
import { authenticate } from 'shared/middlewares/auth.middleware';
import { authorize } from 'shared/middlewares/role.middleware'; // <-- PERBAIKAN: Impor 'authorize'


const router = Router();

// Tambahkan 'authenticate' untuk memastikan hanya user yang login yang bisa melihat
router.get('/', authenticate, getAllSubjects);
router.get('/grouped', authenticate, getGroupedSubjects);

// Rute khusus admin
router.post('/', authenticate, authorize('admin'), createSubject); // <-- PERBAIKAN: Gunakan 'authorize'
router.put('/:id', authenticate, authorize('admin'), updateSubject); // <-- PERBAIKAN: Gunakan 'authorize'
router.delete('/:id', authenticate, authorize('admin'), deleteSubject); // <-- PERBAIKAN: Gunakan 'authorize'



export default router;