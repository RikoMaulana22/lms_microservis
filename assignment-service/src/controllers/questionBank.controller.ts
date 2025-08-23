// assignment-service/src/controllers/questionBank.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fungsi untuk mengambil semua soal dari bank soal milik guru
export const getQuestionsFromBank = async (req: Request, res: Response) => {
    // @ts-ignore
    const teacherId = req.user.id; // Diambil dari token JWT setelah autentikasi

    try {
        const questions = await prisma.question.findMany({
            where: {
                authorId: teacherId,
            },
            include: {
                options: true, // Sertakan pilihan jawabannya
            },
        });
        res.json(questions);
    } catch (error) {
        console.error("Error fetching questions from bank:", error);
        res.status(500).json({ message: 'Gagal mengambil data bank soal.' });
    }
};

// Fungsi untuk membuat soal baru di dalam bank soal
export const createQuestionInBank = async (req: Request, res: Response) => {
    // @ts-ignore
    const authorId = req.user.id;
    const { questionText, type, topic, options } = req.body;

    if (!questionText || !type) {
        return res.status(400).json({ message: 'Teks pertanyaan dan tipe soal wajib diisi.' });
    }

    try {
        const newQuestion = await prisma.question.create({
            data: {
                questionText,
                type,
                topic,
                authorId,
                // Jika tipe soalnya pilihan ganda, buat juga opsinya
                options: {
                    create: type === 'pilgan' ? options.map((opt: any) => ({
                        optionText: opt.optionText,
                        isCorrect: opt.isCorrect,
                        explanation: opt.explanation,
                    })) : [],
                },
            },
            include: {
                options: true,
            },
        });
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Error creating question in bank:", error);
        res.status(500).json({ message: 'Gagal membuat soal baru.' });
    }
};