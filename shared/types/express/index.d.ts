// shared/src/types/express/index.d.ts

import { TokenPayload } from "../../middlewares/auth.middleware";
import 'multer';

declare global {
  namespace Express {
    export interface Request {
      user?: TokenPayload;          // Tambahkan properti user
      file?: Multer.File;           // Tambahkan properti file (untuk upload)
    }
  }
}

// Tidak perlu bikin AuthRequest lagi, cukup pakai Express.Request
export {}; // Supaya file ini dianggap sebagai modul oleh TS
