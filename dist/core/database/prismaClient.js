"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = void 0;
const client_1 = require("../../../src/generated/client");
const prisma = new client_1.PrismaClient();
// Backward-compat alias — all controllers call getPrisma(req) historically
const getPrisma = (_req) => prisma;
exports.getPrisma = getPrisma;
exports.default = prisma;
