import { Request, Response } from 'express';
import prisma from '../prismaClient';

// Lấy danh sách toàn bộ phòng
export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany();
    res.status(200).json({ success: true, data: rooms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm một phòng mới
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, price, type, status } = req.body;
    
    const newRoom = await prisma.room.create({
      data: {
        name,
        price,
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
    const { name, price, type, status } = req.body;

    const updatedRoom = await prisma.room.update({
      where: { id: Number(id) },
      data: { name, price, type, status }
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
