import { Request, Response, NextFunction, CookieOptions } from 'express';
import { AuthService } from '../../services/auth.service';
import { sendSuccess, sendCreated, sendUnauthorized } from '../../utils/response';

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,          // HTTPS en prod, HTTP en dev
  sameSite: isProd ? 'strict' : 'lax',
  maxAge: 8 * 60 * 60 * 1000,  // 8 horas en ms
  path: '/',
};

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 días en ms
  path: '/api/v1/auth/refresh',       // solo disponible en el endpoint de refresh
};

const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
  path: '/',
};

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
      const { user, tokens } = await AuthService.login(req.body.email, req.body.password);

      res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions);
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);

      // Solo retornamos datos del usuario — los tokens NO viajan en el body
      sendSuccess(res, { user }, 'Inicio de sesión exitoso');
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

      if (!refreshToken) {
        sendUnauthorized(res, 'Refresh token no encontrado');
        return;
      }

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions);
      // Renovar también el refresh token (rotación)
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);

      sendSuccess(res, null, 'Token renovado');
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(ACCESS_COOKIE, { ...clearCookieOptions });
    res.clearCookie(REFRESH_COOKIE, { ...clearCookieOptions, path: '/api/v1/auth/refresh' });
    sendSuccess(res, null, 'Sesión cerrada exitosamente');
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