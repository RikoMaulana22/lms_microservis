"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
const checkRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({ message: 'Otentikasi diperlukan, peran tidak ditemukan.' });
        }
        // Ubah input 'roles' menjadi array agar mudah diperiksa
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        // Cek apakah peran pengguna ada di dalam array peran yang diizinkan
        if (requiredRoles.includes(userRole)) {
            next(); // Peran cocok, lanjutkan
        }
        else {
            res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki peran yang sesuai.' });
        }
    };
};
exports.checkRole = checkRole;
