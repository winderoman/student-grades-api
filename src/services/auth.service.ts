import jwt from 'jsonwebtoken';
import { User } from '../models';
import { JwtPayload, UserRole } from '../types';
import { AppError } from '../utils/AppError';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface LoginResult {
  user: ReturnType<User['toSafeObject']>;
  accessToken: string;
  refreshToken: string;
}

const signToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string): string =>
  jwt.sign(payload, process.env.JWT_SECRET ?? '', { expiresIn } as jwt.SignOptions);

export const AuthService = {
  async register(data: RegisterPayload): Promise<User> {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new Error('El email ya está registrado');

    return User.create(data);
  },

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) throw new AppError('Usuario no encontrado o inactivo', 404);

    const valid = await user.comparePassword(password);
    if (!valid) throw new AppError('Credenciales Invalidas', 401);

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signToken(payload, process.env.JWT_EXPIRES_IN ?? '8h');
    const refreshToken = signToken(payload, process.env.JWT_REFRESH_EXPIRES_IN ?? '7d');

    return { user: user.toSafeObject(), accessToken, refreshToken };
  },

  async refreshToken(token: string): Promise<string> {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? ''
    ) as JwtPayload;

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');

    return signToken({ id: user.id, email: user.email, role: user.role }, process.env.JWT_EXPIRES_IN ?? '8h');
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new Error('Contraseña actual incorrecta');

    user.password = newPassword;
    await user.save();
  },
};
