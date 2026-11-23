import { Router } from 'express';
import {
  getSummary,
  getSnacks,
  getSnack,
  createSnack,
  updateSnack,
  deleteSnack,
  consumeSnack,
  restockSnack,
  voteSnack,
  unvoteSnack,
  getActivity,
  getPopularSnacks,
} from '../controllers/snack.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public-ish routes (auth optional for user vote state)
router.get('/summary', authenticate, getSummary);
router.get('/activity', authenticate, requireAdmin, getActivity);
router.get('/popular', authenticate, getPopularSnacks);
router.get('/', authenticate, getSnacks);
router.get('/:id', authenticate, getSnack);

// Admin-only routes
router.post('/', authenticate, requireAdmin, createSnack);
router.patch('/:id', authenticate, requireAdmin, updateSnack);
router.delete('/:id', authenticate, requireAdmin, deleteSnack);
router.post('/:id/restock', authenticate, requireAdmin, restockSnack);

// Authenticated user routes
router.post('/:id/consume', authenticate, consumeSnack);
router.post('/:id/vote', authenticate, voteSnack);
router.delete('/:id/vote', authenticate, unvoteSnack);

export default router;
