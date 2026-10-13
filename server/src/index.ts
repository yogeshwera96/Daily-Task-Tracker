import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { rateLimit } from 'express-rate-limit';
import { config } from './config';
import logger from './config/logger';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initCronJobs } from './cron';
import prisma from './config/database';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api', limiter);

// Server check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'Disconnected' });
  }
});

// Mounting routes
app.use('/api', apiRoutes);

// File uploads serving
app.use('/uploads', express.static(config.upload.dir));

// Static frontend serving for production / unified deployment
const clientDistCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const clientDist = clientDistCandidates.find((dir) => fs.existsSync(dir));

if (clientDist) {
  logger.info(`Serving static client files from ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error routing handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
  
  // Start cron scheduler
  initCronJobs();
});

// Graceful Shutdown
const shutdown = async () => {
  logger.info('Shutting down server gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
