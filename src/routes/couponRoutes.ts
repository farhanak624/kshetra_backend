import express from 'express';
import {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  validateCoupon,
  getCouponStatistics
} from '../controllers/couponController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/validate', validateCoupon);

// Admin routes (authentication + admin role required)
router.use(authenticate);
router.use(authorize('admin'));

// Create new coupon
router.post('/', createCoupon);

// Get all coupons with pagination and filters
router.get('/', getAllCoupons);

// Get coupon statistics
router.get('/statistics', getCouponStatistics);

// Get coupon by ID
router.get('/:id', getCouponById);

// Update coupon
router.put('/:id', updateCoupon);

// Toggle coupon status (activate/deactivate)
router.patch('/:id/toggle-status', toggleCouponStatus);

// Delete coupon
router.delete('/:id', deleteCoupon);

export default router;