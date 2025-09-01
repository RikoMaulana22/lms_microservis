// shared/src/types/express/index.d.ts

import { TokenPayload } from "../../middlewares/auth.middleware";
import 'multer';
// Memberitahu TypeScript untuk menggabungkan deklarasi ini
// ke dalam namespace Express yang sudah ada.
declare global {
  namespace Express {
    export interface Request {
      user?: TokenPayload; // Menambahkan properti 'user' opsional ke Request
      file?: Express.Multer.File;
    }
  }
}