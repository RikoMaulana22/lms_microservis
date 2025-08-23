"use strict";
// class-content-service/src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import semua rute yang relevan untuk layanan ini
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const topic_routes_1 = __importDefault(require("./routes/topic.routes"));
const material_routes_1 = __importDefault(require("./routes/material.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5002; // Gunakan port unik, misal 5002
const HOST = '0.0.0.0';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rute dasar untuk memeriksa status layanan
app.get('/', (req, res) => {
    res.send('Class & Content Service is running.');
});
// Hubungkan semua rute ke Express
app.use('/api/classes', class_routes_1.default);
app.use('/api/subjects', subject_routes_1.default);
app.use('/api/topics', topic_routes_1.default);
app.use('/api/materials', material_routes_1.default);
app.listen(PORT, HOST, () => {
    console.log(`🚀 Class & Content Service berjalan di http://localhost:${PORT}`);
});
