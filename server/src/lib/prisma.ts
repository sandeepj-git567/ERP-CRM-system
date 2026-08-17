import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Set DATABASE_URL here at module level so it is defined BEFORE PrismaClient
// is created, regardless of import hoisting in the calling module.
// pgbouncer=true disables prepared statements (required for PgBouncer transaction mode)
// connection_limit=1 is required for serverless environments
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres.vqxgcevxxetjftgnsrxa:%40Sandeepj9660@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
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


