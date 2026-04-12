import app from './app';
import { connectDatabase } from './config/database';
import logger from './utils/logger';

// Import models so Sequelize registers all associations before sync
import './models';

const PORT = Number(process.env.PORT) || 3000;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} — ENV: ${process.env.NODE_ENV ?? 'development'}`);
    logger.info(`📚 API base: http://localhost:${PORT}/api/v1`);
    logger.info(`❤️  Health:   http://localhost:${PORT}/health`);
  });

  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
};

startServer();
