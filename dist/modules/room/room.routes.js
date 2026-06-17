"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const room_controller_1 = require("./room.controller");
const upload_middleware_1 = require("../../core/middlewares/upload.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: API Quản lý phòng (Room Management)
 */
/**
 * @swagger
 * /api/rooms/bulk-generate:
 *   post:
 *     summary: Thêm nhiều phòng tự động theo quy tắc
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prefix
 *               - startNumber
 *               - endNumber
 *               - preset
 *             properties:
 *               prefix:
 *                 type: string
 *                 example: "20"
 *               startNumber:
 *                 type: integer
 *                 example: 1
 *               endNumber:
 *                 type: integer
 *                 example: 5
 *               preset:
 *                 type: object
 *                 properties:
 *                   price:
 *                     type: number
 *                     example: 3500000
 *                   area:
 *                     type: number
 *                     example: 25
 *                   type:
 *                     type: string
 *                     example: "Studio"
 *                   status:
 *                     type: string
 *                     example: "Available"
 *     responses:
 *       201:
 *         description: Tạo danh sách phòng thành công
 *       400:
 *         description: Bad Request (Dữ liệu đầu vào không hợp lệ)
 *       500:
 *         description: Lỗi server
 */
router.post('/bulk-generate', auth_middleware_1.protect, room_controller_1.bulkGenerateRooms);
router.get('/contract-history', auth_middleware_1.protect, room_controller_1.getContractHistory);
router.put('/contract/:id', auth_middleware_1.protect, room_controller_1.updateContract);
router.delete('/contract/:id', auth_middleware_1.protect, room_controller_1.deleteContract);
/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Lấy danh sách toàn bộ phòng
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang (mặc định 10)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái phòng (Available, Occupied, Maintenance)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sắp xếp theo trường (price, name)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp (asc, desc)
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
 *                       area:
 *                         type: number
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       isDeleted:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       medias:
 *                         type: array
 *                         items:
 *                           type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Lỗi server
 */
router.get('/', auth_middleware_1.protect, room_controller_1.getRooms);
/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một phòng
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phòng
 *     responses:
 *       200:
 *         description: Thông tin chi tiết phòng
 *       404:
 *         description: Không tìm thấy phòng
 *       500:
 *         description: Lỗi server
 */
router.get('/:id', auth_middleware_1.protect, room_controller_1.getRoomById);
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
 *               area:
 *                 type: number
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *                 description: Available, Occupied, Maintenance
 *     responses:
 *       201:
 *         description: Tạo phòng thành công
 *       400:
 *         description: Validation error (Thiếu tên hoặc giá <= 0)
 *       500:
 *         description: Lỗi server
 */
router.post('/', auth_middleware_1.protect, room_controller_1.createRoom);
/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Cập nhật thông tin phòng (Khóa logic cập nhật trạng thái nếu đang có người thuê)
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
 *               area:
 *                 type: number
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Lỗi cập nhật (Không thể đổi trạng thái phòng vì đang có hợp đồng kích hoạt)
 *       404:
 *         description: Không tìm thấy phòng
 *       500:
 *         description: Lỗi server
 */
router.put('/:id', auth_middleware_1.protect, room_controller_1.updateRoom);
/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Xóa phòng (Soft Delete)
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
router.delete('/:id', auth_middleware_1.protect, room_controller_1.deleteRoom);
/**
 * @swagger
 * /api/rooms/{roomId}/images:
 *   post:
 *     summary: Thêm ảnh từ máy (Upload Image)
 *     tags: [Room Media]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phòng
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload ảnh thành công
 *       400:
 *         description: Lỗi định dạng file hoặc dung lượng
 *       404:
 *         description: Không tìm thấy phòng
 *       500:
 *         description: Lỗi server
 */
router.post('/:roomId/images', auth_middleware_1.protect, upload_middleware_1.uploadImage.single('image'), room_controller_1.uploadRoomImage);
/**
 * @swagger
 * /api/rooms/{roomId}/videos:
 *   post:
 *     summary: Thêm nguồn video (Add Video Link)
 *     tags: [Room Media]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phòng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=12345"
 *     responses:
 *       201:
 *         description: Thêm link video thành công
 *       400:
 *         description: URL không hợp lệ
 *       404:
 *         description: Không tìm thấy phòng
 *       500:
 *         description: Lỗi server
 */
router.post('/:roomId/videos', auth_middleware_1.protect, room_controller_1.addRoomVideo);
/**
 * @swagger
 * /api/rooms/media/{mediaId}:
 *   delete:
 *     summary: Xóa Media (Ảnh hoặc Video)
 *     tags: [Room Media]
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của Media
 *     responses:
 *       200:
 *         description: Xóa media thành công
 *       404:
 *         description: Không tìm thấy media
 *       500:
 *         description: Lỗi server
 */
router.delete('/media/:mediaId', auth_middleware_1.protect, room_controller_1.deleteRoomMedia);
exports.default = router;
