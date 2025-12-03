import { Router } from 'express';
import authController from './auth.controller';
import { validate } from '@middleware/validate.middleware';
import { authenticate } from '@middleware/auth.middleware';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.validators';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
