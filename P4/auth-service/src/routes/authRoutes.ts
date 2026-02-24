import { Router } from 'express';
import * as ctrl from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register',  ctrl.register);
router.post('/login',     ctrl.login);
router.get('/me',         authMiddleware, ctrl.me);
router.post('/logout',    ctrl.logout);
router.get('/validate',   authMiddleware, ctrl.validate);

export default router;
