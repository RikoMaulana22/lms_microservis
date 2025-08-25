// Path: assignment-service/src/controllers/assignment.controller.ts

import { Response, Request } from 'express';
import { PrismaClient, AssignmentType } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';

const prisma = new PrismaClient();

// Fungsi untuk membuat tugas dari Bank Soal
export const createAssignmentFromBank = async (req: Request, res: Response) => {
    const { topicId } = req.params;
    const { title, description, dueDate, questionIds, type }: {
        title: string;
        description?: string;
        dueDate: string;
        questionIds: number[];
        type: AssignmentType;
    } = req.body;

    if (!title || !dueDate || !type || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ message: 'Judul, tipe, tanggal tenggat, dan minimal satu soal wajib diisi.' });
    }

    try {
        const newAssignment = await prisma.assignment.create({
            data: {
                title,
                description,
                type,
                dueDate: new Date(dueDate),
                topicId: parseInt(topicId),
                questions: {
                    connect: questionIds.map((id: number) => ({ id })),
                },
            },
        });
        res.status(201).json(newAssignment);
    } catch (error) {
        console.error("Error creating assignment from bank:", error);
        res.status(500).json({ message: 'Gagal membuat tugas dari bank soal.' });
    }
};

// Mengambil semua tugas untuk sebuah topik
export const getAssignmentsForTopic = async (req: Request, res: Response) => {
    const { topicId } = req.params;
    try {
        const assignments = await prisma.assignment.findMany({
            where: { topicId: Number(topicId) },
            orderBy: { dueDate: 'asc' },
            select: {
                id: true,
                title: true,
                type: true,
                dueDate: true,
            }
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Gagal mengambil daftar tugas:", error);
        res.status(500).json({ message: "Gagal mengambil daftar tugas" });
    }
};

// Mengambil detail sebuah tugas beserta soal-soalnya
export const getAssignmentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: Number(id) },
            include: {
                questions: {
                    orderBy: { id: 'asc' },
                    include: {
                        options: {
                            select: { id: true, optionText: true },
                        },
                    },
                },
            },
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        }
        res.status(200).json(assignment);
    } catch (error) {
        console.error("Gagal mengambil detail tugas:", error);
        res.status(500).json({ message: 'Gagal mengambil detail tugas.' });
    }
};

// Mengumpulkan jawaban tugas
export const submitAssignment = async (req: AuthRequest, res: Response) => {
    const { assignmentId } = req.params;
    const studentId = req.user?.userId;
    const { answers, essayAnswer, startedOn, timeTakenMs } = req.body;

    if (!studentId) {
        return res.status(401).json({ message: "Otentikasi gagal." });
    }

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: Number(assignmentId) },
            include: {
                questions: { include: { options: true } },
            }
        });

        if (!assignment) {
            return res.status(404).json({ message: "Tugas tidak ditemukan." });
        }

        // TODO: Lakukan API call ke class-content-service untuk verifikasi pendaftaran siswa
        
        let score: number | null = null;
        if (assignment.type === 'pilgan' && answers) {
            let correctCount = 0;
            const totalQuestions = assignment.questions.length;
            if (totalQuestions > 0) {
                assignment.questions.forEach(q => {
                    const correctOption = q.options.find(opt => opt.isCorrect);
                    if (correctOption && answers[q.id] === correctOption.id) {
                        correctCount++;
                    }
                });
                score = (correctCount / totalQuestions) * 100;
            }
        }

        const newSubmission = await prisma.submission.create({
            data: {
                studentId,
                assignmentId: Number(assignmentId),
                score,
                essayAnswer: assignment.type === 'esai' ? essayAnswer : null,
                selectedOptions: assignment.type === 'pilgan' ? answers : {},
                startedOn: new Date(startedOn),
                completedOn: new Date(),
                timeTakenMs: Number(timeTakenMs),
            }
        });

        res.status(201).json({
            message: "Jawaban Anda berhasil dikumpulkan!",
            submission: newSubmission
        });

    } catch (error) {
        console.error("Gagal saat memproses pengumpulan tugas:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat memproses jawaban Anda." });
    }
};

// Mengambil hasil pengerjaan (submission) untuk di-review oleh siswa
export const getSubmissionForReview = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; // id dari submission
    const userId = req.user?.userId;

    try {
        const submission = await prisma.submission.findUnique({
            where: { id: Number(id), studentId: userId },
            include: {
                assignment: {
                    include: {
                        questions: {
                            orderBy: { id: 'asc' },
                            include: { options: true }
                        }
                    }
                }
            }
        });

        if (!submission) {
            return res.status(404).json({ message: "Hasil pengerjaan tidak ditemukan." });
        }
        res.status(200).json(submission);
    } catch (error) {
        console.error("Gagal mengambil data review:", error);
        res.status(500).json({ message: "Gagal mengambil data review." });
    }
};

// Mengambil semua pengumpulan untuk sebuah tugas (untuk dilihat guru)
export const getAssignmentSubmissions = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; // id dari assignment
    
    try {
        const submissions = await prisma.submission.findMany({
            where: { assignmentId: Number(id) },
            orderBy: { submissionDate: 'asc' },
        });

        // TODO: Lakukan API call ke user-service untuk mendapatkan detail nama siswa dari setiap submission.studentId
        res.status(200).json(submissions);
    } catch(error) {
        console.error("Gagal mengambil data pengumpulan tugas:", error);
        res.status(500).json({ message: "Gagal mengambil data pengumpulan." });
    }
}