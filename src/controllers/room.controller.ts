import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { CreateRoomInput, UpdateRoomInput, BulkGenerateRoomsDTO } from '../dtos/room.dto';
import { AddVideoLinkDTO } from '../dtos/media.dto';
import fs from 'fs';
import path from 'path';

// Hàm helper để map trạng thái tự động dựa trên hợp đồng
const mapAutoStatus = (room: any) => {
  if (room.status === 'Occupied' && room.contracts && room.contracts.length > 0) {
    const currentContract = room.contracts[0]; // Vì đã order by createdAt desc
    if (new Date(currentContract.endDate) < new Date()) {
      return { ...room, status: 'Available' }; // Đã hết hạn hợp đồng
    }
  }
  return room;
};

// Lấy danh sách toàn bộ phòng
export const getRooms = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false };
    if (status) {
      filter.status = status;
    }

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
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 } 
      }
    });

    // Cập nhật trạng thái động
    rooms = rooms.map(mapAutoStatus);

    const total = await prisma.room.count({ where: filter });

    res.status(200).json({ 
      success: true, 
      data: rooms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin chi tiết một phòng
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false },
      include: { 
        medias: true,
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    res.status(200).json({ success: true, data: mapAutoStatus(room) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm một phòng mới
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, price, area, type, status, tenantName, tenantCount, startDate, endDate } = req.body as CreateRoomInput;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên phòng là bắt buộc.' });
    }
    if (price === undefined || price <= 0) {
      return res.status(400).json({ success: false, message: 'Giá phòng phải lớn hơn 0.' });
    }
    
    if (status === 'Occupied') {
      if (!tenantName || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ Tên người thuê, Từ ngày, Đến ngày khi chọn Đang cho thuê.' });
      }
    }

    const newRoom = await prisma.room.create({
      data: {
        name,
        price,
        area,
        type,
        status: status || 'Available',
        contracts: status === 'Occupied' ? {
          create: {
            tenantName,
            tenantCount: tenantCount || 1,
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string)
          }
        } : undefined
      },
      include: { contracts: true }
    });

    res.status(201).json({ success: true, data: newRoom });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin phòng
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, area, type, status, tenantName, tenantCount, startDate, endDate } = req.body as UpdateRoomInput;

    const room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false },
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    // Xử lý Hợp đồng nếu phòng được chuyển sang Occupied hoặc Cập nhật hợp đồng hiện tại
    if (status === 'Occupied') {
      if (room.status !== 'Occupied') {
        // Tạo hợp đồng mới
        if (!tenantName || !startDate || !endDate) {
          return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin Hợp đồng.' });
        }
        await prisma.contract.create({
          data: {
            roomId: room.id,
            tenantName,
            tenantCount: tenantCount || 1,
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string)
          }
        });
      } else {
        // Cập nhật hợp đồng đang có
        const currentContract = room.contracts[0];
        if (currentContract) {
          await prisma.contract.update({
            where: { id: currentContract.id },
            data: {
              tenantName: tenantName || currentContract.tenantName,
              tenantCount: tenantCount || currentContract.tenantCount,
              startDate: startDate ? new Date(startDate as string) : currentContract.startDate,
              endDate: endDate ? new Date(endDate as string) : currentContract.endDate
            }
          });
        }
      }
    }

    // Update Room
    const updatedRoom = await prisma.room.update({
      where: { id: Number(id) },
      data: { name, price, area, type, status }
    });

    res.status(200).json({ success: true, data: updatedRoom });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa phòng (Soft Delete)
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false },
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    const currentContract = room.contracts[0];
    const isContractActive = currentContract && new Date(currentContract.endDate) >= new Date();

    if (room.status === 'Occupied' && isContractActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa phòng đang có người thuê (Hợp đồng còn hiệu lực)' 
      });
    }

    // Soft Delete
    await prisma.room.update({
      where: { id: Number(id) },
      data: { isDeleted: true, status: 'Maintenance' }
    });

    res.status(200).json({ success: true, message: 'Xóa phòng thành công.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm nhiều phòng tự động
export const bulkGenerateRooms = async (req: Request, res: Response) => {
  try {
    const { prefix, startNumber, endNumber, preset } = req.body as BulkGenerateRoomsDTO;

    if (startNumber > endNumber) return res.status(400).json({ success: false, message: 'startNumber <= endNumber.' });
    if (endNumber - startNumber + 1 > 50) return res.status(400).json({ success: false, message: 'Tối đa 50 phòng.' });

    const roomsToCreate = [];
    for (let i = startNumber; i <= endNumber; i++) {
      roomsToCreate.push({
        name: `${prefix}${i}`,
        price: preset.price,
        area: preset.area,
        type: preset.type,
        status: preset.status || 'Available',
      });
    }

    const result = await prisma.room.createMany({
      data: roomsToCreate,
      skipDuplicates: true,
    });

    res.status(201).json({ success: true, message: `Tạo ${result.count} phòng thành công.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 1: Upload Image
export const uploadRoomImage = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'File lỗi.' });

    const room = await prisma.room.findFirst({ where: { id: Number(roomId), isDeleted: false } });
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

// API 2: Add Video
export const addRoomVideo = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { url } = req.body as AddVideoLinkDTO;

    if (!url || !url.startsWith('http')) return res.status(400).json({ success: false, message: 'URL không hợp lệ.' });

    const room = await prisma.room.findFirst({ where: { id: Number(roomId), isDeleted: false } });
    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });

    const media = await prisma.roomMedia.create({
      data: { roomId: Number(roomId), url, type: 'VIDEO' }
    });

    res.status(201).json({ success: true, data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 3: Delete Media
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
