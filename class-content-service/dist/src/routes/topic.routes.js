"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Path: src/routes/topic.routes.ts
const express_1 = require("express");
const topic_controller_1 = require("../controllers/topic.controller");
const role_middleware_1 = require("../middlewares/role.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // <-- 1. Impor authenticate
const router = (0, express_1.Router)();
// 2. Tambahkan 'authenticate' sebelum 'checkRole'
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('guru'), topic_controller_1.updateTopic);
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.checkRole)('guru'), topic_controller_1.deleteTopic);
exports.default = router;
