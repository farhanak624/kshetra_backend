import express from 'express';
import { query } from 'express-validator';
import { getRoomAvailability } from '../controllers/adminController';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public room availability endpoint validation
const availabilityQueryValidation = [
  query('checkIn')
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  query('checkOut')
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  query('capacity')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Capacity must be between 1 and 20')
];

// Public endpoints
router.get('/availability', validate(availabilityQueryValidation), getRoomAvailability);

export default router;