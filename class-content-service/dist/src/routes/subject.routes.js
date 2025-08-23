"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Path: src/routes/subject.routes.ts
const express_1 = require("express");
const subject_controller_1 = require("../controllers/subject.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // Jalur baru ke middleware
const role_middleware_1 = require("../middlewares/role.middleware"); // Jalur baru ke middleware
const router = (0, express_1.Router)();
// Tambahkan 'authenticate' untuk memastikan hanya user yang login yang bisa melihat
router.get('/', auth_middleware_1.authenticate, subject_controller_1.getAllSubjects);
router.get('/grouped', auth_middleware_1.authenticate, subject_controller_1.getGroupedSubjects);
// Rute khusus admin (sudah benar)
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('admin'), subject_controller_1.createSubject);
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('admin'), subject_controller_1.updateSubject);
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('admin'), subject_controller_1.deleteSubject);
exports.default = router;
