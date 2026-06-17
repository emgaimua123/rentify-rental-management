import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  deleteBillsBatch
} from './bill.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: Quản lý hóa đơn (Billing)
 */

/**
 * @swagger
 * /api/bills:
 *   get:
 *     summary: Lấy danh sách hóa đơn của người dùng
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hóa đơn (mới nhất trước)
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.get('/', protect, getBills);

/**
 * @swagger
 * /api/bills:
 *   post:
 *     summary: Tạo hóa đơn mới
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomName, month, total, html]
 *             properties:
 *               roomId:
 *                 type: string
 *               roomName:
 *                 type: string
 *                 example: "201"
 *               month:
 *                 type: string
 *                 example: "2026-06"
 *               total:
 *                 type: string
 *                 example: "3.500.000đ"
 *               totalAmount:
 *                 type: number
 *                 example: 3500000
 *               paid:
 *                 type: boolean
 *               html:
 *                 type: string
 *                 description: Nội dung hóa đơn dạng HTML để in/xuất
 *               dateCreated:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tạo hóa đơn thành công
 *       400:
 *         description: Thiếu trường bắt buộc
 *       500:
 *         description: Lỗi server
 */
router.post('/', protect, createBill);

/**
 * @swagger
 * /api/bills/{id}:
 *   put:
 *     summary: Cập nhật hóa đơn
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID hóa đơn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomName:
 *                 type: string
 *               month:
 *                 type: string
 *               total:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               paid:
 *                 type: boolean
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi server
 */
router.put('/:id', protect, updateBill);

/**
 * @swagger
 * /api/bills/batch:
 *   delete:
 *     summary: Xóa nhiều hóa đơn cùng lúc
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Xóa thành công, trả về số lượng đã xóa
 *       400:
 *         description: ids phải là mảng không rỗng
 *       500:
 *         description: Lỗi server
 */
// batch route MUST be before /:id
router.delete('/batch', protect, deleteBillsBatch);

/**
 * @swagger
 * /api/bills/{id}:
 *   delete:
 *     summary: Xóa một hóa đơn
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID hóa đơn
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id', protect, deleteBill);

export default router;
