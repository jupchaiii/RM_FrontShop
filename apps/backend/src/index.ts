import express from 'express';
import cors from 'cors';
import { config } from './config';
import { securityHeaders } from './middleware/security';
import { authRouter } from './routes/auth';
import { quoteRouter } from './routes/quote';
import { projectsRouter } from './routes/projects';
import { galleryRouter } from './routes/gallery';
import { adminRouter } from './routes/admin';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'remaker-api', time: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api', quoteRouter); // /api/quote, /api/materials, /api/pricing/config
app.use('/api/projects', projectsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/admin', adminRouter);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[remaker-api] listening on port ${config.port} (${config.nodeEnv})`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());

export { app };
