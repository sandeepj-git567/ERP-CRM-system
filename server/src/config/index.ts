import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'fallback-secret-change-this',
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};

if (!process.env.JWT_SECRET && config.isProduction) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
