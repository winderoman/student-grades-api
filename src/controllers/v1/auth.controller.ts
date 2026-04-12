import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.register(req.body);
      sendCreated(res, user.toSafeObject(), 'Usuario registrado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      sendSuccess(res, result, 'Inicio de sesión exitoso');
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const accessToken = await AuthService.refreshToken(refreshToken);
      sendSuccess(res, { accessToken }, 'Token renovado');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      sendSuccess(res, null, 'Contraseña actualizada exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, req.user, 'Perfil del usuario actual');
    } catch (err) {
      next(err);
    }
  },
};
