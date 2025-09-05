import { Request, Response, NextFunction } from 'express';
export interface TokenPayload {
    userId: number;
    role: 'guru' | 'siswa' | 'admin' | 'wali_kelas';
}
export interface AuthRequest extends Request {
    user?: TokenPayload;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => void;
