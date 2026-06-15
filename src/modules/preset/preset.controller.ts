import { Request, Response } from 'express';
import prisma from '../../core/database/prismaClient';

export const getPresets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const presets = await prisma.pricePreset.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    const result = presets.map(p => ({
      ...p,
      extraFees: p.extraFees ? JSON.parse(p.extraFees) : []
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('getPresets error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createPreset = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, electricPrice, waterPrice, managementFee, internetFee, parkingFee, extraFees } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Preset name is required' });
    }

    const preset = await prisma.pricePreset.create({
      data: {
        userId,
        name,
        electricPrice: electricPrice || 0,
        waterPrice: waterPrice || 0,
        managementFee: managementFee || 0,
        internetFee: internetFee || 0,
        parkingFee: parkingFee || 0,
        extraFees: extraFees ? JSON.stringify(extraFees) : null
      }
    });

    return res.status(201).json({
      success: true,
      data: { ...preset, extraFees: extraFees || [] }
    });
  } catch (error) {
    console.error('createPreset error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePreset = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const presetId = parseInt(req.params.id);

    if (isNaN(presetId)) {
      return res.status(400).json({ success: false, message: 'Invalid preset id' });
    }

    const existing = await prisma.pricePreset.findFirst({ where: { id: presetId, userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Preset not found' });
    }

    const { name, electricPrice, waterPrice, managementFee, internetFee, parkingFee, extraFees } = req.body;

    const updated = await prisma.pricePreset.update({
      where: { id: presetId },
      data: {
        ...(name !== undefined && { name }),
        ...(electricPrice !== undefined && { electricPrice }),
        ...(waterPrice !== undefined && { waterPrice }),
        ...(managementFee !== undefined && { managementFee }),
        ...(internetFee !== undefined && { internetFee }),
        ...(parkingFee !== undefined && { parkingFee }),
        ...(extraFees !== undefined && { extraFees: JSON.stringify(extraFees) })
      }
    });

    return res.json({
      success: true,
      data: {
        ...updated,
        extraFees: updated.extraFees ? JSON.parse(updated.extraFees) : []
      }
    });
  } catch (error) {
    console.error('updatePreset error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deletePreset = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const presetId = parseInt(req.params.id);

    if (isNaN(presetId)) {
      return res.status(400).json({ success: false, message: 'Invalid preset id' });
    }

    const existing = await prisma.pricePreset.findFirst({ where: { id: presetId, userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Preset not found' });
    }

    await prisma.pricePreset.delete({ where: { id: presetId } });
    return res.json({ success: true, message: 'Preset deleted' });
  } catch (error) {
    console.error('deletePreset error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
