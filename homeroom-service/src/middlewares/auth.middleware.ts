import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface untuk payload JWT
export interface TokenPayload {
  userId: number;
  role: 'guru' | 'siswa' | 'admin' | 'wali_kelas';
}

// Tambahkan properti 'user' ke tipe Request dari Express
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia atau format salah.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;

    // Pengecekan penting untuk memastikan .env sudah dimuat
    if (!secret) {
      console.error("FATAL ERROR: JWT_SECRET tidak terdefinisi. Pastikan .env sudah dimuat.");
      res.status(500).json({ message: 'Kesalahan internal pada konfigurasi server.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    // Log error ini akan muncul di terminal backend Anda, sangat membantu.
    // Memastikan err adalah instance dari Error untuk mengakses properti message.
    console.error("JWT Verification Error:", (err as Error).message); 
    res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
};