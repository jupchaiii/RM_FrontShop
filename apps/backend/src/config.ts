import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

const INSECURE_DEFAULTS: Record<string, string> = {
  JWT_SECRET: 'dev-secret-change-me',
  ADMIN_PASSWORD: 'admin1234',
};

/**
 * Reads a required env var. In development, falls back to `devFallback` so the
 * app is easy to run locally. In production, a missing value (or a value that
 * still matches the known insecure default) throws immediately at startup —
 * we want a crash-on-boot here, not a server silently running with a secret
 * that's sitting in plaintext in this repo's .env.example.
 */
function required(key: string, devFallback?: string): string {
  const value = process.env[key];
  if (value !== undefined && value !== '') {
    if (isProduction && INSECURE_DEFAULTS[key] && value === INSECURE_DEFAULTS[key]) {
      throw new Error(
        `Refusing to start in production with the default ${key} value. Set a real ${key} in the environment.`
      );
    }
    return value;
  }
  if (!isProduction && devFallback !== undefined) {
    return devFallback;
  }
  throw new Error(`Missing required environment variable: ${key}`);
}

export const config = {
  nodeEnv,
  isProduction,
  port: parseInt(process.env.PORT ?? '5000', 10),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),
  jwtSecret: required('JWT_SECRET', INSECURE_DEFAULTS.JWT_SECRET),
  jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@remaker.work',
  adminPassword: required('ADMIN_PASSWORD', INSECURE_DEFAULTS.ADMIN_PASSWORD),
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '104857600', 10),
};
