import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  getSubscription,
  upgradeSubscription,
  cancelSubscription
} from '../controllers/account.controller';

const router = Router();

// All account routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/subscription', getSubscription);
router.post('/subscription/upgrade', upgradeSubscription);
router.post('/subscription/cancel', cancelSubscription);

export default router;
