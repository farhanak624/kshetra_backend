import express from 'express';
import { body, param } from 'express-validator';
import {
  agencyLogin,
  agencyProfile,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getBookings,
  assignTransport,
  updateAssignmentStatus,
  uploadDriverLicense,
  uploadDriverPhoto,
  uploadVehicleImages
} from '../controllers/agencyController';
import { agencyAuth } from '../middleware/agencyAuth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = express.Router();

// Authentication routes
router.post('/login', [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], agencyLogin);

router.get('/profile', agencyAuth, agencyProfile);

// Vehicle management routes
router.get('/vehicles', agencyAuth, getVehicles);

router.post('/vehicles', agencyAuth, [
  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required')
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/)
    .withMessage('Invalid vehicle number format (e.g., KL07AB1234)'),
  body('vehicleType')
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isIn(['sedan', 'suv', 'hatchback', 'minivan', 'bus', 'luxury_sedan', 'luxury_suv'])
    .withMessage('Invalid vehicle type'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Vehicle brand is required')
    .isLength({ max: 50 })
    .withMessage('Brand name cannot be more than 50 characters'),
  body('vehicleModel')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required')
    .isLength({ max: 50 })
    .withMessage('Model name cannot be more than 50 characters'),
  body('capacity')
    .isInt({ min: 1, max: 50 })
    .withMessage('Capacity must be between 1 and 50'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('features.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each feature must be maximum 50 characters')
], createVehicle);

router.put('/vehicles/:id', agencyAuth, [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('vehicleNumber')
    .optional()
    .trim()
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/)
    .withMessage('Invalid vehicle number format (e.g., KL07AB1234)'),
  body('vehicleType')
    .optional()
    .isIn(['sedan', 'suv', 'hatchback', 'minivan', 'bus', 'luxury_sedan', 'luxury_suv'])
    .withMessage('Invalid vehicle type'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot be more than 50 characters'),
  body('vehicleModel')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Model name cannot be more than 50 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Capacity must be between 1 and 50'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('features.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each feature must be maximum 50 characters')
], updateVehicle);

router.delete('/vehicles/:id', agencyAuth, [
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], deleteVehicle);

// Driver management routes
router.get('/drivers', agencyAuth, getDrivers);

router.post('/drivers', agencyAuth, [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Driver name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot be more than 100 characters'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('License number is required')
    .isLength({ max: 20 })
    .withMessage('License number cannot be more than 20 characters'),
  body('licenseType')
    .notEmpty()
    .withMessage('License type is required')
    .isIn(['light_vehicle', 'heavy_vehicle', 'commercial', 'international'])
    .withMessage('Invalid license type'),
  body('licenseExpiryDate')
    .isISO8601()
    .withMessage('Invalid license expiry date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('License expiry date must be in the future');
      }
      return true;
    }),
  body('experience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('languages')
    .isArray({ min: 1 })
    .withMessage('At least one language is required'),
  body('languages.*')
    .isLength({ max: 30 })
    .withMessage('Each language must be maximum 30 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 200 })
    .withMessage('Address cannot be more than 200 characters'),
  body('emergencyContact.name')
    .trim()
    .notEmpty()
    .withMessage('Emergency contact name is required')
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot be more than 100 characters'),
  body('emergencyContact.phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid emergency contact phone number'),
  body('emergencyContact.relationship')
    .trim()
    .notEmpty()
    .withMessage('Emergency contact relationship is required')
    .isLength({ max: 50 })
    .withMessage('Relationship cannot be more than 50 characters')
], createDriver);

router.put('/drivers/:id', agencyAuth, [
  param('id').isMongoId().withMessage('Invalid driver ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot be more than 100 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('License number cannot be more than 20 characters'),
  body('licenseType')
    .optional()
    .isIn(['light_vehicle', 'heavy_vehicle', 'commercial', 'international'])
    .withMessage('Invalid license type'),
  body('licenseExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid license expiry date')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('License expiry date must be in the future');
      }
      return true;
    }),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('languages')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one language is required'),
  body('languages.*')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Each language must be maximum 30 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot be more than 200 characters'),
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot be more than 100 characters'),
  body('emergencyContact.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid emergency contact phone number'),
  body('emergencyContact.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship cannot be more than 50 characters')
], updateDriver);

router.delete('/drivers/:id', agencyAuth, [
  param('id').isMongoId().withMessage('Invalid driver ID')
], deleteDriver);

// Driver image upload routes
router.post('/drivers/:id/upload-license', agencyAuth, uploadSingle, [
  param('id').isMongoId().withMessage('Invalid driver ID')
], uploadDriverLicense);

router.post('/drivers/:id/upload-photo', agencyAuth, uploadSingle, [
  param('id').isMongoId().withMessage('Invalid driver ID')
], uploadDriverPhoto);

// Vehicle image upload routes
router.post('/vehicles/:id/upload-images', agencyAuth, uploadMultiple, [
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], uploadVehicleImages);

// Booking management routes
router.get('/bookings', agencyAuth, getBookings);

router.post('/bookings/:bookingId/assign', agencyAuth, [
  param('bookingId').isMongoId().withMessage('Invalid booking ID'),
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .isMongoId()
    .withMessage('Invalid vehicle ID'),
  body('driverId')
    .notEmpty()
    .withMessage('Driver ID is required')
    .isMongoId()
    .withMessage('Invalid driver ID'),
  body('pickupTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid pickup time format'),
  body('dropTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid drop time format'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters')
], assignTransport);

router.put('/assignments/:assignmentId/status', agencyAuth, [
  param('assignmentId').isMongoId().withMessage('Invalid assignment ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['assigned', 'in_progress', 'pickup_completed', 'drop_completed', 'completed', 'cancelled'])
    .withMessage('Invalid assignment status')
], updateAssignmentStatus);

export default router;