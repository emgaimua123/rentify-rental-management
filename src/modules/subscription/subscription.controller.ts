import { Request, Response } from 'express';
import prisma from '../../core/database/prismaClient';

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('getSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createOrUpdateSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plan, status, expiresAt, autoRenew } = req.body;

    if (!plan || !expiresAt) {
      return res.status(400).json({ success: false, message: 'plan and expiresAt are required' });
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: status || 'active',
        expiresAt: new Date(expiresAt),
        autoRenew: autoRenew !== undefined ? autoRenew : false
      },
      update: {
        ...(plan !== undefined && { plan }),
        ...(status !== undefined && { status }),
        ...(expiresAt !== undefined && { expiresAt: new Date(expiresAt) }),
        ...(autoRenew !== undefined && { autoRenew })
      }
    });

    return res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('createOrUpdateSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = (req as any).user;

    // Admin can see all requests
    let requests;
    if (user.role === 'ADMIN' || user.username === 'admin') {
      requests = await prisma.proRequest.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      requests = await prisma.proRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Map to include date field for frontend compatibility
    const result = requests.map((r: any) => ({
      ...r,
      date: r.createdAt.toISOString()
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('getProRequests error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createProRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plan, amount, type, username } = req.body;

    if (!plan || !type) {
      return res.status(400).json({ success: false, message: 'plan and type are required' });
    }

    // Check for duplicate pending request
    const existing = await prisma.proRequest.findFirst({
      where: { userId, plan, status: 'PENDING' }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Bạn đã có yêu cầu tương tự đang chờ duyệt!' });
    }

    const request = await prisma.proRequest.create({
      data: {
        userId,
        plan,
        amount: amount || 0,
        type,
        status: 'PENDING',
        username: username || null
      }
    });

    return res.status(201).json({
      success: true,
      data: { ...request, date: request.createdAt.toISOString() }
    });
  } catch (error) {
    console.error('createProRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN' && user.username !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid request id' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const existing = await prisma.proRequest.findUnique({ where: { id: requestId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ProRequest not found' });
    }

    const updated = await prisma.proRequest.update({
      where: { id: requestId },
      data: { status }
    });

    // If approved, create or update subscription
    if (status === 'APPROVED') {
      const isUpgrade = existing.type === 'upgrade_to_yearly' || existing.plan === 'upgrade_to_yearly';

      if (isUpgrade) {
        const existingSub = await prisma.subscription.findUnique({ where: { userId: existing.userId } });
        if (existingSub) {
          const currentExp = new Date(existingSub.expiresAt);
          currentExp.setDate(currentExp.getDate() + 365);
          await prisma.subscription.update({
            where: { userId: existing.userId },
            data: { plan: '1_year', expiresAt: currentExp, autoRenew: true, status: 'active' }
          });
        } else {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 365);
          await prisma.subscription.create({
            data: { userId: existing.userId, plan: '1_year', expiresAt, autoRenew: true, status: 'active' }
          });
        }
      } else {
        const durationDays = existing.plan === '1_year' ? 365 : 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        await prisma.subscription.upsert({
          where: { userId: existing.userId },
          create: { userId: existing.userId, plan: existing.plan, expiresAt, autoRenew: true, status: 'active' },
          update: { plan: existing.plan, expiresAt, autoRenew: true, status: 'active' }
        });
      }
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateProRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
