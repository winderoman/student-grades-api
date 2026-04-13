import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import v1Routes from './routes/v1';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import logger from './utils/logger';

dotenv.config();

const app = express();

/* ── Security & parsing ─────────────────────────────────── */
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(cookieParser());

/* ── Rate limiting ──────────────────────────────────────── */
app.set('trust proxy', 1);
app.use(globalRateLimiter);

/* ── Health check ───────────────────────────────────────── */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: 'v1' });
});

/* ── API Routes ─────────────────────────────────────────── */
app.use('/api/v1', v1Routes);
/* ---- route test ---- */
app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

/* ── Error handling ─────────────────────────────────────── */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
