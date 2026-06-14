import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../core/database/prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'rentify-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

const generateToken = (id: number | string) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin.' });
    }

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email: email || '' }] } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc Email đã tồn tại.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: { id: true, username: true, name: true, role: true, email: true, avatar: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
