// Path: server/src/routes/index.ts

import { Router } from 'express';
import classRoutes from './class.routes';
import subjectRoutes from './subject.routes';

import { authenticate } from '../middlewares/auth.middleware';
import topicRoutes from './topic.routes';

import submissionRoutes from './submission.routes';










const mainRouter = Router();

// Rute publik

// Rute yang dilindungi autentikasi umum
mainRouter.use('/classes', authenticate, classRoutes);
mainRouter.use('/subjects', authenticate, subjectRoutes);

mainRouter.use('/topics', authenticate, topicRoutes); // <-- BARIS BARU
mainRouter.use('/submissions', authenticate, submissionRoutes); // <-- BARIS BARU
;








export default mainRouter;