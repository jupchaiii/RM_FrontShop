import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '5000', 10),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@remaker.work',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin1234',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '104857600', 10),
};
