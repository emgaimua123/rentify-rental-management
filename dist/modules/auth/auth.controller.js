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
exports.getUsers = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../../core/database/prismaClient"));
const JWT_SECRET = process.env.JWT_SECRET || 'rentify-secret-key-2026';
const JWT_EXPIRES_IN = '7d';
const generateToken = (id, username, role) => jsonwebtoken_1.default.sign({ id, username, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, name, email } = req.body;
        if (!username)
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập.' });
        if (!password)
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu.' });
        if (!name)
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên hiển thị.' });
        const userByUsername = yield prismaClient_1.default.user.findUnique({ where: { username } });
        if (userByUsername)
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
        if (email) {
            const userByEmail = yield prismaClient_1.default.user.findFirst({ where: { email } });
            if (userByEmail)
                return res.status(400).json({ success: false, message: 'Email đã được sử dụng.' });
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // First registered user gets ADMIN role automatically
        const userCount = yield prismaClient_1.default.user.count();
        const role = userCount === 0 ? 'ADMIN' : 'USER';
        const user = yield prismaClient_1.default.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                email,
                role,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`
            }
        });
        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                token: generateToken(user.id, user.username, user.role)
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.' });
        }
        const user = yield prismaClient_1.default.user.findUnique({ where: { username } });
        if (!user)
            return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                token: generateToken(user.id, user.username, user.role)
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prismaClient_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, username: true, name: true, role: true, email: true, avatar: true }
        });
        if (!user)
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getMe = getMe;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, avatar, password, email } = req.body;
        const userId = req.user.id;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (avatar)
            updateData.avatar = avatar;
        if (email !== undefined)
            updateData.email = email || null;
        if (password)
            updateData.password = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prismaClient_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, name: true, email: true, avatar: true, role: true }
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.updateProfile = updateProfile;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prismaClient_1.default.user.findMany({
            select: {
                id: true, username: true, name: true, role: true,
                email: true, createdAt: true, avatar: true,
                subscription: { select: { plan: true, status: true, expiresAt: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getUsers = getUsers;
