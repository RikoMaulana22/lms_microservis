// Path: homeroom-service/src/middlewares/role.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

// PERBAIKAN: Middleware ini sekarang menerima string, bukan enum Prisma
export const checkRole = (roles: string | string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ message: 'Otentikasi diperlukan, peran tidak ditemukan.' });
        }

        const requiredRoles = Array.isArray(roles) ? roles : [roles];

        if (requiredRoles.includes(userRole)) {
            next(); // Peran cocok, lanjutkan
        } else {
            res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki peran yang sesuai.' });
        }
    };
};