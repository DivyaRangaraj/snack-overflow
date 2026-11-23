import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  approveRequest,
  declineRequest,
} from '../controllers/request.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All request routes require authentication
router.use(authenticate);

// Member endpoints
router.post('/', createRequest);
router.get('/my', getMyRequests);

// Admin endpoints
router.get('/', requireAdmin, getAllRequests);
router.patch('/:id/approve', requireAdmin, approveRequest);
router.patch('/:id/decline', requireAdmin, declineRequest);

// Shared / authorized endpoint (must be placed after /my)
router.get('/:id', getRequestById);

export default router;
