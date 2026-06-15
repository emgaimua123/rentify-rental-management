import { PrismaClient } from '../../../src/generated/client';

const prisma = new PrismaClient();

// Backward-compat alias — all controllers call getPrisma(req) historically
export const getPrisma = (_req?: any) => prisma;

export default prisma;
