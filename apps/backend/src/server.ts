import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

async function bootstrap() {
  logger.info('🚀 Starting StockWise IMS backend server...');

  // Database connectivity check
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ PostgreSQL database connection established.');
  } catch (error) {
    logger.fatal({ error }, '❌ Database connection failed. Aborting startup.');
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(
      `🎉 StockWise API server listening on http://localhost:${env.PORT}/api/v1 (env: ${env.NODE_ENV})`
    );
  });

  // Graceful shutdown handling
  let isShuttingDown = false;

  const gracefulShutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    // Force exit after 10s timeout
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await prisma.$disconnect();
        logger.info('Database client disconnected.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during database disconnection.');
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during server bootstrap');
  process.exit(1);
});

