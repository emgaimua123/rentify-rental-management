"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const subscription_controller_1 = require("./subscription.controller");
const router = (0, express_1.Router)();
// Subscription routes
router.get('/subscriptions', auth_middleware_1.protect, subscription_controller_1.getSubscription);
router.post('/subscriptions', auth_middleware_1.protect, subscription_controller_1.createOrUpdateSubscription);
// Pro requests routes
router.get('/pro-requests', auth_middleware_1.protect, subscription_controller_1.getProRequests);
router.post('/pro-requests', auth_middleware_1.protect, subscription_controller_1.createProRequest);
router.put('/pro-requests/:id', auth_middleware_1.protect, subscription_controller_1.updateProRequest);
exports.default = router;
