import { Router } from 'express';
import { AuthController } from '../../controllers/v1/auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';
import { loginSchema, registerSchema, changePasswordSchema } from '../../validators/auth.validator';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @access Admin only (via Postman/CLI seed)
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @route POST /api/v1/auth/login
 */
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);

/**
 * @route POST /api/v1/auth/refresh
 */
router.post('/refresh', AuthController.refresh);

/**
 * @route GET /api/v1/auth/me
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @route PATCH /api/v1/auth/change-password
 */
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

// Borra las cookies del cliente
router.post('/logout', AuthController.logout);

export default router;
