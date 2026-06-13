import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { CreateRoomInput, UpdateRoomInput, BulkGenerateRoomsDTO } from '../dtos/room.dto';

// Lấy danh sách toàn bộ phòng (Có hỗ trợ phân trang và lọc trạng thái)
export const getRooms = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const rooms = await prisma.room.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
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
    const room = await prisma.room.findUnique({
      where: { id: Number(id) }
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

// Cập nhật thông tin phòng (đổi giá, đổi loại phòng)
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, area, type, status } = req.body as UpdateRoomInput;

    const updatedRoom = await prisma.room.update({
      where: { id: Number(id) },
      data: { name, price, area, type, status }
    });

    res.status(200).json({ success: true, data: updatedRoom });
  } catch (error: any) {
    // Lỗi P2025 là Record to update not found trong Prisma
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa phòng
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem phòng có tồn tại không
    const room = await prisma.room.findUnique({
      where: { id: Number(id) }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    // Xóa phòng
    await prisma.room.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({ success: true, message: 'Xóa phòng thành công.' });
  } catch (error: any) {
    // Prisma Foreign Key Constraint Failed Error Code là P2003
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa phòng đang có người thuê' 
      });
    }
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
