// shared/middlewares/role.middleware.ts

import { Response, NextFunction } from 'express';
import { AuthRequest, TokenPayload } from './auth.middleware';

// Menggunakan tipe Role dari TokenPayload untuk konsistensi
type Role = TokenPayload['role'];

export const authorize = (allowedRoles: Role | Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ message: 'Otentikasi diperlukan, peran pengguna tidak ditemukan.' });
        }

        const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (requiredRoles.includes(userRole)) {
            next(); // Peran cocok, lanjutkan ke controller
        } else {
            res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki peran yang sesuai.' });
        }
    };
};