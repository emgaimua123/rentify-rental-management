"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const subscription_controller_1 = require("./subscription.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Subscription
 *     description: Gói Pro của người dùng
 *   - name: Pro Requests
 *     description: Yêu cầu nâng cấp Pro & quy trình duyệt
 *   - name: Notifications
 *     description: Thông báo cho người dùng
 */
/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Lấy thông tin gói Pro của tài khoản hiện tại
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin gói (null nếu chưa có)
 *       500:
 *         description: Lỗi server
 */
router.get('/subscriptions', auth_middleware_1.protect, subscription_controller_1.getSubscription);
/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Tạo hoặc cập nhật gói Pro của tài khoản hiện tại
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan, expiresAt]
 *             properties:
 *               plan:
 *                 type: string
 *                 example: "1_month"
 *               status:
 *                 type: string
 *                 example: "active"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               autoRenew:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lưu thành công
 *       400:
 *         description: Thiếu plan hoặc expiresAt
 *       500:
 *         description: Lỗi server
 */
router.post('/subscriptions', auth_middleware_1.protect, subscription_controller_1.createOrUpdateSubscription);
/**
 * @swagger
 * /api/subscriptions/users/{userId}:
 *   delete:
 *     summary: Thu hồi gói Pro của một người dùng (chỉ Admin)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do thu hồi (bắt buộc, sẽ gửi thông báo cho user)
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 *       400:
 *         description: Thiếu lý do hoặc userId không hợp lệ
 *       403:
 *         description: Chỉ Admin được phép
 *       404:
 *         description: Người dùng không có gói Pro
 *       500:
 *         description: Lỗi server
 */
router.delete('/subscriptions/users/:userId', auth_middleware_1.protect, subscription_controller_1.revokeProSubscription);
/**
 * @swagger
 * /api/subscriptions/grant:
 *   post:
 *     summary: Cấp gói Pro thủ công cho người dùng (chỉ Admin)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, plan]
 *             properties:
 *               userId:
 *                 type: integer
 *               plan:
 *                 type: string
 *                 example: "1_year"
 *                 description: "1_year = 365 ngày, còn lại = 30 ngày"
 *     responses:
 *       200:
 *         description: Cấp gói thành công
 *       400:
 *         description: Thiếu userId hoặc plan
 *       403:
 *         description: Chỉ Admin được phép
 *       500:
 *         description: Lỗi server
 */
router.post('/subscriptions/grant', auth_middleware_1.protect, subscription_controller_1.grantProSubscription);
/**
 * @swagger
 * /api/pro-requests:
 *   get:
 *     summary: Lấy danh sách yêu cầu nâng cấp Pro
 *     description: Admin xem tất cả; user thường chỉ xem yêu cầu của mình.
 *     tags: [Pro Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu
 *       500:
 *         description: Lỗi server
 */
router.get('/pro-requests', auth_middleware_1.protect, subscription_controller_1.getProRequests);
/**
 * @swagger
 * /api/pro-requests:
 *   post:
 *     summary: Gửi yêu cầu nâng cấp Pro
 *     tags: [Pro Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan, type]
 *             properties:
 *               plan:
 *                 type: string
 *                 example: "1_month"
 *               type:
 *                 type: string
 *                 example: "new"
 *               amount:
 *                 type: number
 *                 example: 50000
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo yêu cầu thành công
 *       400:
 *         description: Thiếu plan hoặc type
 *       409:
 *         description: Đã có yêu cầu tương tự đang chờ duyệt
 *       500:
 *         description: Lỗi server
 */
router.post('/pro-requests', auth_middleware_1.protect, subscription_controller_1.createProRequest);
/**
 * @swagger
 * /api/pro-requests/{id}:
 *   put:
 *     summary: Duyệt / từ chối yêu cầu Pro (chỉ Admin)
 *     description: Khi APPROVED sẽ tự tạo/gia hạn gói Pro tương ứng.
 *     tags: [Pro Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               rejectionReason:
 *                 type: string
 *                 description: Lý do (khi từ chối)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Thiếu status hoặc ID không hợp lệ
 *       403:
 *         description: Chỉ Admin được phép
 *       404:
 *         description: Không tìm thấy yêu cầu
 *       500:
 *         description: Lỗi server
 */
router.put('/pro-requests/:id', auth_middleware_1.protect, subscription_controller_1.updateProRequest);
/**
 * @swagger
 * /api/pro-requests/{id}/seen:
 *   put:
 *     summary: Đánh dấu user đã xem kết quả yêu cầu
 *     tags: [Pro Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã đánh dấu
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy yêu cầu
 *       500:
 *         description: Lỗi server
 */
router.put('/pro-requests/:id/seen', auth_middleware_1.protect, subscription_controller_1.markProRequestSeen);
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy thông báo chưa đọc của người dùng
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông báo chưa đọc
 *       500:
 *         description: Lỗi server
 */
router.get('/notifications', auth_middleware_1.protect, subscription_controller_1.getUserNotifications);
/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu một thông báo là đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã đánh dấu đã đọc
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy thông báo
 *       500:
 *         description: Lỗi server
 */
router.put('/notifications/:id/read', auth_middleware_1.protect, subscription_controller_1.markNotificationRead);
exports.default = router;
