import express from 'express';
import { body, param } from 'express-validator';
import {
  getVehicles,
  getVehicleById,
  getVehiclesByType,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesForAdmin,
  uploadVehicleRentalImages
} from '../controllers/vehicleRentalController';
import { adminAuth } from '../middleware/adminAuth';
import { uploadMultiple } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getVehicles);
router.get('/type/:type', getVehiclesByType);
router.get('/:id', getVehicleById);

// Admin routes
router.get('/admin/all', adminAuth, getVehiclesForAdmin);

router.post('/admin/create',
  adminAuth,
  [
    body('name').notEmpty().withMessage('Vehicle name is required'),
    body('type').isIn(['2-wheeler', '4-wheeler']).withMessage('Invalid vehicle type'),
    body('category').isIn(['scooter', 'bike', 'car', 'suv']).withMessage('Invalid vehicle category'),
    body('brand').notEmpty().withMessage('Brand is required'),
    body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
    body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
    body('fuelType').isIn(['petrol', 'diesel', 'electric']).withMessage('Invalid fuel type'),
    body('transmission').isIn(['manual', 'automatic']).withMessage('Invalid transmission type'),
    body('seatingCapacity').isInt({ min: 1, max: 20 }).withMessage('Invalid seating capacity'),
    body('pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
    body('description').notEmpty().withMessage('Description is required'),
    body('location.pickupLocation').notEmpty().withMessage('Pickup location is required'),
    body('depositAmount').isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
    body('contactInfo.phone').notEmpty().withMessage('Contact phone is required'),
    body('contactInfo.email').isEmail().withMessage('Valid contact email is required')
  ],
  createVehicle
);

router.put('/admin/:id',
  adminAuth,
  [
    body('name').optional().notEmpty().withMessage('Vehicle name cannot be empty'),
    body('type').optional().isIn(['2-wheeler', '4-wheeler']).withMessage('Invalid vehicle type'),
    body('category').optional().isIn(['scooter', 'bike', 'car', 'suv']).withMessage('Invalid vehicle category'),
    body('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
    body('vehicleModel').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
    body('year').optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
    body('fuelType').optional().isIn(['petrol', 'diesel', 'electric']).withMessage('Invalid fuel type'),
    body('transmission').optional().isIn(['manual', 'automatic']).withMessage('Invalid transmission type'),
    body('seatingCapacity').optional().isInt({ min: 1, max: 20 }).withMessage('Invalid seating capacity'),
    body('pricePerDay').optional().isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
    body('depositAmount').optional().isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
    body('contactInfo.email').optional().isEmail().withMessage('Valid contact email is required')
  ],
  updateVehicle
);

router.delete('/admin/:id', adminAuth, deleteVehicle);

// Vehicle image upload route
router.post('/admin/:id/upload-images', adminAuth, uploadMultiple, [
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], uploadVehicleRentalImages);

export default router;