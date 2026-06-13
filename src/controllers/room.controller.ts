import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { CreateRoomInput, UpdateRoomInput, BulkGenerateRoomsDTO } from '../dtos/room.dto';
import { AddVideoLinkDTO } from '../dtos/media.dto';
import fs from 'fs';
import path from 'path';

// Lấy danh sách toàn bộ phòng (Phân trang, Lọc trạng thái, Sắp xếp, Bỏ qua phòng đã xóa)
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

    const rooms = await prisma.room.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: orderByClause as any,
      include: { medias: true }
    });

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
    const room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false },
      include: { medias: true }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    res.status(200).json({ success: true, data: room });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm một phòng mới
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, price, area, type, status } = req.body as CreateRoomInput;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên phòng là bắt buộc.' });
    }
    if (price === undefined || price <= 0) {
      return res.status(400).json({ success: false, message: 'Giá phòng phải lớn hơn 0.' });
    }
    
    const newRoom = await prisma.room.create({
      data: {
        name,
        price,
        area,
        type,
        status: status || 'Available'
      }
    });

    res.status(201).json({ success: true, data: newRoom });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin phòng (Khóa logic cập nhật trạng thái nếu đang có người thuê)
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, area, type, status } = req.body as UpdateRoomInput;

    const room = await prisma.room.findFirst({
      where: { id: Number(id), isDeleted: false }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    // Nếu có thay đổi trạng thái, kiểm tra Hợp đồng
    if (status && status !== room.status) {
      const activeContract = await prisma.contract.findFirst({
        where: { 
          roomId: Number(id), 
          endDate: { gte: new Date() } // Hợp đồng chưa hết hạn
        }
      });

      if (activeContract) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không thể đổi trạng thái phòng vì đang có hợp đồng kích hoạt.' 
        });
      }
    }

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
      where: { id: Number(id), isDeleted: false }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    // Kiểm tra xem phòng có đang dính hợp đồng kích hoạt không
    const activeContract = await prisma.contract.findFirst({
      where: { 
        roomId: Number(id), 
        endDate: { gte: new Date() } 
      }
    });

    if (activeContract || room.status === 'Occupied') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa phòng đang có người thuê' 
      });
    }

    // Soft Delete: Chuyển isDeleted thành true
    await prisma.room.update({
      where: { id: Number(id) },
      data: { isDeleted: true, status: 'Maintenance' } // Tự động khóa phòng sau khi xóa mềm
    });

    res.status(200).json({ success: true, message: 'Xóa phòng thành công.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm nhiều phòng tự động theo quy tắc
export const bulkGenerateRooms = async (req: Request, res: Response) => {
  try {
    const { prefix, startNumber, endNumber, preset } = req.body as BulkGenerateRoomsDTO;

    // Bước 1: Validation
    if (startNumber > endNumber) {
      return res.status(400).json({ success: false, message: 'startNumber phải nhỏ hơn hoặc bằng endNumber.' });
    }
    
    const count = endNumber - startNumber + 1;
    if (count > 50) {
      return res.status(400).json({ success: false, message: 'Chỉ được tạo tối đa 50 phòng trong một lần request.' });
    }

    // Bước 2: Logic sinh mảng dữ liệu (Mapping)
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

    // Bước 3: Ghi vào Database
    const result = await prisma.room.createMany({
      data: roomsToCreate,
      skipDuplicates: true,
    });

    res.status(201).json({ 
      success: true, 
      message: `Đã tạo thành công ${result.count} phòng. Các phòng trùng lặp (nếu có) đã bị bỏ qua.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 1: Thêm ảnh từ máy (Upload Image)
export const uploadRoomImage = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh hoặc sai định dạng.' });
    }

    const room = await prisma.room.findFirst({ where: { id: Number(roomId), isDeleted: false } });
    if (!room) {
      // Xóa file vừa upload do room không hợp lệ
      fs.unlinkSync(file.path);
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    const media = await prisma.roomMedia.create({
      data: {
        roomId: Number(roomId),
        url: `/uploads/rooms/${file.filename}`,
        type: 'IMAGE'
      }
    });

    res.status(201).json({ success: true, data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 2: Thêm nguồn video (Add Video Link)
export const addRoomVideo = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { url } = req.body as AddVideoLinkDTO;

    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'URL không hợp lệ.' });
    }

    const room = await prisma.room.findFirst({ where: { id: Number(roomId), isDeleted: false } });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    const media = await prisma.roomMedia.create({
      data: {
        roomId: Number(roomId),
        url,
        type: 'VIDEO'
      }
    });

    res.status(201).json({ success: true, data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 3: Xóa Media
export const deleteRoomMedia = async (req: Request, res: Response) => {
  try {
    const { mediaId } = req.params;

    const media = await prisma.roomMedia.findUnique({
      where: { id: Number(mediaId) }
    });

    if (!media) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy media.' });
    }

    if (media.type === 'IMAGE') {
      const filename = path.basename(media.url);
      const filePath = path.join(process.cwd(), 'public/uploads/rooms', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.roomMedia.delete({
      where: { id: Number(mediaId) }
    });

    res.status(200).json({ success: true, message: 'Xóa media thành công.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
