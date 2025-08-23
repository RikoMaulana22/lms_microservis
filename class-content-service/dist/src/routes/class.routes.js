"use strict";
// File: class-content-service/src/routes/class.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const class_controller_1 = require("../controllers/class.controller");
const role_middleware_1 = require("../middlewares/role.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Rute untuk Guru
router.get('/teacher', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('guru'), class_controller_1.getTeacherClasses);
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('guru'), upload_middleware_1.upload.single('image'), // Middleware untuk menangani upload gambar
class_controller_1.createClass);
// Rute untuk Siswa
router.get('/student', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('siswa'), class_controller_1.getStudentClasses);
router.post('/:id/enrol', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('siswa'), class_controller_1.enrolInClass);
// Rute untuk Admin
router.get('/all', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('admin'), class_controller_1.getAllClasses);
// Rute Umum (bisa diakses siswa dan guru setelah login)
router.get('/:id', auth_middleware_1.authenticate, class_controller_1.getClassById);
// Rute untuk mengelola topik (hanya guru)
router.post('/:id/topics', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('guru'), class_controller_1.createTopicForClass);
// Rute untuk menghapus kelas (hanya guru)
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('guru'), class_controller_1.deleteClass);
exports.default = router;
