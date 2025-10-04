import express from 'express';
import { body, param } from 'express-validator';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  refundPayment,
  createPublicPaymentOrder,
  verifyPublicPayment
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('bookingId')
    .isMongoId()
    .withMessage('Valid booking ID is required')
];

const verifyPaymentValidation = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
];

const paymentStatusValidation = [
  param('bookingId')
    .isMongoId()
    .withMessage('Valid booking ID is required')
];

const refundValidation = [
  param('bookingId')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('refundAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters')
];

// Routes
router.post(
  '/create-order',
  authenticate,
  validate(createOrderValidation),
  createPaymentOrder
);

router.post(
  '/verify',
  authenticate,
  validate(verifyPaymentValidation),
  verifyPayment
);

router.get(
  '/status/:bookingId',
  authenticate,
  validate(paymentStatusValidation),
  getPaymentStatus
);

router.post(
  '/refund/:bookingId',
  authenticate,
  authorize('admin'),
  validate(refundValidation),
  refundPayment
);

// Public payment routes (no authentication required)
router.post(
  '/public/create-order',
  validate(createOrderValidation),
  createPublicPaymentOrder
);

router.post(
  '/public/verify',
  validate(verifyPaymentValidation),
  verifyPublicPayment
);

export default router;