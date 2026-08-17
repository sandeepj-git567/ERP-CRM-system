import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Use pooler URL for Vercel/serverless; fall back to env var for local dev
const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres.vqxgcevxxetjftgnsrxa:%40Sandeepj9660@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';

// Prevent multiple instances of Prisma Client in development (hot-reload)
export const prisma =
  global.__prisma ??
  new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
