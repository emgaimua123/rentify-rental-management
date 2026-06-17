import express from 'express';
import { register, login, getMe, getUsers, updateProfile } from './auth.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Xác thực & quản lý tài khoản (Authentication)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới (user đầu tiên tự động là ADMIN)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, name]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *     responses:
 *       201:
 *         description: Đăng ký thành công, trả về thông tin user kèm JWT token
 *       400:
 *         description: Thiếu thông tin hoặc username/email đã tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về thông tin user kèm JWT token
 *       400:
 *         description: Thiếu tên đăng nhập hoặc mật khẩu
 *       401:
 *         description: Sai tên đăng nhập hoặc mật khẩu
 *       500:
 *         description: Lỗi server
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản đang đăng nhập
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng hiện tại
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               avatar:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Mật khẩu mới (nếu muốn đổi)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Lấy danh sách toàn bộ người dùng (kèm trạng thái gói Pro)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.get('/users', protect, getUsers);

export default router;
