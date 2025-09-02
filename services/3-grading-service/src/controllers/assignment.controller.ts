// Path: assignment.controller.ts
import { Response, NextFunction } from 'express';
// PERBAIKAN: Impor 'Assignment' dari Prisma Client
import { PrismaClient, AssignmentType, Question, Option, Assignment } from '@prisma/client';
import { AuthRequest } from 'shared/middlewares/auth.middleware';
import axios from 'axios'; // Diperlukan untuk komunikasi antar-service

const prisma = new PrismaClient();

const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:4002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4001';

interface CreateAssignmentBody {
    title: string;
    description?: string;
    type: AssignmentType;
    dueDate: string;
    questions?: {
        questionText: string;
        options?: { optionText: string; isCorrect: boolean; explanation?: string; }[];
    }[];
    externalUrl?: string;
    startTime?: string;
    endTime?: string;
    timeLimit?: number;
    attemptLimit?: number;
    passingGrade?: number;
}

// PERBAIKAN: Tipe ini harus menggabungkan 'Assignment', bukan 'AssignmentType'
type AssignmentWithQuestions = Assignment & {
    questions: (Question & {
        options: Option[];
    })[];
};

export const getSubmissionForReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Ini adalah submissionId
        const userId = req.user?.userId;

        const submission = await prisma.submission.findUnique({
            where: { id: Number(id) },
            include: {
                assignment: {
                    include: {
                        questions: {
                            orderBy: { id: 'asc' },
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });

        if (!submission || submission.studentId !== userId) {
            res.status(404).json({ message: "Hasil pengerjaan tidak ditemukan." });
            return;
        }

        res.status(200).json(submission);

    } catch (error) {
        console.error("Gagal mengambil data review:", error);
        res.status(500).json({ message: "Gagal mengambil data review." });
    }
};


export const createAssignmentForTopic = async (req: AuthRequest, res: Response): Promise<void> => {
    const { topicId } = req.params; 
    const { title, description, type, dueDate, questions, externalUrl,
        startTime, endTime, timeLimit, attemptLimit, passingGrade }: CreateAssignmentBody = req.body;

    if (!title || !dueDate || !type) {
        res.status(400).json({ message: "Judul, tanggal tenggat, dan tipe tugas wajib diisi." });
        return;
    }

    try {
        const newAssignment = await prisma.$transaction(async (tx) => {
            const assignment = await tx.assignment.create({
                data: {
                    title,
                    description,
                    type,
                    dueDate: new Date(dueDate),
                    topicId: Number(topicId),
                    externalUrl,
                    startTime: startTime ? new Date(startTime) : undefined,
                    endTime: endTime ? new Date(endTime) : undefined,
                    timeLimit,
                    attemptLimit,
                    passingGrade,
                },
            });

            if ((type === 'pilgan' || type === 'esai') && questions) {
                for (const q of questions) {
                    const createdQuestion = await tx.question.create({
                        data: {
                            questionText: q.questionText,
                            assignmentId: assignment.id,
                        },
                    });

                    if (type === 'pilgan' && q.options && q.options.length > 0) {
                        await tx.option.createMany({
                            data: q.options.map(opt => ({ ...opt, questionId: createdQuestion.id })),
                        });
                    }
                }
            }
            return assignment;
        });

        res.status(201).json(newAssignment);
    } catch (error) {
        console.error("GAGAL MEMBUAT TUGAS:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal saat menyimpan tugas." });
    }
};


export const submitAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const studentId = req.user?.userId;
        const { answers, essayAnswer, startedOn, timeTakenMs } = req.body;

        if (!studentId) {
            return res.status(401).json({ message: "Otentikasi gagal." });
        }
        
        // PERBAIKAN: Hapus query ke 'topic' dan 'classMember'
        const assignment = await prisma.assignment.findUnique({
            where: { id: Number(assignmentId) },
            include: {
                questions: { include: { options: { where: { isCorrect: true } } } },
            }
        }) as AssignmentWithQuestions | null;

        if (!assignment) {
            return res.status(404).json({ message: "Tugas tidak ditemukan." });
        }

        /*
         * ARSITEKTUR MICROSERVICE:
         * Validasi keanggotaan kelas harus dilakukan via API call ke Course Service.
         * Contoh:
         * const response = await axios.get(`${COURSE_SERVICE_URL}/internal/is-enrolled?topicId=${assignment.topicId}&studentId=${studentId}`);
         * if (!response.data.isEnrolled) {
         * return res.status(403).json({ message: "Akses ditolak. Anda tidak terdaftar di kelas ini." });
         * }
        */

        let score = null;
        if (assignment.type === 'pilgan' && answers && assignment.questions.length > 0) {
            let correctCount = 0;
            assignment.questions.forEach(q => {
                if (answers[q.id] === q.options[0]?.id) {
                    correctCount++;
                }
            });
            score = (correctCount / assignment.questions.length) * 100;
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

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
    // ... (Implementasi yang sudah benar dari file sebelumnya)
    try {
        const { id } = req.params;
        const submissions = await prisma.submission.findMany({
            where: { assignmentId: Number(id) },
            orderBy: { submissionDate: 'asc' },
        });

        if (!submissions) {
            res.status(404).json({ message: "Submisi untuk tugas ini tidak ditemukan." });
            return;
        }
        res.status(200).json(submissions);
    } catch (error) {
        console.error("Gagal mengambil data pengumpulan tugas:", error);
        res.status(500).json({ message: "Gagal mengambil data pengumpulan." });
    }
};

export const getAssignmentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    // ... (Implementasi yang sudah benar dari file sebelumnya)
    try {
        const { id } = req.params;
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
            }
        });

        if (!assignment) {
            res.status(404).json({ message: 'Tugas atau kuis tidak ditemukan.' });
            return;
        }
        res.status(200).json(assignment);
    } catch (error) {
        console.error("Gagal mengambil detail tugas:", error);
        res.status(500).json({ message: 'Gagal mengambil detail tugas.' });
    }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { submissionId } = req.params;
        const { score } = req.body;
        const teacherId = req.user?.userId;

        if (score === undefined || isNaN(parseFloat(score))) {
            res.status(400).json({ message: "Nilai harus berupa angka." });
            return;
        }
        
        // PERBAIKAN: Hapus query ke service lain
        const submission = await prisma.submission.findUnique({
            where: { id: Number(submissionId) },
        });

        if (!submission) {
            res.status(404).json({ message: "Submisi tidak ditemukan." });
            return;
        }

        /*
         * ARSITEKTUR MICROSERVICE:
         * Verifikasi guru harus dilakukan via API call ke Course Service.
         * Contoh:
         * const assignmentResponse = await axios.get(`${COURSE_SERVICE_URL}/internal/assignments/${submission.assignmentId}`);
         * const topicResponse = await axios.get(`${COURSE_SERVICE_URL}/internal/topics/${assignmentResponse.data.topicId}`);
         * if (topicResponse.data.class.teacherId !== teacherId) {
         * return res.status(403).json({ message: "Akses ditolak." });
         * }
        */

        const updatedSubmission = await prisma.submission.update({
            where: { id: Number(submissionId) },
            data: { score: parseFloat(score) }
        });

        res.status(200).json(updatedSubmission);
    } catch (error) {
        console.error("Gagal memberikan nilai:", error);
        res.status(500).json({ message: "Gagal memberikan nilai." });
    }
};

export const getAssignmentsForTopic = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // ... (Implementasi ini sudah benar)
    const { topicId } = req.params;
    try {
        const assignments = await prisma.assignment.findMany({
            where: { topicId: Number(topicId) },
            orderBy: { dueDate: 'asc' },
            select: { id: true, title: true, type: true, dueDate: true }
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Gagal mengambil daftar tugas:", error);
        res.status(500).json({ message: "Gagal mengambil daftar tugas" });
    }
};

export const getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
    // PERBAIKAN: Hapus query ke 'topic', 'class', 'teacher'
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
            res.status(404).json({ message: 'Tugas atau kuis tidak ditemukan.' });
            return;
        }

        res.status(200).json(assignment);

    } catch (error) {
        console.error("Gagal mengambil detail tugas:", error);
        res.status(500).json({ message: 'Gagal mengambil detail tugas.' });
    }
};

export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    // ... (Implementasi ini sudah benar secara internal)
    const { id } = req.params;
    const { title, description, dueDate, type, externalUrl, startTime, endTime, timeLimit, attemptLimit, passingGrade } = req.body;

    // ... (kode validasi)

    try {
        const dataToUpdate: any = {
            title, description, type, dueDate: new Date(dueDate), externalUrl,
            startTime: startTime ? new Date(startTime) : null,
            endTime: endTime ? new Date(endTime) : null,
            timeLimit, attemptLimit, passingGrade
        };
        
        const updatedAssignment = await prisma.assignment.update({
            where: { id: Number(id) },
            data: dataToUpdate,
        });

        res.status(200).json(updatedAssignment);
    } catch (error) {
        console.error("Gagal mengupdate tugas:", error);
        res.status(500).json({ message: "Gagal mengupdate tugas." });
    }
};

export const getMyAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
        res.status(401).json({ message: "Otentikasi diperlukan." });
        return;
    }

    /*
     * ARSITEKTUR MICROSERVICE:
     * Fungsi ini sepenuhnya bergantung pada data dari service lain.
     * 1. Panggil Course Service untuk mendapatkan daftar topicId yang relevan untuk user ini.
     * - Jika guru: GET /internal/topics?teacherId=${userId}
     * - Jika siswa: GET /internal/topics?studentId=${userId}
     * 2. Setelah mendapatkan daftar topicId, gunakan ID tersebut untuk query ke database grading-service.
    */
    try {
        // Contoh implementasi setelah mendapatkan topicIds dari service lain
        // const topicIdsFromCourseService = [1, 2, 3]; // Hasil dari API call
        // const assignments = await prisma.assignment.findMany({
        //     where: {
        //         topicId: { in: topicIdsFromCourseService }
        //     }
        // });
        // res.status(200).json(assignments);

        // Untuk saat ini, kembalikan array kosong karena tidak bisa query langsung
        res.status(200).json([]);

    } catch (error) {
        console.error("Gagal mengambil tugas saya:", error);
        res.status(500).json({ message: "Gagal mengambil daftar tugas." });
    }
};