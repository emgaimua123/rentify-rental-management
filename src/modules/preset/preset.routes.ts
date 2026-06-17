import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { getPresets, createPreset, updatePreset, deletePreset } from './preset.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Presets
 *   description: Bảng giá mẫu dùng lại (Price Presets)
 */

/**
 * @swagger
 * /api/presets:
 *   get:
 *     summary: Lấy danh sách bảng giá mẫu
 *     tags: [Presets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách preset (extraFees trả về dạng mảng)
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.get('/', protect, getPresets);

/**
 * @swagger
 * /api/presets:
 *   post:
 *     summary: Tạo bảng giá mẫu mới
 *     tags: [Presets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Giá chuẩn 2026"
 *               electricPrice:
 *                 type: number
 *                 example: 3500
 *               waterPrice:
 *                 type: number
 *                 example: 15000
 *               managementFee:
 *                 type: number
 *                 example: 100000
 *               internetFee:
 *                 type: number
 *                 example: 50000
 *               parkingFee:
 *                 type: number
 *                 example: 100000
 *               extraFees:
 *                 type: array
 *                 description: Danh sách phí phụ tùy chỉnh
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Tạo preset thành công
 *       400:
 *         description: Thiếu tên preset
 *       500:
 *         description: Lỗi server
 */
router.post('/', protect, createPreset);

/**
 * @swagger
 * /api/presets/{id}:
 *   put:
 *     summary: Cập nhật bảng giá mẫu
 *     tags: [Presets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID preset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               electricPrice:
 *                 type: number
 *               waterPrice:
 *                 type: number
 *               managementFee:
 *                 type: number
 *               internetFee:
 *                 type: number
 *               parkingFee:
 *                 type: number
 *               extraFees:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy preset
 *       500:
 *         description: Lỗi server
 */
router.put('/:id', protect, updatePreset);

/**
 * @swagger
 * /api/presets/{id}:
 *   delete:
 *     summary: Xóa bảng giá mẫu
 *     tags: [Presets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID preset
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy preset
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id', protect, deletePreset);

export default router;
