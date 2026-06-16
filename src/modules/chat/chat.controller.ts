import { Request, Response } from 'express';
import prisma from '../../core/database/prismaClient';

const getAdminUser = async () => {
  return prisma.user.findFirst({ where: { role: 'ADMIN' } });
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    const isAdmin = me.role === 'ADMIN' || me.username === 'admin';

    let partnerId: number;
    if (isAdmin) {
      partnerId = parseInt(req.query.userId as string);
      if (isNaN(partnerId)) {
        return res.status(400).json({ success: false, message: 'userId required for admin' });
      }
    } else {
      const admin = await getAdminUser();
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
      partnerId = admin.id;
    }

    const messages = await (prisma as any).chatMessage.findMany({
      where: {
        OR: [
          { fromId: me.id, toId: partnerId },
          { fromId: partnerId, toId: me.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    await (prisma as any).chatMessage.updateMany({
      where: { fromId: partnerId, toId: me.id, isRead: false },
      data: { isRead: true }
    });

    return res.json({ success: true, data: messages });
  } catch (e) {
    console.error('getMessages error', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    const isAdmin = me.role === 'ADMIN' || me.username === 'admin';
    const { message, toId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let recipientId: number;
    if (isAdmin) {
      recipientId = parseInt(toId);
      if (isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: 'toId required for admin' });
      }
    } else {
      const admin = await getAdminUser();
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
      recipientId = admin.id;
    }

    const msg = await (prisma as any).chatMessage.create({
      data: { fromId: me.id, toId: recipientId, message: message.trim() }
    });

    return res.status(201).json({ success: true, data: msg });
  } catch (e) {
    console.error('sendMessage error', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    const count = await (prisma as any).chatMessage.count({
      where: { toId: me.id, isRead: false }
    });
    return res.json({ success: true, data: count });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    if (me.role !== 'ADMIN' && me.username !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const messages = await (prisma as any).chatMessage.findMany({
      where: { OR: [{ toId: me.id }, { fromId: me.id }] },
      orderBy: { createdAt: 'desc' }
    });

    const convMap = new Map<number, any>();
    messages.forEach((m: any) => {
      const partnerId = m.fromId === me.id ? m.toId : m.fromId;
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, { userId: partnerId, lastMessage: m.message, lastTime: m.createdAt, unread: 0 });
      }
      if (m.toId === me.id && !m.isRead) {
        convMap.get(partnerId).unread++;
      }
    });

    const userIds = [...convMap.keys()];
    if (userIds.length === 0) return res.json({ success: true, data: [] });

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true, avatar: true }
    });

    const result = users.map(u => ({ ...u, ...convMap.get(u.id) }))
      .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

    return res.json({ success: true, data: result });
  } catch (e) {
    console.error('getConversations error', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
