import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getDashboardStats,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllServices,
  createService,
  updateService,
  getAllBookings,
  createAdminBooking,
  updateBookingStatus,
  getAllUsers,
  getRoomAvailability,
  bulkUpdateRoomAvailability,
  getRoomStats,
  createAgency,
  getAgencies,
  updateAgency,
  activateAgency,
  deactivateAgency,
  deleteAgency,
  getActiveAgency
} from '../controllers/adminController';
import {
  getVehiclesForAdmin,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleRentalController';
import {
  getAdventureSportsForAdmin,
  createAdventureSport,
  updateAdventureSport,
  deleteAdventureSport
} from '../controllers/adventureSportController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { uploadMultiple } from '../middleware/upload';
import { handleFormDataArrays } from '../middleware/formData';

const router = express.Router();

// Apply admin authorization to all routes
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Room Management
const roomValidation = [
  body('roomNumber')
    .trim()
    .notEmpty()
    .withMessage('Room number is required'),
  body('roomType')
    .isIn(['AC', 'Non-AC'])
    .withMessage('Room type must be AC or Non-AC'),
  body('pricePerNight')
    .isFloat({ min: 0 })
    .withMessage('Price per night must be a positive number'),
  body('capacity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Capacity must be between 1 and 10'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
];

const roomQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('roomType')
    .optional()
    .isIn(['AC', 'Non-AC'])
    .withMessage('Invalid room type'),
  query('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be boolean')
];

router.get('/rooms', validate(roomQueryValidation), getAllRooms);
router.post('/rooms', uploadMultiple, handleFormDataArrays, validate(roomValidation), createRoom);
router.put('/rooms/:id',
  param('id').isMongoId().withMessage('Valid room ID required'),
  uploadMultiple,
  handleFormDataArrays,
  validate(roomValidation),
  updateRoom
);
router.delete('/rooms/:id',
  param('id').isMongoId().withMessage('Valid room ID required'),
  deleteRoom
);

// Room availability and stats
const availabilityQueryValidation = [
  query('checkIn')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  query('checkOut')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  query('roomType')
    .optional()
    .isIn(['AC', 'Non-AC'])
    .withMessage('Invalid room type'),
  query('capacity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Capacity must be between 1 and 10')
];

const bulkUpdateValidation = [
  body('roomIds')
    .isArray({ min: 1 })
    .withMessage('Room IDs array is required'),
  body('roomIds.*')
    .isMongoId()
    .withMessage('Each room ID must be valid'),
  body('isAvailable')
    .isBoolean()
    .withMessage('isAvailable must be boolean')
];

router.get('/rooms/availability', validate(availabilityQueryValidation), getRoomAvailability);
router.patch('/rooms/bulk-availability', validate(bulkUpdateValidation), bulkUpdateRoomAvailability);
router.get('/rooms/stats', getRoomStats);

// Service Management
const serviceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('category')
    .isIn(['addon', 'transport', 'food', 'yoga', 'adventure'])
    .withMessage('Category must be addon, transport, food, yoga, or adventure'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('priceUnit')
    .isIn(['per_person', 'per_day', 'per_session', 'flat_rate'])
    .withMessage('Invalid price unit'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('ageRestriction.minAge')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum age must be a non-negative integer'),
  body('ageRestriction.maxAge')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum age must be a non-negative integer')
];

const serviceQueryValidation = [
  query('category')
    .optional()
    .isIn(['addon', 'transport', 'food', 'yoga', 'adventure'])
    .withMessage('Invalid category'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
];

router.get('/services', validate(serviceQueryValidation), getAllServices);
router.post('/services', validate(serviceValidation), createService);
router.put('/services/:id',
  param('id').isMongoId().withMessage('Valid service ID required'),
  validate(serviceValidation),
  updateService
);

// Booking Management
const bookingQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(value);
    })
    .withMessage('Invalid status'),
  query('paymentStatus')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['pending', 'paid', 'failed', 'refunded'].includes(value);
    })
    .withMessage('Invalid payment status'),
  query('bookingType')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['room', 'yoga', 'adventure', 'transport', 'service'].includes(value);
    })
    .withMessage('Invalid booking type'),
  query('hasTransport')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['pickup', 'drop', 'both'].includes(value);
    })
    .withMessage('Invalid transport filter'),
  query('hasYoga')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['true', 'false'].includes(value);
    })
    .withMessage('Invalid yoga filter'),
  query('hasServices')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['true', 'false'].includes(value);
    })
    .withMessage('Invalid services filter'),
  query('dateFrom')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return !isNaN(Date.parse(value));
    })
    .withMessage('Invalid date format for dateFrom'),
  query('dateTo')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return !isNaN(Date.parse(value));
    })
    .withMessage('Invalid date format for dateTo'),
  query('search')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      if (value.length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }
      return true;
    })
];

const updateBookingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID required'),
  body('status')
    .isIn(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const createBookingValidation = [
  body('roomId')
    .isMongoId()
    .withMessage('Valid room ID is required'),
  body('checkIn')
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  body('checkOut')
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  body('guests')
    .isArray({ min: 1 })
    .withMessage('At least one guest is required'),
  body('guests.*.name')
    .trim()
    .notEmpty()
    .withMessage('Guest name is required'),
  body('guests.*.age')
    .isInt({ min: 0, max: 120 })
    .withMessage('Guest age must be between 0 and 120'),
  body('primaryGuestInfo.name')
    .trim()
    .notEmpty()
    .withMessage('Primary guest name is required'),
  body('primaryGuestInfo.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('primaryGuestInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
    .withMessage('Invalid status'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

router.get('/bookings', validate(bookingQueryValidation), getAllBookings);
router.post('/bookings', validate(createBookingValidation), createAdminBooking);
router.put('/bookings/:id/status', validate(updateBookingValidation), updateBookingStatus);

// User Management
const userQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters')
];

router.get('/users', validate(userQueryValidation), getAllUsers);

// Agency management routes
const agencyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Agency name is required')
    .isLength({ max: 100 })
    .withMessage('Agency name cannot be more than 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('contactPhone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid contact phone is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 200 })
    .withMessage('Address cannot be more than 200 characters')
];

const agencyUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Agency name cannot be more than 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('contactPhone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid contact phone is required'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot be more than 200 characters')
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid agency ID')
];

router.post('/agencies', validate(agencyValidation), createAgency);
router.get('/agencies', getAgencies);
router.put('/agencies/:id', validate([...idValidation, ...agencyUpdateValidation]), updateAgency);
router.put('/agencies/:id/activate', validate(idValidation), activateAgency);
router.put('/agencies/:id/deactivate', validate(idValidation), deactivateAgency);
router.delete('/agencies/:id', validate(idValidation), deleteAgency);
router.get('/agencies/active', getActiveAgency);

// Vehicle Rental Management
const vehicleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Vehicle name is required'),
  body('type')
    .isIn(['2-wheeler', '4-wheeler'])
    .withMessage('Invalid vehicle type'),
  body('category')
    .isIn(['scooter', 'bike', 'car', 'suv'])
    .withMessage('Invalid vehicle category'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required'),
  body('vehicleModel')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required'),
  body('year')
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
  body('fuelType')
    .isIn(['petrol', 'diesel', 'electric'])
    .withMessage('Invalid fuel type'),
  body('transmission')
    .isIn(['manual', 'automatic'])
    .withMessage('Invalid transmission type'),
  body('seatingCapacity')
    .isInt({ min: 1, max: 20 })
    .withMessage('Invalid seating capacity'),
  body('pricePerDay')
    .isFloat({ min: 0 })
    .withMessage('Price per day must be a positive number'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('location.pickupLocation')
    .trim()
    .notEmpty()
    .withMessage('Pickup location is required'),
  body('depositAmount')
    .isFloat({ min: 0 })
    .withMessage('Deposit amount must be a positive number'),
  body('contactInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone is required'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Valid contact email is required')
];

const vehicleQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['2-wheeler', '4-wheeler'])
    .withMessage('Invalid vehicle type'),
  query('category')
    .optional()
    .isIn(['scooter', 'bike', 'car', 'suv'])
    .withMessage('Invalid vehicle category'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
];

router.get('/vehicles', validate(vehicleQueryValidation), getVehiclesForAdmin);
router.post('/vehicles', validate(vehicleValidation), createVehicle);
router.put('/vehicles/:id',
  param('id').isMongoId().withMessage('Valid vehicle ID required'),
  validate(vehicleValidation),
  updateVehicle
);
router.delete('/vehicles/:id',
  param('id').isMongoId().withMessage('Valid vehicle ID required'),
  deleteVehicle
);

// Adventure Sports Management
const adventureSportValidation = [
  body('name')
    .notEmpty()
    .withMessage('Activity name is required')
    .isLength({ max: 100 })
    .withMessage('Activity name cannot exceed 100 characters'),

  body('category')
    .isIn(['adventure', 'surfing', 'diving', 'trekking'])
    .withMessage('Category must be adventure, surfing, diving, or trekking'),

  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative'),

  body('priceUnit')
    .isIn(['per_session', 'per_person', 'per_day', 'per_trip'])
    .withMessage('Price unit must be per_session, per_person, per_day, or per_trip'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('detailedDescription')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Detailed description cannot exceed 2000 characters'),

  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),

  body('maxQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum quantity must be at least 1'),

  body('ageRestriction.minAge')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum age cannot be negative'),

  body('ageRestriction.maxAge')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum age cannot be negative')
];

const adventureSportQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(['adventure', 'surfing', 'diving', 'trekking'])
    .withMessage('Invalid category'),
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
];

router.get('/adventure-sports', validate(adventureSportQueryValidation), getAdventureSportsForAdmin);
router.post('/adventure-sports', validate(adventureSportValidation), createAdventureSport);
router.put('/adventure-sports/:id',
  param('id').isMongoId().withMessage('Valid adventure sport ID required'),
  validate(adventureSportValidation),
  updateAdventureSport
);
router.delete('/adventure-sports/:id',
  param('id').isMongoId().withMessage('Valid adventure sport ID required'),
  deleteAdventureSport
);

export default router;