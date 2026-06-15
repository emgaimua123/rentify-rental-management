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
exports.deleteBillsBatch = exports.deleteBill = exports.updateBill = exports.createBill = exports.getBills = void 0;
const prismaClient_1 = __importDefault(require("../../core/database/prismaClient"));
const getBills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const bills = yield prismaClient_1.default.bill.findMany({
            where: { userId },
            orderBy: { dateCreated: 'desc' }
        });
        return res.json({ success: true, data: bills });
    }
    catch (error) {
        console.error('getBills error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.getBills = getBills;
const createBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { roomId, roomName, month, total, totalAmount, paid, html, dateCreated } = req.body;
        if (!roomName || !month || !total || html === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const bill = yield prismaClient_1.default.bill.create({
            data: {
                userId,
                roomId: roomId ? String(roomId) : null,
                roomName,
                month,
                total,
                totalAmount: totalAmount || 0,
                paid: paid || false,
                html,
                dateCreated: dateCreated ? new Date(dateCreated) : new Date()
            }
        });
        return res.status(201).json({ success: true, data: bill });
    }
    catch (error) {
        console.error('createBill error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.createBill = createBill;
const updateBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const billId = parseInt(req.params.id);
        if (isNaN(billId)) {
            return res.status(400).json({ success: false, message: 'Invalid bill id' });
        }
        const existing = yield prismaClient_1.default.bill.findFirst({ where: { id: billId, userId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }
        const { roomId, roomName, month, total, totalAmount, paid, html, dateCreated } = req.body;
        const updated = yield prismaClient_1.default.bill.update({
            where: { id: billId },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (roomId !== undefined && { roomId: String(roomId) })), (roomName !== undefined && { roomName })), (month !== undefined && { month })), (total !== undefined && { total })), (totalAmount !== undefined && { totalAmount })), (paid !== undefined && { paid })), (html !== undefined && { html })), (dateCreated !== undefined && { dateCreated: new Date(dateCreated) }))
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        console.error('updateBill error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.updateBill = updateBill;
const deleteBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const billId = parseInt(req.params.id);
        if (isNaN(billId)) {
            return res.status(400).json({ success: false, message: 'Invalid bill id' });
        }
        const existing = yield prismaClient_1.default.bill.findFirst({ where: { id: billId, userId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }
        yield prismaClient_1.default.bill.delete({ where: { id: billId } });
        return res.json({ success: true, message: 'Bill deleted' });
    }
    catch (error) {
        console.error('deleteBill error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.deleteBill = deleteBill;
const deleteBillsBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
        }
        const numericIds = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));
        const result = yield prismaClient_1.default.bill.deleteMany({
            where: { id: { in: numericIds }, userId }
        });
        return res.json({ success: true, count: result.count });
    }
    catch (error) {
        console.error('deleteBillsBatch error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.deleteBillsBatch = deleteBillsBatch;
