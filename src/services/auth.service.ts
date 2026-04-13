import jwt from 'jsonwebtoken';
import { User } from '../models';
import { JwtPayload, UserRole } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: ReturnType<User['toSafeObject']>;
  tokens: TokenPair;
}

const signToken = (
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string
): string => jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

const buildTokenPair = (user: User): TokenPair => {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signToken(
    payload,
    process.env.JWT_SECRET ?? '',
    process.env.JWT_EXPIRES_IN ?? '8h'
  );

  const refreshToken = signToken(
    payload,
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? '',
    process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
  );

  return { accessToken, refreshToken };
};

export const AuthService = {
  async register(data: RegisterPayload): Promise<User> {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new Error('El email ya está registrado');
    return User.create(data);
  },

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) throw new Error('Credenciales inválidas');

    const valid = await user.comparePassword(password);
    if (!valid) throw new Error('Credenciales inválidas');

    return { user: user.toSafeObject(), tokens: buildTokenPair(user) };
  },

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? ''
    ) as JwtPayload;

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');

    return buildTokenPair(user);
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