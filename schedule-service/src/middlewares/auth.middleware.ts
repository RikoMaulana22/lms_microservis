import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
  role: 'guru' | 'siswa' | 'admin' | 'wali_kelas';
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  
  // Pengecekan yang lebih aman untuk memastikan authHeader adalah string
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia atau format salah.' });
    return;
  }

  // Mengambil token dengan cara yang lebih aman daripada split
  const token = authHeader.substring(7);

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("FATAL ERROR: JWT_SECRET tidak terdefinisi. Pastikan file .env sudah ada dan dimuat.");
      res.status(500).json({ message: 'Kesalahan internal pada konfigurasi server.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};