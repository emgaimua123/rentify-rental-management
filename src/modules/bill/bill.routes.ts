import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  deleteBillsBatch
} from './bill.controller';

const router = Router();

router.get('/', protect, getBills);
router.post('/', protect, createBill);
router.put('/:id', protect, updateBill);
// batch route MUST be before /:id
router.delete('/batch', protect, deleteBillsBatch);
router.delete('/:id', protect, deleteBill);

export default router;
