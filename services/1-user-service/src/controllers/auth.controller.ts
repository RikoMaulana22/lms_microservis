import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client'; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TokenPayload } from 'shared/middlewares/auth.middleware'; // Impor tipe payload
import { AuthRequest } from 'shared/middlewares/auth.middleware';


const prisma = new PrismaClient();



export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: 'Username dan password wajib diisi' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(404).json({ message: 'Username tidak ditemukan' });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Password salah' });
      return;
    }

    // --- PERBAIKAN DI SINI ---
    // Buat payload yang sesuai dengan interface TokenPayload (hanya userId dan role)
    const payload: TokenPayload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    // --- AKHIR PERBAIKAN ---

    res.status(200).json({
      message: 'Login berhasil!',
      token, // Token yang lebih ramping dan aman
      user: { // Data lengkap user tetap dikirim di body respons, ini sudah benar
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};
// --- FUNGSI BARU: Login Khusus Admin ---
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ message: 'Username dan password wajib diisi' });
            return;
        }
        
        // 1. Cari pengguna berdasarkan username
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(404).json({ message: 'Akun admin tidak ditemukan' });
            return;
        }

        // 2. Validasi Peran (Role) - INI YANG PALING PENTING
        if (user.role !== 'admin') {
            res.status(403).json({ message: 'Akses ditolak. Akun ini bukan admin.' });
            return;
        }

        // 3. Validasi Password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Password salah' });
            return;
        }

        // 4. Buat Token jika semua validasi berhasil
        const payload: TokenPayload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

        res.status(200).json({
            message: 'Login admin berhasil!',
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error saat login admin:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: "Otentikasi gagal." });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            // Pilih hanya data yang aman untuk dikirim ke frontend
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
            }
        });

        if (!user) {
            res.status(404).json({ message: "Pengguna tidak ditemukan." });
            return;
        }

        res.status(200).json(user);

    } catch (error) {
        console.error("Error saat mengambil data pengguna:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

export const loginHomeroomTeacher = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ message: 'Username dan password wajib diisi' });
            return;
        }
        
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(404).json({ message: 'Username tidak ditemukan' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Password salah' });
            return;
        }

        // --- VALIDASI KHUSUS WALI KELAS ---
        // Cek apakah guru ini adalah wali kelas di kelas manapun
        const homeroomClass = await prisma.class.findFirst({
            where: { homeroomTeacherId: user.id }
        });

        if (!homeroomClass) {
            res.status(403).json({ message: 'Akses ditolak. Anda bukan wali kelas.' });
            return;
        }
        // --- AKHIR VALIDASI ---

        const payload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

        res.status(200).json({
            message: 'Login wali kelas berhasil!',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error saat login wali kelas:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const role = req.query.role as Role;
    const whereCondition: { role?: Role } = {};
    if (role && (role === 'guru' || role === 'siswa')) {
        whereCondition.role = role;
    }
    try {
        const users = await prisma.user.findMany({
            where: whereCondition,
            select: { id: true, username: true, fullName: true, nisn: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error(`Gagal mengambil data pengguna:`, error);
        res.status(500).json({ message: `Gagal mengambil data pengguna` });
    }
};
export const createUser = async (req: AuthRequest, res: Response) => {
    // Ambil homeroomClassId dari body
    const { username, email, password, fullName, role, nisn, homeroomClassId } = req.body;

    if (!username || !email || !password || !fullName || !role) {
        return res.status(400).json({ message: "Field dasar wajib diisi." });
    }

    // Validasi jika peran wali_kelas tapi tidak memilih kelas
    if (role === 'wali_kelas' && !homeroomClassId) {
        return res.status(400).json({ message: "Silakan pilih kelas untuk wali kelas." });
    }

    try {
        // Gunakan transaksi untuk memastikan kedua operasi berhasil
        const newUser = await prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findFirst({ where: { OR: [{ username }, { email }] } });
            if (existingUser) {
                throw new Error("Username atau email sudah digunakan.");
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // 1. Buat pengguna baru
            const createdUser = await tx.user.create({
                data: {
                    username, email, password: hashedPassword, fullName, role,
                    nisn: role === 'siswa' ? nisn : null,
                }
            });

            // 2. Jika perannya wali_kelas, update kelas yang dipilih
            if (role === 'wali_kelas' && homeroomClassId) {
                await tx.class.update({
                    where: { id: parseInt(homeroomClassId) },
                    data: { homeroomTeacherId: createdUser.id }
                });
            }
            
            return createdUser;
        });

        const { password: _, ...userToReturn } = newUser;
        res.status(201).json(userToReturn);

    } catch (error: any) {
        if (error.message === "Username atau email sudah digunakan.") {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: "Gagal membuat pengguna baru." });
    }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { fullName, username, role, nisn, password } = req.body;
    try {
        const dataToUpdate: any = { fullName, username, role, nisn };
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate pengguna' });
    }
};
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user?.userId;
    const userIdToDelete = Number(id);

    if (userIdToDelete === adminId) {
        res.status(400).json({ message: "Anda tidak dapat menghapus akun Anda sendiri." });
        return;
    }
    try {
        const teachingClasses = await prisma.class.count({ where: { teacherId: userIdToDelete } });
        if (teachingClasses > 0) {
            res.status(400).json({ message: `Gagal: Pengguna ini masih menjadi guru di ${teachingClasses} kelas.` });
            return;
        }
        const announcements = await prisma.announcement.count({ where: { authorId: userIdToDelete } });
        if (announcements > 0) {
            res.status(400).json({ message: `Gagal: Pengguna ini adalah penulis dari ${announcements} pengumuman.` });
            return;
        }
        const schedules = await prisma.schedule.count({ where: { teacherId: userIdToDelete } });
        if (schedules > 0) {
            res.status(400).json({ message: `Gagal: Pengguna ini masih memiliki ${schedules} jadwal mengajar.` });
            return;
        }
        
        await prisma.user.delete({ where: { id: userIdToDelete } });
        res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus pengguna.' });
    }
};
