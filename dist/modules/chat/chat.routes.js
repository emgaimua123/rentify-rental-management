"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const chat_controller_1 = require("./chat.controller");
const router = (0, express_1.Router)();
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
router.get('/chat/messages', auth_middleware_1.protect, chat_controller_1.getMessages);
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
router.post('/chat/messages', auth_middleware_1.protect, chat_controller_1.sendMessage);
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
router.get('/chat/unread', auth_middleware_1.protect, chat_controller_1.getUnreadCount);
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
router.get('/chat/conversations', auth_middleware_1.protect, chat_controller_1.getConversations);
exports.default = router;
