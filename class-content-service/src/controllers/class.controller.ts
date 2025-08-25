// Path: class-content-service/src/controllers/class.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

const prisma = new PrismaClient();
export const checkIsHomeroomTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;

       const teacherIdAsNumber = parseInt(teacherId, 10);
    const homeroomClass = await prisma.class.findFirst({
      // Gunakan variabel yang sudah dikonversi menjadi number
      where: { homeroomTeacherId: teacherIdAsNumber },
    });
    
    // Kirim respons boolean yang jelas
    res.status(200).json({ isHomeroomTeacher: !!homeroomClass });

  } catch (error) {
    console.error("Gagal memeriksa status wali kelas:", error);
    res.status(500).json({ message: "Gagal memvalidasi status wali kelas." });
  }
};

export const createClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, description, subjectId } = req.body;
        const teacherId = req.user?.userId;

        // PERBAIKAN: req.file sekarang sudah dikenali
        const imageUrl = req.file ? req.file.path.replace('public', '').replace(/\\/g, '/') : null;

        if (!name || !subjectId || !teacherId) {
            res.status(400).json({ message: 'Nama kelas, ID mata pelajaran, dan ID guru wajib diisi.' });
            return;
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                description,
                teacherId,
                subjectId: Number(subjectId),
                imageUrl: imageUrl,
            }
        });
        res.status(201).json(newClass);
    }  catch (error: unknown) { // Menangani error sebagai tipe 'unknown'
        console.error("Gagal membuat kelas:", error);
        // Lakukan pemeriksaan tipe secara eksplisit
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
            res.status(400).json({ message: 'ID Mata Pelajaran tidak valid.' });
            return;
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat membuat kelas.' });
    }

};
export const getTeacherClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const teacherId = req.user?.userId;
        if (!teacherId) {
            res.status(401).json({ message: 'Otentikasi guru diperlukan.' });
            return;
        }
        const classes = await prisma.class.findMany({
            where: { teacherId },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                subject: true,
                _count: {
                    select: { members: true }
                }
            }
        });
        res.status(200).json(classes);
    } catch (error: unknown) {
        console.error("Gagal mengambil data kelas:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data kelas.' });
    }
};

export const getClassById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const classData = await prisma.class.findUnique({
            where: { id: Number(id) },
            include: {
                subject: true,
                teacher: { 
                    select: { 
                        id: true, 
                        fullName: true 
                    } 
                },
                members: {
                    where: { studentId: userId },
                    select: { studentId: true }
                },
                topics: {
                    orderBy: { order: 'asc' },
                    include: {
                        materials: { orderBy: { createdAt: 'asc' } },
                        assignments: {
                            orderBy: { createdAt: 'asc' },
                            include: {
                                submissions: {
                                    where: { studentId: userId }
                                }
                            }
                        },
                        attendance: true
                    }
                },
            },
        });

        if (!classData) {
            res.status(404).json({ message: 'Kelas tidak ditemukan.' });
            return;
        }

        const processedTopics = classData.topics.map((topic: any) => {
            const processedAssignments = topic.assignments.map((assignment: any) => {
                const submissions = (assignment as any).submissions || [];

                const studentProgress = {
                    attemptCount: submissions.length,
                    highestScore: submissions.length > 0
                        ? Math.max(...submissions.map((sub: { score: number | null }) => sub.score || 0))
                        : null
                };

                delete (assignment as any).submissions;

                return { ...assignment, studentProgress };
            });

            return { ...topic, assignments: processedAssignments };
        });

        const isEnrolled = classData.members.length > 0 || classData.teacher.id === userId;
        const { members, ...responseData } = classData;

        res.status(200).json({ ...responseData, topics: processedTopics, isEnrolled });

    } catch (error: unknown) {
        console.error("Gagal mengambil detail kelas:", error);
        res.status(500).json({ message: 'Gagal mengambil detail kelas.' });
    }
};

export const enrolInClass = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: classId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
        res.status(401).json({ message: "Otentikasi diperlukan." });
        return;
    }
    try {
        const existingMembership = await prisma.class_Members.findUnique({
            where: {
                studentId_classId: {
                    studentId,
                    classId: Number(classId)
                }
            }
        });

        if (existingMembership) {
            res.status(409).json({ message: "Anda sudah terdaftar di kelas ini." });
            return;
        }

        await prisma.class_Members.create({
            data: {
                studentId,
                classId: Number(classId)
            }
        });

        res.status(201).json({ message: "Pendaftaran berhasil!" });
    } catch (error: unknown) {
        console.error("Gagal mendaftar ke kelas:", error);
        res.status(500).json({ message: "Gagal mendaftar ke kelas" });
    }
};

export const createTopicForClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: classId } = req.params;
        const { title, order } = req.body;

        if (!title || order === undefined) {
            res.status(400).json({ message: "Judul topik dan urutan wajib diisi." });
            return;
        }

        const newTopic = await prisma.topic.create({
            data: {
                title,
                order: Number(order),
                classId: Number(classId),
            }
        });
        res.status(201).json(newTopic);
    } catch (error: unknown) {
        console.error("Gagal membuat topik:", error);
        res.status(500).json({ message: 'Gagal membuat topik. Pastikan model Topic ada di skema database.' });
    }
};

export const getAllClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                name: true
            },
            orderBy: { name: 'asc' }
        });
        res.status(200).json(classes);
    } catch (error: unknown) {
        res.status(500).json({ message: "Gagal mengambil daftar kelas." });
    }
};

export const getStudentClasses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            res.status(401).json({ message: 'Otentikasi siswa diperlukan.' });
            return;
        }

        const memberships = await prisma.class_Members.findMany({
            where: {
                studentId: studentId,
            },
            select: {
                classId: true,
            },
        });

        const enrolledClassIds = memberships.map((member: { classId: number; }) => member.classId);

        if (enrolledClassIds.length === 0) {
            res.status(200).json([]);
            return;
        }

        const enrolledClasses = await prisma.class.findMany({
            where: {
                id: {
                    in: enrolledClassIds,
                },
            },
             select: {
                id: true,
                name: true,
                imageUrl: true,
                subject: {
                    select: { name: true }
                },
                teacher: {
                    select: { fullName: true }
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json(enrolledClasses);

    } catch (error: unknown) {
        console.error("Gagal mengambil data kelas siswa:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data kelas.' });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.class.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Kelas berhasil dihapus' });
  } catch (error: unknown) {
    console.error('Gagal menghapus kelas:', error);
    res.status(500).json({ message: 'Gagal menghapus kelas', error });
  }
};