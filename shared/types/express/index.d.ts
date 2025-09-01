import { TokenPayload } from "../../middlewares/auth.middleware";
import 'multer';

declare global {
  namespace Express {
    export interface Request {
      user?: TokenPayload;
      file?: Express.Multer.File;
    }
  }
}