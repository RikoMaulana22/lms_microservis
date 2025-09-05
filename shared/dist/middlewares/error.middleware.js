"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan internal pada server.';
    console.error(`[ERROR] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    console.error(err.stack);
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
};
exports.errorHandler = errorHandler;
