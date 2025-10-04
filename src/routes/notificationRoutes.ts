import express from 'express';
import { body, param } from 'express-validator';
import {
  sendTestNotification,
  resendBookingNotification
} from '../controllers/notificationController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const testNotificationValidation = [
  body('type')
    .isIn(['email', 'sms', 'whatsapp', 'both'])
    .withMessage('Type must be email, sms, whatsapp, or both'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address is required'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

const resendNotificationValidation = [
  param('bookingId')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('type')
    .isIn(['confirmation', 'cancellation'])
    .withMessage('Type must be confirmation or cancellation')
];

// Routes
router.post(
  '/test',
  authenticate,
  validate(testNotificationValidation),
  sendTestNotification
);

router.post(
  '/resend/:bookingId',
  authenticate,
  validate(resendNotificationValidation),
  resendBookingNotification
);

export default router;