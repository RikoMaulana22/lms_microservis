// services/3-grading-service/src/controllers/progress.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware'; // Sesuaikan path jika perlu

const prisma = new PrismaClient();

export const getAssignmentsAndProgressByTopicIds = async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = req.user?.userId;
    const { topicIds } = req.query;

    if (!topicIds || typeof topicIds !== 'string') {
        res.status(400).json({ message: "topicIds diperlukan." });
        return;
    }

    const ids = topicIds.split(',').map(id => parseInt(id.trim(), 10));

    try {
        const assignments = await prisma.assignment.findMany({
            where: {
                topicId: {
                    in: ids,
                },
            },
            include: {
                // Ambil submission HANYA untuk siswa yang sedang login
                submissions: {
                    where: { studentId: studentId },
                },
            },
        });

        // Proses data untuk menghitung studentProgress
        const assignmentsWithProgress = assignments.map(assignment => {
            const { submissions, ...assignmentData } = assignment;
            const studentProgress = {
                attemptCount: submissions.length,
                highestScore: submissions.length > 0
                    ? Math.max(...submissions.map(sub => sub.score || 0))
                    : null,
                isSubmitted: submissions.length > 0
            };
            return { ...assignmentData, studentProgress };
        });

        res.status(200).json(assignmentsWithProgress);
    } catch (error) {
        console.error("Gagal mengambil progres tugas:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};