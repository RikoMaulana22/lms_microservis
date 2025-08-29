// Path: user-service/src/routes/auth.routes.ts

import { Router } from 'express';
import { login } from '../controllers/user.controller'; // Nama controller diubah

const router = Router();

// Rute khusus untuk proses autentikasi
router.post('/login', login);

export default router;