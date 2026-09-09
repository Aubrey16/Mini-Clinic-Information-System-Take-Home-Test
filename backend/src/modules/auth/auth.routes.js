import { Router } from 'express';
import { login, logout } from './auth.controller.js';
import { loginSchema } from './auth.validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);

export default router;
