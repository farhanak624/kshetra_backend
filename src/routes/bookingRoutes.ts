import express from 'express';
import mongoose from 'mongoose';
import { body, param, query } from 'express-validator';
import {
  createBooking,
  createPublicBooking,
  getUserBookings,
  getBookingById,
  getPublicBookingById,
  cancelBooking
} from '../controllers/bookingController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const createBookingValidation = [
  body('roomId')
    .custom((value, { req }) => {
      // Skip roomId validation for yoga bookings
      if (req.body.bookingType === 'yoga' || req.body.yogaSessionId || value === '000000000000000000000000') {
        return true;
      }
      if (!value || !mongoose.isValidObjectId(value)) {
        throw new Error('Valid room ID is required for room bookings');
      }
      return true;
    }),
  body('checkIn')
    .isISO8601()
    .toDate()
    .withMessage('Valid check-in date is required'),
  body('checkOut')
    .isISO8601()
    .toDate()
    .withMessage('Valid check-out date is required'),
  body('guests')
    .isArray({ min: 1 })
    .withMessage('At least one guest is required'),
  body('guests.*.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Guest name must be between 2 and 50 characters'),
  body('guests.*.age')
    .isInt({ min: 0, max: 120 })
    .withMessage('Guest age must be between 0 and 120'),
  body('includeFood')
    .optional()
    .isBoolean()
    .withMessage('includeFood must be boolean'),
  body('includeBreakfast')
    .optional()
    .isBoolean()
    .withMessage('includeBreakfast must be boolean'),
  body('transport.pickup')
    .optional()
    .isBoolean()
    .withMessage('transport.pickup must be boolean'),
  body('transport.drop')
    .optional()
    .isBoolean()
    .withMessage('transport.drop must be boolean'),
  body('transport.flightNumber')
    .optional()
    .custom((value) => {
      // Allow empty string or valid flight number
      if (value === '' || value === undefined || value === null) {
        return true;
      }
      if (typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 10) {
        return true;
      }
      throw new Error('Flight number must be between 2 and 10 characters');
    }),
  body('transport.eta')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid ETA date is required'),
  body('transport.airportFrom')
    .optional()
    .isIn(['Kochi', 'Trivandrum'])
    .withMessage('Airport must be Kochi or Trivandrum'),
  body('selectedServices')
    .optional()
    .isArray()
    .withMessage('Selected services must be an array'),
  body('selectedServices.*.serviceId')
    .optional()
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('selectedServices.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Service quantity must be at least 1'),
  body('yogaSessionId')
    .optional()
    .custom((value) => {
      // Allow null/undefined for daily yoga sessions
      if (!value || value === null || value === undefined) {
        return true;
      }
      // Allow string IDs for daily yoga sessions (like "regular-0900")
      if (typeof value === 'string') {
        // If it looks like a MongoDB ObjectId, validate it
        if (value.match(/^[0-9a-fA-F]{24}$/)) {
          return mongoose.isValidObjectId(value);
        }
        // Allow other string formats for daily sessions
        return true;
      }
      return mongoose.isValidObjectId(value);
    }),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters')
];

const getBookingsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const bookingIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required')
];

// Routes
// Public booking route (no auth required)
router.post(
  '/public',
  validate(createBookingValidation),
  createPublicBooking
);

// Public booking details route (no auth required)
router.get(
  '/public/:id',
  validate(bookingIdValidation),
  getPublicBookingById
);

// Authenticated booking route
router.post(
  '/',
  authenticate,
  validate(createBookingValidation),
  createBooking
);

router.get(
  '/',
  authenticate,
  validate(getBookingsValidation),
  getUserBookings
);

router.get(
  '/:id',
  authenticate,
  validate(bookingIdValidation),
  getBookingById
);

router.delete(
  '/:id',
  authenticate,
  validate(bookingIdValidation),
  cancelBooking
);

export default router;