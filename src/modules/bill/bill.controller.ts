import { Request, Response } from 'express';
import prisma from '../../core/database/prismaClient';

export const getBills = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const bills = await prisma.bill.findMany({
      where: { userId },
      orderBy: { dateCreated: 'desc' }
    });
    return res.json({ success: true, data: bills });
  } catch (error) {
    console.error('getBills error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createBill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { roomId, roomName, month, total, totalAmount, paid, html, dateCreated } = req.body;

    if (!roomName || !month || !total || html === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const bill = await prisma.bill.create({
      data: {
        userId,
        roomId: roomId ? String(roomId) : null,
        roomName,
        month,
        total,
        totalAmount: totalAmount || 0,
        paid: paid || false,
        html,
        dateCreated: dateCreated ? new Date(dateCreated) : new Date()
      }
    });

    return res.status(201).json({ success: true, data: bill });
  } catch (error) {
    console.error('createBill error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateBill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const billId = parseInt(req.params.id);

    if (isNaN(billId)) {
      return res.status(400).json({ success: false, message: 'Invalid bill id' });
    }

    const existing = await prisma.bill.findFirst({ where: { id: billId, userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const { roomId, roomName, month, total, totalAmount, paid, html, dateCreated } = req.body;

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        ...(roomId !== undefined && { roomId: String(roomId) }),
        ...(roomName !== undefined && { roomName }),
        ...(month !== undefined && { month }),
        ...(total !== undefined && { total }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(paid !== undefined && { paid }),
        ...(html !== undefined && { html }),
        ...(dateCreated !== undefined && { dateCreated: new Date(dateCreated) })
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateBill error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteBill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const billId = parseInt(req.params.id);

    if (isNaN(billId)) {
      return res.status(400).json({ success: false, message: 'Invalid bill id' });
    }

    const existing = await prisma.bill.findFirst({ where: { id: billId, userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    await prisma.bill.delete({ where: { id: billId } });
    return res.json({ success: true, message: 'Bill deleted' });
  } catch (error) {
    console.error('deleteBill error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteBillsBatch = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
    }

    const numericIds = ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));

    const result = await prisma.bill.deleteMany({
      where: { id: { in: numericIds }, userId }
    });

    return res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('deleteBillsBatch error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
