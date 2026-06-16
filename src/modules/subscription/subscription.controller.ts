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

    const { status, rejectionReason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const existing = await prisma.proRequest.findUnique({ where: { id: requestId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ProRequest not found' });
    }

    const updateData: any = { status, seenByUser: false };
    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updated = await prisma.proRequest.update({
      where: { id: requestId },
      data: updateData
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

export const grantProSubscription = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    if (admin.role !== 'ADMIN' && admin.username !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { userId, plan } = req.body;
    if (!userId || !plan) {
      return res.status(400).json({ success: false, message: 'userId and plan are required' });
    }
    const durationDays = plan === '1_year' ? 365 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const subscription = await prisma.subscription.upsert({
      where: { userId: parseInt(userId) },
      create: { userId: parseInt(userId), plan, expiresAt, autoRenew: false, status: 'active' },
      update: { plan, expiresAt, autoRenew: false, status: 'active' }
    });
    return res.json({ success: true, data: subscription });
  } catch (error: any) {
    console.error('grantProSubscription error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const revokeProSubscription = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    if (admin.role !== 'ADMIN' && admin.username !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const targetUserId = parseInt(req.params.userId);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Lý do thu hồi là bắt buộc' });
    }

    const sub = await prisma.subscription.findUnique({ where: { userId: targetUserId } });
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Người dùng không có gói Pro' });
    }

    await prisma.subscription.delete({ where: { userId: targetUserId } });

    await (prisma as any).userNotification.create({
      data: {
        userId: targetUserId,
        type: 'PRO_REVOKED',
        message: 'Gói Pro của bạn đã bị thu hồi bởi Admin.',
        reason: reason.trim()
      }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('revokeProSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifs = await (prisma as any).userNotification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: notifs });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifId = parseInt(req.params.id);
    if (isNaN(notifId)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const notif = await (prisma as any).userNotification.findUnique({ where: { id: notifId } });
    if (!notif || notif.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await (prisma as any).userNotification.update({
      where: { id: notifId },
      data: { isRead: true }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markProRequestSeen = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid request id' });
    }

    const existing = await prisma.proRequest.findUnique({ where: { id: requestId } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, message: 'ProRequest not found' });
    }

    await prisma.proRequest.update({
      where: { id: requestId },
      data: { seenByUser: true }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('markProRequestSeen error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
