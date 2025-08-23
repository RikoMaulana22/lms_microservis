"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // format "Bearer TOKEN"
    if (!token) {
        res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next(); // lanjutkan middleware chain
    }
    catch (err) {
        res.status(403).json({ message: 'Token tidak valid.' });
    }
};
exports.authenticate = authenticate;
