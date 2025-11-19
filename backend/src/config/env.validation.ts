/**
 * Environment validation utility
 * Validates required environment variables on application startup
 */

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'REDIS_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
];

const optionalEnvVars = [
  'GOOGLE_PAGESPEED_API_KEY',
  'MOZ_ACCESS_ID',
  'MOZ_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
];

/**
 * Validates all required environment variables
 * @throws Error if any required variable is missing or invalid
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Check for missing required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate specific formats
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    errors.push('PORT must be a valid number');
  }

  if (process.env.DB_PORT && isNaN(Number(process.env.DB_PORT))) {
    errors.push('DB_PORT must be a valid number');
  }

  if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://')) {
    errors.push('REDIS_URL must start with redis://');
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    errors.push(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }

  // Throw error if any validation failed
  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  // Return validated config
  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: Number(process.env.PORT),
    DB_HOST: process.env.DB_HOST as string,
    DB_PORT: Number(process.env.DB_PORT),
    DB_NAME: process.env.DB_NAME as string,
    DB_USER: process.env.DB_USER as string,
    DB_PASSWORD: process.env.DB_PASSWORD as string,
    REDIS_URL: process.env.REDIS_URL as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
  };
}

/**
 * Prints environment configuration summary (without sensitive data)
 */
export function printEnvSummary(): void {
  console.log('\n=== Environment Configuration ===');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`PORT: ${process.env.PORT}`);
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`REDIS_URL: ${process.env.REDIS_URL?.split('@')[1] || 'configured'}`);
  console.log(`JWT_SECRET: ${'*'.repeat(32)} (hidden)`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);

  // Optional services
  console.log('\n=== Optional Services ===');
  console.log(`Stripe: ${process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Email (SMTP): ${process.env.SMTP_HOST ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Google PageSpeed API: ${process.env.GOOGLE_PAGESPEED_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Moz API: ${process.env.MOZ_ACCESS_ID ? '✓ Configured' : '✗ Not configured'}`);
  console.log('=================================\n');
}

/**
 * Gets optional environment variable with default value
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Checks if a specific optional service is configured
 */
export function isServiceConfigured(service: 'stripe' | 'email' | 'pagespeed' | 'moz'): boolean {
  switch (service) {
    case 'stripe':
      return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    case 'email':
      return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    case 'pagespeed':
      return !!process.env.GOOGLE_PAGESPEED_API_KEY;
    case 'moz':
      return !!(process.env.MOZ_ACCESS_ID && process.env.MOZ_SECRET_KEY);
    default:
      return false;
  }
}
