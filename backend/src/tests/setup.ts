import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

// Use test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

export const testPrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL },
  },
});

beforeAll(async () => {
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
