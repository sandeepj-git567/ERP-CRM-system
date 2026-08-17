// Ensure DATABASE_URL is set for Prisma in Vercel serverless environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres.vqxgcevxxetjftgnsrxa:%40Sandeepj9660@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
}

import app from '../server/src/app';

export default app;
