import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { getMessages, sendMessage, getUnreadCount, getConversations } from './chat.controller';

const router = Router();

router.get('/chat/messages', protect, getMessages);
router.post('/chat/messages', protect, sendMessage);
router.get('/chat/unread', protect, getUnreadCount);
router.get('/chat/conversations', protect, getConversations);

export default router;
