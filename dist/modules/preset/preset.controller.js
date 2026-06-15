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
exports.deletePreset = exports.updatePreset = exports.createPreset = exports.getPresets = void 0;
const prismaClient_1 = __importDefault(require("../../core/database/prismaClient"));
const getPresets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const presets = yield prismaClient_1.default.pricePreset.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
        const result = presets.map(p => (Object.assign(Object.assign({}, p), { extraFees: p.extraFees ? JSON.parse(p.extraFees) : [] })));
        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('getPresets error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.getPresets = getPresets;
const createPreset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { name, electricPrice, waterPrice, managementFee, internetFee, parkingFee, extraFees } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Preset name is required' });
        }
        const preset = yield prismaClient_1.default.pricePreset.create({
            data: {
                userId,
                name,
                electricPrice: electricPrice || 0,
                waterPrice: waterPrice || 0,
                managementFee: managementFee || 0,
                internetFee: internetFee || 0,
                parkingFee: parkingFee || 0,
                extraFees: extraFees ? JSON.stringify(extraFees) : null
            }
        });
        return res.status(201).json({
            success: true,
            data: Object.assign(Object.assign({}, preset), { extraFees: extraFees || [] })
        });
    }
    catch (error) {
        console.error('createPreset error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.createPreset = createPreset;
const updatePreset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const presetId = parseInt(req.params.id);
        if (isNaN(presetId)) {
            return res.status(400).json({ success: false, message: 'Invalid preset id' });
        }
        const existing = yield prismaClient_1.default.pricePreset.findFirst({ where: { id: presetId, userId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Preset not found' });
        }
        const { name, electricPrice, waterPrice, managementFee, internetFee, parkingFee, extraFees } = req.body;
        const updated = yield prismaClient_1.default.pricePreset.update({
            where: { id: presetId },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name !== undefined && { name })), (electricPrice !== undefined && { electricPrice })), (waterPrice !== undefined && { waterPrice })), (managementFee !== undefined && { managementFee })), (internetFee !== undefined && { internetFee })), (parkingFee !== undefined && { parkingFee })), (extraFees !== undefined && { extraFees: JSON.stringify(extraFees) }))
        });
        return res.json({
            success: true,
            data: Object.assign(Object.assign({}, updated), { extraFees: updated.extraFees ? JSON.parse(updated.extraFees) : [] })
        });
    }
    catch (error) {
        console.error('updatePreset error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.updatePreset = updatePreset;
const deletePreset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const presetId = parseInt(req.params.id);
        if (isNaN(presetId)) {
            return res.status(400).json({ success: false, message: 'Invalid preset id' });
        }
        const existing = yield prismaClient_1.default.pricePreset.findFirst({ where: { id: presetId, userId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Preset not found' });
        }
        yield prismaClient_1.default.pricePreset.delete({ where: { id: presetId } });
        return res.json({ success: true, message: 'Preset deleted' });
    }
    catch (error) {
        console.error('deletePreset error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.deletePreset = deletePreset;
