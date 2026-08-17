import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Session mode pooler (port 5432) is the correct choice for Prisma/ORMs.
// Unlike transaction mode (port 6543 + pgbouncer=true), session mode preserves
// connection state so prepared statements never conflict (no 42P05 errors).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres.vqxgcevxxetjftgnsrxa:%40Sandeepj9660@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?connection_limit=1&connect_timeout=30';
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// In development: reuse singleton to avoid too many connections on hot-reload
// In production/serverless: module cache handles singleton per process automatically
export const prisma =
  process.env.NODE_ENV !== 'production'
    ? (global.__prisma ?? (global.__prisma = createPrismaClient()))
    : createPrismaClient();


