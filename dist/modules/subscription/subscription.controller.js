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
exports.updateProRequest = exports.createProRequest = exports.getProRequests = exports.createOrUpdateSubscription = exports.getSubscription = void 0;
const prismaClient_1 = __importDefault(require("../../core/database/prismaClient"));
const getSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const subscription = yield prismaClient_1.default.subscription.findUnique({
            where: { userId }
        });
        if (!subscription) {
            return res.json({ success: true, data: null });
        }
        return res.json({ success: true, data: subscription });
    }
    catch (error) {
        console.error('getSubscription error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.getSubscription = getSubscription;
const createOrUpdateSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { plan, status, expiresAt, autoRenew } = req.body;
        if (!plan || !expiresAt) {
            return res.status(400).json({ success: false, message: 'plan and expiresAt are required' });
        }
        const subscription = yield prismaClient_1.default.subscription.upsert({
            where: { userId },
            create: {
                userId,
                plan,
                status: status || 'active',
                expiresAt: new Date(expiresAt),
                autoRenew: autoRenew !== undefined ? autoRenew : false
            },
            update: Object.assign(Object.assign(Object.assign(Object.assign({}, (plan !== undefined && { plan })), (status !== undefined && { status })), (expiresAt !== undefined && { expiresAt: new Date(expiresAt) })), (autoRenew !== undefined && { autoRenew }))
        });
        return res.json({ success: true, data: subscription });
    }
    catch (error) {
        console.error('createOrUpdateSubscription error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.createOrUpdateSubscription = createOrUpdateSubscription;
const getProRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const user = req.user;
        // Admin can see all requests
        let requests;
        if (user.role === 'ADMIN' || user.username === 'admin') {
            requests = yield prismaClient_1.default.proRequest.findMany({
                orderBy: { createdAt: 'desc' }
            });
        }
        else {
            requests = yield prismaClient_1.default.proRequest.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
        }
        // Map to include date field for frontend compatibility
        const result = requests.map((r) => (Object.assign(Object.assign({}, r), { date: r.createdAt.toISOString() })));
        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('getProRequests error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.getProRequests = getProRequests;
const createProRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { plan, amount, type, username } = req.body;
        if (!plan || !type) {
            return res.status(400).json({ success: false, message: 'plan and type are required' });
        }
        // Check for duplicate pending request
        const existing = yield prismaClient_1.default.proRequest.findFirst({
            where: { userId, plan, status: 'PENDING' }
        });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Bạn đã có yêu cầu tương tự đang chờ duyệt!' });
        }
        const request = yield prismaClient_1.default.proRequest.create({
            data: {
                userId,
                plan,
                amount: amount || 0,
                type,
                status: 'PENDING',
                username: username || null
            }
        });
        return res.status(201).json({
            success: true,
            data: Object.assign(Object.assign({}, request), { date: request.createdAt.toISOString() })
        });
    }
    catch (error) {
        console.error('createProRequest error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.createProRequest = createProRequest;
const updateProRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN' && user.username !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const requestId = parseInt(req.params.id);
        if (isNaN(requestId)) {
            return res.status(400).json({ success: false, message: 'Invalid request id' });
        }
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' });
        }
        const existing = yield prismaClient_1.default.proRequest.findUnique({ where: { id: requestId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'ProRequest not found' });
        }
        const updated = yield prismaClient_1.default.proRequest.update({
            where: { id: requestId },
            data: { status }
        });
        // If approved, create or update subscription
        if (status === 'APPROVED') {
            const isUpgrade = existing.type === 'upgrade_to_yearly' || existing.plan === 'upgrade_to_yearly';
            if (isUpgrade) {
                const existingSub = yield prismaClient_1.default.subscription.findUnique({ where: { userId: existing.userId } });
                if (existingSub) {
                    const currentExp = new Date(existingSub.expiresAt);
                    currentExp.setDate(currentExp.getDate() + 365);
                    yield prismaClient_1.default.subscription.update({
                        where: { userId: existing.userId },
                        data: { plan: '1_year', expiresAt: currentExp, autoRenew: true, status: 'active' }
                    });
                }
                else {
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 365);
                    yield prismaClient_1.default.subscription.create({
                        data: { userId: existing.userId, plan: '1_year', expiresAt, autoRenew: true, status: 'active' }
                    });
                }
            }
            else {
                const durationDays = existing.plan === '1_year' ? 365 : 30;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + durationDays);
                yield prismaClient_1.default.subscription.upsert({
                    where: { userId: existing.userId },
                    create: { userId: existing.userId, plan: existing.plan, expiresAt, autoRenew: true, status: 'active' },
                    update: { plan: existing.plan, expiresAt, autoRenew: true, status: 'active' }
                });
            }
        }
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        console.error('updateProRequest error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.updateProRequest = updateProRequest;
