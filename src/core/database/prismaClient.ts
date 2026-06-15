import { PrismaClient } from '../../generated/client';

const prisma = new PrismaClient();

// Backward-compat alias — all controllers call getPrisma(req) historically
export const getPrisma = (_req?: any) => prisma;

export default prisma;
