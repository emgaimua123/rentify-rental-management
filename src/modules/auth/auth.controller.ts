import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../core/database/prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'rentify-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

const generateToken = (id: number, username: string, role: string) =>
  jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, name, email } = req.body;

    if (!username) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập.' });
    if (!password) return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu.' });
    if (!name)     return res.status(400).json({ success: false, message: 'Vui lòng nhập tên hiển thị.' });

    const userByUsername = await prisma.user.findUnique({ where: { username } });
    if (userByUsername) return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });

    if (email) {
      const userByEmail = await prisma.user.findFirst({ where: { email } });
      if (userByEmail) return res.status(400).json({ success: false, message: 'Email đã được sử dụng.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // First registered user gets ADMIN role automatically
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role,
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
        role: user.role,
        token: generateToken(user.id, user.username, user.role)
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
    if (!user) return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user.id, user.username, user.role)
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

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, avatar, password, email } = req.body;
    const userId = (req as any).user.id;

    const updateData: any = {};
    if (name)   updateData.name   = name;
    if (avatar) updateData.avatar = avatar;
    if (email !== undefined) updateData.email = email || null;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, name: true, email: true, avatar: true, role: true }
    });

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, name: true, role: true,
        email: true, createdAt: true, avatar: true,
        subscription: { select: { plan: true, status: true, expiresAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
