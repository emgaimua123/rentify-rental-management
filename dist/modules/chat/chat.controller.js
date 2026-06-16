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
exports.getConversations = exports.getUnreadCount = exports.sendMessage = exports.getMessages = void 0;
const prismaClient_1 = __importDefault(require("../../core/database/prismaClient"));
const getAdminUser = () => __awaiter(void 0, void 0, void 0, function* () {
    return prismaClient_1.default.user.findFirst({ where: { role: 'ADMIN' } });
});
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const me = req.user;
        const isAdmin = me.role === 'ADMIN' || me.username === 'admin';
        let partnerId;
        if (isAdmin) {
            partnerId = parseInt(req.query.userId);
            if (isNaN(partnerId)) {
                return res.status(400).json({ success: false, message: 'userId required for admin' });
            }
        }
        else {
            const admin = yield getAdminUser();
            if (!admin)
                return res.status(404).json({ success: false, message: 'Admin not found' });
            partnerId = admin.id;
        }
        const messages = yield prismaClient_1.default.chatMessage.findMany({
            where: {
                OR: [
                    { fromId: me.id, toId: partnerId },
                    { fromId: partnerId, toId: me.id }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        yield prismaClient_1.default.chatMessage.updateMany({
            where: { fromId: partnerId, toId: me.id, isRead: false },
            data: { isRead: true }
        });
        return res.json({ success: true, data: messages });
    }
    catch (e) {
        console.error('getMessages error', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.getMessages = getMessages;
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const me = req.user;
        const isAdmin = me.role === 'ADMIN' || me.username === 'admin';
        const { message, toId } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }
        let recipientId;
        if (isAdmin) {
            recipientId = parseInt(toId);
            if (isNaN(recipientId)) {
                return res.status(400).json({ success: false, message: 'toId required for admin' });
            }
        }
        else {
            const admin = yield getAdminUser();
            if (!admin)
                return res.status(404).json({ success: false, message: 'Admin not found' });
            recipientId = admin.id;
        }
        const msg = yield prismaClient_1.default.chatMessage.create({
            data: { fromId: me.id, toId: recipientId, message: message.trim() }
        });
        return res.status(201).json({ success: true, data: msg });
    }
    catch (e) {
        console.error('sendMessage error', e);
        return res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
});
exports.sendMessage = sendMessage;
const getUnreadCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const me = req.user;
        const count = yield prismaClient_1.default.chatMessage.count({
            where: { toId: me.id, isRead: false }
        });
        return res.json({ success: true, data: count });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: e.message || 'Server error' });
    }
});
exports.getUnreadCount = getUnreadCount;
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const me = req.user;
        if (me.role !== 'ADMIN' && me.username !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const messages = yield prismaClient_1.default.chatMessage.findMany({
            where: { OR: [{ toId: me.id }, { fromId: me.id }] },
            orderBy: { createdAt: 'desc' }
        });
        const convMap = new Map();
        messages.forEach((m) => {
            const partnerId = m.fromId === me.id ? m.toId : m.fromId;
            if (!convMap.has(partnerId)) {
                convMap.set(partnerId, { userId: partnerId, lastMessage: m.message, lastTime: m.createdAt, unread: 0 });
            }
            if (m.toId === me.id && !m.isRead) {
                convMap.get(partnerId).unread++;
            }
        });
        const userIds = [...convMap.keys()];
        if (userIds.length === 0)
            return res.json({ success: true, data: [] });
        const users = yield prismaClient_1.default.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, username: true, avatar: true }
        });
        const result = users.map(u => (Object.assign(Object.assign({}, u), convMap.get(u.id))))
            .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
        return res.json({ success: true, data: result });
    }
    catch (e) {
        console.error('getConversations error', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.getConversations = getConversations;
