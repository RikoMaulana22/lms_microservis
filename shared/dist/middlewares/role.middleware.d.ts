import { Response, NextFunction } from 'express';
import { AuthRequest, TokenPayload } from './auth.middleware';
type Role = TokenPayload['role'];
export declare const authorize: (allowedRoles: Role | Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
