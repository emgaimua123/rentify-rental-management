import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: API Quản lý phòng (Room Management)
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Lấy danh sách toàn bộ phòng
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: Trả về danh sách phòng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *       500:
 *         description: Lỗi server
 */
router.get('/', getRooms);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Thêm một phòng mới
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *                 description: Available, Occupied, Maintenance
 *     responses:
 *       201:
 *         description: Tạo phòng thành công
 *       500:
 *         description: Lỗi server
 */
router.post('/', createRoom);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Cập nhật thông tin phòng (đổi giá, đổi loại phòng)
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phòng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy phòng
 *       500:
 *         description: Lỗi server
 */
router.put('/:id', updateRoom);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Xóa phòng
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phòng cần xóa
 *     responses:
 *       200:
 *         description: Xóa phòng thành công
 *       400:
 *         description: Bad Request (Không thể xóa phòng đang có người thuê)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không thể xóa phòng đang có người thuê"
 *       404:
 *         description: Không tìm thấy phòng
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id', deleteRoom);

export default router;
