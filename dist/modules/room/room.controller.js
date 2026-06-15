"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoomMedia = exports.addRoomVideo = exports.uploadRoomImage = exports.bulkGenerateRooms = exports.deleteRoom = exports.updateRoom = exports.createRoom = exports.getContractHistory = exports.getRoomById = exports.getRooms = void 0;
const prismaClient_1 = __importDefault(require("../../core/database/prismaClient"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mapAutoStatus = (room) => {
    if (room.contracts && room.contracts.length > 0) {
        const currentContract = room.contracts[0];
        if (currentContract.tenant) {
            currentContract.tenantName = currentContract.tenant.name;
            currentContract.tenantPhone = currentContract.tenant.phone || '';
            currentContract.tenantEmail = currentContract.tenant.email || '';
        }
        if (currentContract.tenantList) {
            try {
                currentContract.tenantList = JSON.parse(currentContract.tenantList);
            }
            catch (e) {
                currentContract.tenantList = [];
            }
        }
        else {
            currentContract.tenantList = [];
        }
        const endDate = new Date(currentContract.endDate);
        endDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (room.status === 'Occupied' && endDate < today) {
            return Object.assign(Object.assign({}, room), { status: 'Available' });
        }
    }
    return room;
};
const getRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
        const skip = (page - 1) * limit;
        const filter = { isDeleted: false, userId };
        if (status)
            filter.status = status;
        const orderByClause = (sortBy && ['price', 'name'].includes(sortBy))
            ? { [sortBy]: sortOrder }
            : { createdAt: 'desc' };
        let rooms = yield prismaClient_1.default.room.findMany({
            where: filter,
            skip,
            take: limit,
            orderBy: orderByClause,
            include: {
                medias: true,
                contracts: { orderBy: { createdAt: 'desc' }, take: 1, include: { tenant: true } }
            }
        });
        rooms = rooms.map(mapAutoStatus);
        const total = yield prismaClient_1.default.room.count({ where: filter });
        res.status(200).json({
            success: true,
            data: rooms,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getRooms = getRooms;
const getRoomById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        let room = yield prismaClient_1.default.room.findFirst({
            where: { id: Number(id), isDeleted: false, userId },
            include: {
                medias: true,
                contracts: { orderBy: { createdAt: 'desc' }, take: 1, include: { tenant: true } }
            }
        });
        if (!room)
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
        res.status(200).json({ success: true, data: mapAutoStatus(room) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getRoomById = getRoomById;
const getContractHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const rooms = yield prismaClient_1.default.room.findMany({
            where: { isDeleted: false, userId },
            include: {
                contracts: {
                    orderBy: { createdAt: 'desc' },
                    include: { tenant: true }
                }
            }
        });
        const roomsWithContracts = rooms
            .filter(r => r.contracts && r.contracts.length > 0)
            .map(r => (Object.assign(Object.assign({}, r), { contracts: r.contracts.map(c => {
                let tenantList = [];
                if (c.tenantList) {
                    try {
                        tenantList = JSON.parse(c.tenantList);
                    }
                    catch (e) { }
                }
                return Object.assign(Object.assign({}, c), { tenantName: c.tenant ? c.tenant.name : '', tenantPhone: c.tenant ? (c.tenant.phone || '') : '', tenantEmail: c.tenant ? (c.tenant.email || '') : '', tenantList });
            }) })));
        return res.json({ success: true, data: roomsWithContracts });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.getContractHistory = getContractHistory;
const createRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.user.id;
        const { name, price, area, type, status, tenantName, tenantCount, startDate, endDate } = req.body;
        const { tenantPhone, tenantEmail, tenantList } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Tên phòng là bắt buộc.' });
        }
        if (price === undefined || price <= 0) {
            return res.status(400).json({ success: false, message: 'Giá phòng phải lớn hơn 0.' });
        }
        if (status === 'Occupied') {
            if (!tenantName)
                return res.status(400).json({ success: false, message: 'Vui lòng nhập Tên người đại diện thuê.' });
            if (!startDate)
                return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày bắt đầu hợp đồng.' });
            if (!endDate)
                return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày kết thúc hợp đồng.' });
        }
        const newRoom = yield prismaClient_1.default.room.create({
            data: {
                userId,
                name,
                price,
                area,
                type,
                status: status || 'Available',
                contracts: status === 'Occupied' && tenantName ? {
                    create: {
                        tenant: {
                            create: { name: tenantName, phone: tenantPhone, email: tenantEmail }
                        },
                        tenantCount: tenantCount || 1,
                        tenantList: tenantList ? JSON.stringify(tenantList) : null,
                        startDate: new Date(startDate.includes('T') ? startDate : `${startDate}T12:00:00.000Z`),
                        endDate: new Date(endDate.includes('T') ? endDate : `${endDate}T12:00:00.000Z`)
                    }
                } : undefined
            },
            include: { contracts: true }
        });
        res.status(201).json({ success: true, data: newRoom });
    }
    catch (error) {
        if (error.code === 'P2002' && ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('name'))) {
            return res.status(400).json({ success: false, message: 'Tên phòng này đã tồn tại, vui lòng chọn tên khác.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.createRoom = createRoom;
const updateRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, price, area, type, status, tenantName, tenantCount, startDate, endDate } = req.body;
        const { tenantPhone, tenantEmail, tenantList } = req.body;
        const room = yield prismaClient_1.default.room.findFirst({
            where: { id: Number(id), isDeleted: false, userId },
            include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1, include: { tenant: true } } }
        });
        if (!room)
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
        if (status === 'Occupied') {
            if (room.status !== 'Occupied') {
                if (!tenantName)
                    return res.status(400).json({ success: false, message: 'Vui lòng nhập Tên người đại diện thuê.' });
                if (!startDate)
                    return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày bắt đầu hợp đồng.' });
                if (!endDate)
                    return res.status(400).json({ success: false, message: 'Vui lòng chọn Ngày kết thúc hợp đồng.' });
                yield prismaClient_1.default.contract.create({
                    data: {
                        room: { connect: { id: room.id } },
                        tenant: { create: { name: tenantName, phone: tenantPhone, email: tenantEmail } },
                        tenantCount: tenantCount || 1,
                        tenantList: tenantList ? JSON.stringify(tenantList) : null,
                        startDate: new Date(startDate.includes('T') ? startDate : `${startDate}T12:00:00.000Z`),
                        endDate: new Date(endDate.includes('T') ? endDate : `${endDate}T12:00:00.000Z`)
                    }
                });
            }
            else {
                const currentContract = room.contracts[0];
                if (currentContract) {
                    yield prismaClient_1.default.contract.update({
                        where: { id: currentContract.id },
                        data: {
                            tenant: tenantName ? { update: { name: tenantName, phone: tenantPhone, email: tenantEmail } } : undefined,
                            tenantCount: tenantCount || currentContract.tenantCount,
                            tenantList: tenantList ? JSON.stringify(tenantList) : null,
                            startDate: startDate ? new Date(startDate.includes('T') ? startDate : `${startDate}T12:00:00.000Z`) : currentContract.startDate,
                            endDate: endDate ? new Date(endDate.includes('T') ? endDate : `${endDate}T12:00:00.000Z`) : currentContract.endDate
                        }
                    });
                }
            }
        }
        const updatedRoom = yield prismaClient_1.default.room.update({
            where: { id: Number(id) },
            data: { name, price, area, type, status }
        });
        res.status(200).json({ success: true, data: updatedRoom });
    }
    catch (error) {
        if (error.code === 'P2002' && ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('name'))) {
            return res.status(400).json({ success: false, message: 'Tên phòng này đã tồn tại, vui lòng chọn tên khác.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.updateRoom = updateRoom;
const deleteRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const room = yield prismaClient_1.default.room.findFirst({
            where: { id: Number(id), isDeleted: false, userId }
        });
        if (!room)
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
        const deletedName = `${room.name}_deleted_${Date.now()}`;
        yield prismaClient_1.default.room.update({
            where: { id: Number(id) },
            data: { isDeleted: true, status: 'Maintenance', name: deletedName }
        });
        res.status(200).json({ success: true, message: 'Xóa phòng thành công.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.deleteRoom = deleteRoom;
const bulkGenerateRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { prefix, startNumber, endNumber, preset } = req.body;
        if (startNumber > endNumber)
            return res.status(400).json({ success: false, message: 'startNumber <= endNumber.' });
        if (endNumber - startNumber + 1 > 50)
            return res.status(400).json({ success: false, message: 'Tối đa 50 phòng.' });
        const roomsToCreate = [];
        for (let i = startNumber; i <= endNumber; i++) {
            roomsToCreate.push({
                userId,
                name: `${prefix}${i}`,
                price: preset.price,
                area: preset.area,
                type: preset.type,
                status: preset.status || 'Available'
            });
        }
        const result = yield prismaClient_1.default.room.createMany({ data: roomsToCreate });
        res.status(201).json({ success: true, message: `Tạo ${result.count} phòng thành công.` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.bulkGenerateRooms = bulkGenerateRooms;
const uploadRoomImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;
        const file = req.file;
        if (!file)
            return res.status(400).json({ success: false, message: 'File lỗi.' });
        const room = yield prismaClient_1.default.room.findFirst({ where: { id: Number(roomId), isDeleted: false, userId } });
        if (!room) {
            fs_1.default.unlinkSync(file.path);
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
        }
        const media = yield prismaClient_1.default.roomMedia.create({
            data: { roomId: Number(roomId), url: `/uploads/rooms/${file.filename}`, type: 'IMAGE' }
        });
        res.status(201).json({ success: true, data: media });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.uploadRoomImage = uploadRoomImage;
const addRoomVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;
        const { url } = req.body;
        if (!url || !url.startsWith('http'))
            return res.status(400).json({ success: false, message: 'URL không hợp lệ.' });
        const room = yield prismaClient_1.default.room.findFirst({ where: { id: Number(roomId), isDeleted: false, userId } });
        if (!room)
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
        const media = yield prismaClient_1.default.roomMedia.create({
            data: { roomId: Number(roomId), url, type: 'VIDEO' }
        });
        res.status(201).json({ success: true, data: media });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.addRoomVideo = addRoomVideo;
const deleteRoomMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        const media = yield prismaClient_1.default.roomMedia.findUnique({ where: { id: Number(mediaId) } });
        if (!media)
            return res.status(404).json({ success: false, message: 'Không tìm thấy media.' });
        if (media.type === 'IMAGE') {
            const filePath = path_1.default.join(process.cwd(), 'public/uploads/rooms', path_1.default.basename(media.url));
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
        }
        yield prismaClient_1.default.roomMedia.delete({ where: { id: Number(mediaId) } });
        res.status(200).json({ success: true, message: 'Xóa thành công.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.deleteRoomMedia = deleteRoomMedia;
