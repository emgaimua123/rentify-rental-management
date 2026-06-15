import express from 'express';
import { register, login, getMe, getUsers } from './auth.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);

export default router;
