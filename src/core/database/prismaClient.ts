import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prismaAdmin = new PrismaClient();
export const prismaTemp = new PrismaClient({
    datasources: {
        db: {
            url: 'file:./temp.db'
        }
    }
});

export const getPrisma = (req: any) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rentify-secret-key-2026') as any;
            if (decoded && decoded.username === 'admin') {
                return prismaAdmin;
            }
        }
    } catch (e) {
        // ignore
    }
    return prismaTemp;
};

export default prismaAdmin;
