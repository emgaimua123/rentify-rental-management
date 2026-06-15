import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { getPresets, createPreset, updatePreset, deletePreset } from './preset.controller';

const router = Router();

router.get('/', protect, getPresets);
router.post('/', protect, createPreset);
router.put('/:id', protect, updatePreset);
router.delete('/:id', protect, deletePreset);

export default router;
