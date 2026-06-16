import { Request, Response } from 'express';
import prisma from '../../core/database/prismaClient';
import { CreateRoomInput, UpdateRoomInput, BulkGenerateRoomsDTO } from './dtos/room.dto';
import { AddVideoLinkDTO } from '../media/dtos/media.dto';
import fs from 'fs';
import path from 'path';

const mapAutoStatus = (room: any) => {
  if (room.contracts && room.contracts.length > 0) {
    const currentContract = room.contracts[0];
    if (currentContract.tenant) {
      currentContract.tenantName = currentContract.tenant.name;
      currentContract.tenantPhone = currentContract.tenant.phone || '';
      currentContract.tenantEmail = currentContract.tenant.email || '';
    }
    if (currentContract.tenantList) {
      try {
        currentContract.tenantList = JSON.parse(currentContract.tenantList);
      } catch (e) {
        currentContract.tenantList = [];
      }
    } else {
      currentContract.tenantList = [];
    }
    const endDate = new Date(currentContract.endDate);
    endDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (room.status === 'Occupied' && endDate < today) {
      return { ...room, status: 'Available' };
    }
  }
  return room;
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false, userId };
    if (status) filter.status = status;

    const orderByClause = (sortBy && ['price', 'name'].includes(sortBy))
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    let rooms = await prisma.room.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: orderByClause as any,
      include: {
        medias: true,
        contracts: { orderBy: { createdAt: 'desc' }, take: 1, include: { tenant: true } }
      }
    });

    rooms = rooms.map(mapAutoStatus);
    const total = await prisma.room.count({ where: filter });

    res.status(200).json({
      success: true,
      data: rooms,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    let room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false, userId },
      include: {
        medias: true,
        contracts: { orderBy: { createdAt: 'desc' }, take: 1, include: { tenant: true } }
      }
    });

    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });

    res.status(200).json({ success: true, data: mapAutoStatus(room) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContractHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const rooms = await prisma.room.findMany({
      where: { isDeleted: false, userId },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: { tenant: true }
        }
      }
    });

    const roomsWithContracts = rooms
      .filter(r => r.contracts && r.contracts.length > 0)
      .map(r => ({
        ...r,
        contracts: r.contracts.map(c => {
          let tenantList: any[] = [];
          if (c.tenantList) {
            try { tenantList = JSON.parse(c.tenantList); } catch (e) {}
          }
          return {
            ...c,
            tenantName: c.tenant ? c.tenant.name : '',
            tenantPhone: c.tenant ? (c.tenant.phone || '') : '',
            tenantEmail: c.tenant ? (c.tenant.email || '') : '',
            tenantList
          };
        })
      }));

    return res.json({ success: true, data: roomsWithContracts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContract = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    const { startDate, endDate, tenantName, tenantPhone, tenantList } = req.body;
    
    if (isNaN(contractId)) {
      return res.status(400).json({ success: false, message: 'Invalid contract ID' });
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        ...(startDate && { startDate: new Date(startDate.includes('T') ? startDate : `${startDate}T12:00:00.000Z`) }),
        ...(endDate && { endDate: new Date(endDate.includes('T') ? endDate : `${endDate}T12:00:00.000Z`) }),
        ...(tenantName && {
          tenant: {
            update: {
              name: tenantName,
              ...(tenantPhone && { phone: tenantPhone })
            }
          }
        }),
        ...(tenantList !== undefined && { tenantList: tenantList ? JSON.stringify(tenantList) : null })
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContract = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    if (isNaN(contractId)) {
      return res.status(400).json({ success: false, message: 'Invalid contract ID' });
    }

    await prisma.contract.delete({ where: { id: contractId } });
    return res.json({ success: true, message: 'Contract deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, price, area, type, status, tenantName, tenantCount, startDate, endDate } = req.body as CreateRoomInput;
    const { tenantPhone, tenantEmail, tenantList } = req.body as any;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên phòng là bắt buộc.' });
    }
    if (price === undefined || price <= 0) {
      return res.status(400).json({ success: false, message: 'Giá phòng phải lớn hơn 0.' });
    }

    if (status === 'Occupied') {
      if (!tenantName) return res.status(400).json({ success: false, message: 'Vui lòng nhập Tên người đại diện thuê.' });
      if (!startDate)  return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày bắt đầu hợp đồng.' });
      if (!endDate)    return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày kết thúc hợp đồng.' });
    }

    const newRoom = await prisma.room.create({
      data: {
        userId,
        name,
        price,
        area,
        type,
        status: status || 'Available',
        contracts: status === 'Occupied' && tenantName ? {
          create: {
            tenant: {
              create: { name: tenantName, phone: tenantPhone, email: tenantEmail }
            },
            tenantCount: tenantCount || 1,
            tenantList: tenantList ? JSON.stringify(tenantList) : null,
            startDate: new Date((startDate as string).includes('T') ? startDate as string : `${startDate}T12:00:00.000Z`),
            endDate:   new Date((endDate   as string).includes('T') ? endDate   as string : `${endDate}T12:00:00.000Z`)
          }
        } : undefined
      },
      include: { contracts: true }
    });

    res.status(201).json({ success: true, data: newRoom });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ success: false, message: 'Tên phòng này đã tồn tại, vui lòng chọn tên khác.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, price, area, type, status, tenantName, tenantCount, startDate, endDate } = req.body as UpdateRoomInput;
    const { tenantPhone, tenantEmail, tenantList } = req.body as any;

    const room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false, userId },
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1, include: { tenant: true } } }
    });

    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });

    if (status === 'Occupied') {
      if (room.status !== 'Occupied') {
        if (!tenantName) return res.status(400).json({ success: false, message: 'Vui lòng nhập Tên người đại diện thuê.' });
        if (!startDate)  return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày bắt đầu hợp đồng.' });
        if (!endDate)    return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày kết thúc hợp đồng.' });
        await prisma.contract.create({
          data: {
            room: { connect: { id: room.id } },
            tenant: { create: { name: tenantName, phone: tenantPhone, email: tenantEmail } },
            tenantCount: tenantCount || 1,
            tenantList: tenantList ? JSON.stringify(tenantList) : null,
            startDate: new Date((startDate as string).includes('T') ? startDate as string : `${startDate}T12:00:00.000Z`),
            endDate:   new Date((endDate   as string).includes('T') ? endDate   as string : `${endDate}T12:00:00.000Z`)
          }
        });
      } else {
        const currentContract = room.contracts[0];
        if (currentContract) {
          await prisma.contract.update({
            where: { id: currentContract.id },
            data: {
              tenant: tenantName ? { update: { name: tenantName, phone: tenantPhone, email: tenantEmail } } : undefined,
              tenantCount: tenantCount || currentContract.tenantCount,
              tenantList: tenantList ? JSON.stringify(tenantList) : null,
              startDate: startDate ? new Date((startDate as string).includes('T') ? startDate as string : `${startDate}T12:00:00.000Z`) : currentContract.startDate,
              endDate:   endDate   ? new Date((endDate   as string).includes('T') ? endDate   as string : `${endDate}T12:00:00.000Z`)   : currentContract.endDate
            }
          });
        }
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id: Number(id) },
      data: { name, price, area, type, status }
    });

    res.status(200).json({ success: true, data: updatedRoom });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ success: false, message: 'Tên phòng này đã tồn tại, vui lòng chọn tên khác.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false, userId }
    });

    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });

    const deletedName = `${room.name}_deleted_${Date.now()}`;
    await prisma.room.update({
      where: { id: Number(id) },
      data: { isDeleted: true, status: 'Maintenance', name: deletedName }
    });

    res.status(200).json({ success: true, message: 'Xóa phòng thành công.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkGenerateRooms = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { prefix, startNumber, endNumber, preset } = req.body as BulkGenerateRoomsDTO;

    if (startNumber > endNumber) return res.status(400).json({ success: false, message: 'startNumber <= endNumber.' });
    if (endNumber - startNumber + 1 > 50) return res.status(400).json({ success: false, message: 'Tối đa 50 phòng.' });

    const roomsToCreate = [];
    for (let i = startNumber; i <= endNumber; i++) {
      roomsToCreate.push({
        userId,
        name: `${prefix}${i}`,
        price: preset.price,
        area: preset.area,
        type: preset.type,
        status: preset.status || 'Available'
      });
    }

    const result = await prisma.room.createMany({ data: roomsToCreate });
    res.status(201).json({ success: true, message: `Tạo ${result.count} phòng thành công.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadRoomImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { roomId } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'File lỗi.' });

    const room = await prisma.room.findFirst({ where: { id: Number(roomId), isDeleted: false, userId } });
    if (!room) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    const media = await prisma.roomMedia.create({
      data: { roomId: Number(roomId), url: `/uploads/rooms/${file.filename}`, type: 'IMAGE' }
    });

    res.status(201).json({ success: true, data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addRoomVideo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { roomId } = req.params;
    const { url } = req.body as AddVideoLinkDTO;

    if (!url || !url.startsWith('http')) return res.status(400).json({ success: false, message: 'URL không hợp lệ.' });

    const room = await prisma.room.findFirst({ where: { id: Number(roomId), isDeleted: false, userId } });
    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });

    const media = await prisma.roomMedia.create({
      data: { roomId: Number(roomId), url, type: 'VIDEO' }
    });

    res.status(201).json({ success: true, data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoomMedia = async (req: Request, res: Response) => {
  try {
    const { mediaId } = req.params;

    const media = await prisma.roomMedia.findUnique({ where: { id: Number(mediaId) } });
    if (!media) return res.status(404).json({ success: false, message: 'Không tìm thấy media.' });

    if (media.type === 'IMAGE') {
      const filePath = path.join(process.cwd(), 'public/uploads/rooms', path.basename(media.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.roomMedia.delete({ where: { id: Number(mediaId) } });
    res.status(200).json({ success: true, message: 'Xóa thành công.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
