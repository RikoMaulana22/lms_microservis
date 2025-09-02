// Path: src/controllers/submission.controller.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';

const prisma = new PrismaClient();
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:4002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4001';


export const getSubmissionReview = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: submissionId } = req.params;
    const userId = req.user?.userId;

    try {
        const submission = await prisma.submission.findFirst({
            where: { 
                id: Number(submissionId),
                studentId: userId // Validasi siswa langsung di query
            },
            include: {
                assignment: {
                    include: {
                        questions: {
                            include: {
                                options: true,
                            },
                        },
                    },
                },
            },
        });

        if (!submission) {
            res.status(404).json({ message: 'Hasil pengerjaan tidak ditemukan atau Anda tidak memiliki akses.' });
            return;
        }

        res.status(200).json(submission);
    } catch (error) {
        console.error('Gagal mengambil review submisi:', error);
        res.status(500).json({ message: 'Gagal mengambil data review.' });
    }
};

// --- FUNGSI BARU: Siswa mengumpulkan jawaban kuis ---
export const createSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: assignmentId } = req.params;
    const studentId = req.user?.userId;
    const { answers, essayAnswer } = req.body;

    if (!studentId) {
        res.status(401).json({ message: 'Otentikasi diperlukan.' });
        return;
    }
    if (!answers && !essayAnswer) {
        res.status(400).json({ message: 'Jawaban tidak boleh kosong.' });
        return;
    }

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: Number(assignmentId) },
            include: { questions: { include: { options: true } } },
        });

        if (!assignment) {
            res.status(404).json({ message: 'Tugas tidak ditemukan.' });
            return;
        }

        const currentAttemptCount = await prisma.submission.count({
            where: {
                studentId: studentId,
                assignmentId: Number(assignmentId),
            },
        });

        if (assignment.attemptLimit !== null && currentAttemptCount >= assignment.attemptLimit) {
            res.status(403).json({ message: 'Anda telah mencapai batas maksimal pengerjaan untuk tugas ini.' });
            return;
        }

        let finalScore: number | null = null;
        if (assignment.type === 'pilgan') {
            let correctAnswers = 0;
            const totalQuestions = assignment.questions.length;

            // PERBAIKAN 1: Pastikan 'answers' adalah objek sebelum di-loop
            if (answers && typeof answers === 'object') {
                for (const question of assignment.questions) {
                    const studentAnswerOptionId = answers[question.id];
                    const correctOption = question.options.find(opt => opt.isCorrect);
                    
                    if (studentAnswerOptionId !== undefined && correctOption && correctOption.id === studentAnswerOptionId) {
                        correctAnswers++;
                    }
                }
            }
            // PERBAIKAN 2: Pastikan hasil skor memiliki maksimal 2 angka desimal
            finalScore = totalQuestions > 0 ? parseFloat(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0;
        }

        const submission = await prisma.submission.create({
            data: {
                studentId,
                assignmentId: Number(assignmentId),
                selectedOptions: assignment.type === 'pilgan' ? answers : undefined,
                essayAnswer: assignment.type === 'esai' ? essayAnswer : undefined,
                score: finalScore,
            },
        });

        res.status(201).json({ message: "Jawaban berhasil dikumpulkan!", submissionId: submission.id });

    } catch (error: any) {
        console.error("Gagal mengumpulkan jawaban:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

export const getMyGrades = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;

        if (!studentId) {
            res.status(401).json({ message: "Otentikasi diperlukan." });
            return;
        }

        const grades = await prisma.submission.findMany({
            where: {
                studentId: studentId,
                score: {
                    not: null, // Hanya ambil submisi yang sudah punya nilai
                },
            },
            orderBy: {
                submissionDate: 'desc',
            },
            // PERBAIKAN: Hapus query ke relasi 'topic', 'class', dan 'subject'
            // yang tidak ada di service ini.
            select: {
                id: true,
                score: true,
                submissionDate: true,
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        topicId: true // Ambil topicId untuk query ke service lain jika perlu
                    },
                },
            },
        });

        /*
         * ARSITEKTUR MICROSERVICE:
         * Untuk mendapatkan nama kelas dan mata pelajaran, frontend harus:
         * 1. Kumpulkan semua `topicId` yang unik dari respons ini.
         * 2. Buat panggilan API ke `course-service` untuk mendapatkan detail dari setiap topik.
         * Contoh: GET /api/topics?ids=[topicId1,topicId2,...]
         * 3. Gabungkan data di sisi frontend.
         */

        res.status(200).json(grades);
    } catch (error) {
        console.error("Gagal mengambil data nilai:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data nilai." });
    }
};


// --- FUNGSI BARU: Guru mengambil daftar submission untuk satu tugas ---
export const getSubmissionsForAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: assignmentId } = req.params;
    const teacherId = req.user?.userId;

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: Number(assignmentId) },
            include: {
                // PERBAIKAN: Hapus include ke 'topic' dan 'student'
                submissions: {
                    orderBy: { submissionDate: 'asc' },
                }
            }
        });

        if (!assignment) {
            res.status(404).json({ message: 'Tugas tidak ditemukan.' });
            return;
        }
        
        /*
         * ARSITEKTUR MICROSERVICE:
         * Verifikasi guru harus dilakukan dengan memanggil Course Service.
         * 1. Ambil `assignment.topicId`.
         * 2. Panggil endpoint internal di `course-service`.
         * Contoh: const response = await axios.get(`${COURSE_SERVICE_URL}/internal/topics/${assignment.topicId}/teacher`);
         * 3. Bandingkan `response.data.teacherId` dengan `teacherId` yang sedang login.
         * Jika tidak cocok, kirim error 403.
         */

        /*
         * ARSITEKTUR MICROSERVICE:
         * Untuk mendapatkan nama siswa:
         * 1. Kumpulkan semua `studentId` dari `assignment.submissions`.
         * 2. Panggil endpoint internal di `user-service`.
         * Contoh: const userResponse = await axios.get(`${USER_SERVICE_URL}/internal/users?ids=[id1,id2]`);
         * 3. Gabungkan hasilnya sebelum dikirim ke frontend.
         */

        res.status(200).json(assignment);

    } catch (error) {
        console.error("Gagal mengambil data submission:", error)
        res.status(500).json({ message: 'Gagal mengambil data submission.' });
    }
};

// --- FUNGSI BARU: Guru memberikan/memperbarui nilai ---
export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    const { submissionId } = req.params;
    const { score } = req.body;
    const teacherId = req.user?.userId;

    if (score === undefined || isNaN(parseFloat(score))) {
        res.status(400).json({ message: 'Nilai harus berupa angka.' });
        return;
    }

    try {
        const submission = await prisma.submission.findUnique({
            where: { id: Number(submissionId) },
        });

        if (!submission) {
            res.status(404).json({ message: 'Submisi tidak ditemukan.' });
            return;
        }

        /*
         * ARSITEKTUR MICROSERVICE:
         * 1. Dapatkan `assignmentId` dari submission.
         * 2. Panggil Course Service untuk cek apakah `teacherId` berhak mengelola `assignmentId` ini.
         * Contoh: const { isAllowed } = await axios.get(`${COURSE_SERVICE_URL}/internal/assignments/${submission.assignmentId}/can-grade?teacherId=${teacherId}`);
         * 3. Jika tidak diizinkan, kembalikan error 403.
        */

        // Asumsi validasi ke Course Service berhasil
        const updatedSubmission = await prisma.submission.update({
            where: { id: Number(submissionId) },
            data: { score: parseFloat(score) },
        });

        res.status(200).json(updatedSubmission);
    } catch (error) {
        console.error('Gagal memberi nilai:', error);
        res.status(500).json({ message: 'Gagal memperbarui nilai.' });
    }
};