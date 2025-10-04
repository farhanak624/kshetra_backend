import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdventureSports,
  getAdventureSportById,
  getAdventureSportsByCategory,
  createAdventureSport,
  updateAdventureSport,
  deleteAdventureSport,
  getAdventureSportsForAdmin
} from '../controllers/adventureSportController';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Validation middleware for adventure sport creation/update
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

// Public routes
router.get('/', getAdventureSports);
router.get('/category/:category', getAdventureSportsByCategory);
router.get('/:id', getAdventureSportById);

// Admin routes
router.get('/admin/all', adminAuth, getAdventureSportsForAdmin);
router.post('/', adminAuth, adventureSportValidation, createAdventureSport);
router.put('/:id', adminAuth, adventureSportValidation, updateAdventureSport);
router.delete('/:id', adminAuth, deleteAdventureSport);

export default router;