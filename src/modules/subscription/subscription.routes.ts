import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import {
  getSubscription,
  createOrUpdateSubscription,
  getProRequests,
  createProRequest,
  updateProRequest,
  markProRequestSeen,
  revokeProSubscription,
  grantProSubscription,
  getUserNotifications,
  markNotificationRead
} from './subscription.controller';

const router = Router();

// Subscription routes
router.get('/subscriptions', protect, getSubscription);
router.post('/subscriptions', protect, createOrUpdateSubscription);
router.delete('/subscriptions/users/:userId', protect, revokeProSubscription);
router.post('/subscriptions/grant', protect, grantProSubscription);

// Pro requests routes
router.get('/pro-requests', protect, getProRequests);
router.post('/pro-requests', protect, createProRequest);
router.put('/pro-requests/:id', protect, updateProRequest);
router.put('/pro-requests/:id/seen', protect, markProRequestSeen);

// User notifications
router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

export default router;
