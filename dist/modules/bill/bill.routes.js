"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const bill_controller_1 = require("./bill.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, bill_controller_1.getBills);
router.post('/', auth_middleware_1.protect, bill_controller_1.createBill);
router.put('/:id', auth_middleware_1.protect, bill_controller_1.updateBill);
// batch route MUST be before /:id
router.delete('/batch', auth_middleware_1.protect, bill_controller_1.deleteBillsBatch);
router.delete('/:id', auth_middleware_1.protect, bill_controller_1.deleteBill);
exports.default = router;
