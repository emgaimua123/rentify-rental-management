import express from 'express';
import { register, login, getMe, getUsers, updateProfile } from './auth.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getUsers);

export default router;
