import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { getMessages, sendMessage, getUnreadCount, getConversations } from './chat.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Nhắn tin nội bộ giữa người dùng và Admin
 */

/**
 * @swagger
 * /api/chat/messages:
 *   get:
 *     summary: Lấy lịch sử tin nhắn (tự đánh dấu đã đọc)
 *     description: User lấy hội thoại với Admin. Admin phải truyền userId của đối tác cần xem.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: ID đối tác (bắt buộc khi gọi với tài khoản Admin)
 *     responses:
 *       200:
 *         description: Danh sách tin nhắn (cũ nhất trước)
 *       400:
 *         description: Admin chưa truyền userId
 *       404:
 *         description: Không tìm thấy Admin
 *       500:
 *         description: Lỗi server
 */
router.get('/chat/messages', protect, getMessages);

/**
 * @swagger
 * /api/chat/messages:
 *   post:
 *     summary: Gửi tin nhắn
 *     description: User gửi cho Admin. Admin phải truyền toId là người nhận.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Xin chào, em cần hỗ trợ ạ"
 *               toId:
 *                 type: integer
 *                 description: ID người nhận (bắt buộc khi gọi với tài khoản Admin)
 *     responses:
 *       201:
 *         description: Gửi thành công
 *       400:
 *         description: Thiếu nội dung hoặc Admin chưa truyền toId
 *       404:
 *         description: Không tìm thấy Admin
 *       500:
 *         description: Lỗi server
 */
router.post('/chat/messages', protect, sendMessage);

/**
 * @swagger
 * /api/chat/unread:
 *   get:
 *     summary: Đếm số tin nhắn chưa đọc
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số lượng tin chưa đọc
 *       500:
 *         description: Lỗi server
 */
router.get('/chat/unread', protect, getUnreadCount);

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Danh sách hội thoại (chỉ Admin)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hội thoại kèm tin nhắn cuối và số tin chưa đọc
 *       403:
 *         description: Chỉ Admin được phép truy cập
 *       500:
 *         description: Lỗi server
 */
router.get('/chat/conversations', protect, getConversations);

export default router;
