"use strict";
// shared/middlewares/role.middleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        var _a;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole) {
            return res.status(401).json({ message: 'Otentikasi diperlukan, peran pengguna tidak ditemukan.' });
        }
        const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (requiredRoles.includes(userRole)) {
            next(); // Peran cocok, lanjutkan ke controller
        }
        else {
            res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki peran yang sesuai.' });
        }
    };
};
exports.authorize = authorize;
