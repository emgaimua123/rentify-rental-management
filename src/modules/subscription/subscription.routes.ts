import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import {
  getSubscription,
  createOrUpdateSubscription,
  getProRequests,
  createProRequest,
  updateProRequest
} from './subscription.controller';

const router = Router();

// Subscription routes
router.get('/subscriptions', protect, getSubscription);
router.post('/subscriptions', protect, createOrUpdateSubscription);

// Pro requests routes
router.get('/pro-requests', protect, getProRequests);
router.post('/pro-requests', protect, createProRequest);
router.put('/pro-requests/:id', protect, updateProRequest);

export default router;
