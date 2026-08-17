import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Supabase pooler URL with pgbouncer=true and statement_cache_size=0 to prevent
// "prepared statement already exists" errors in PgBouncer transaction mode
const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres.vqxgcevxxetjftgnsrxa:%40Sandeepj9660@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&statement_cache_size=0';

function createPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// In development: reuse singleton to avoid too many connections on hot-reload
// In production (serverless): create a fresh client per invocation
export const prisma =
  process.env.NODE_ENV !== 'production'
    ? (global.__prisma ?? (global.__prisma = createPrismaClient()))
    : createPrismaClient();

