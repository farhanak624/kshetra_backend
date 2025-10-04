// @ts-nocheck
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AdventureSport } from '../models';

// Get all adventure sports (public)
export const getAdventureSports = async (req: Request, res: Response) => {
  try {
    const { category, difficulty, minPrice, maxPrice, sortBy = 'price', sortOrder = 'asc' } = req.query;

    // Build filter object
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const sports = await AdventureSport.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      data: {
        sports,
        count: sports.length
      }
    });
  } catch (error) {
    console.error('Get adventure sports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get adventure sport by ID (public)
export const getAdventureSportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sport = await AdventureSport.findOne({
      _id: id,
      isActive: true
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Adventure sport not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sport
    });
  } catch (error) {
    console.error('Get adventure sport by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get adventure sports by category (public)
export const getAdventureSportsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    if (!['adventure', 'surfing', 'diving', 'trekking'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be adventure, surfing, diving, or trekking'
      });
    }

    const sports = await AdventureSport.find({
      category,
      isActive: true
    }).sort({ price: 1 });

    res.status(200).json({
      success: true,
      data: {
        sports,
        count: sports.length,
        category
      }
    });
  } catch (error) {
    console.error('Get adventure sports by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create adventure sport (admin only)
export const createAdventureSport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const sport = new AdventureSport(req.body);
    await sport.save();

    res.status(201).json({
      success: true,
      message: 'Adventure sport created successfully',
      data: sport
    });
  } catch (error) {
    console.error('Create adventure sport error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update adventure sport (admin only)
export const updateAdventureSport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const sport = await AdventureSport.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Adventure sport not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Adventure sport updated successfully',
      data: sport
    });
  } catch (error) {
    console.error('Update adventure sport error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete adventure sport (admin only)
export const deleteAdventureSport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sport = await AdventureSport.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Adventure sport not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Adventure sport deleted successfully'
    });
  } catch (error) {
    console.error('Delete adventure sport error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all adventure sports for admin
export const getAdventureSportsForAdmin = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, difficulty, isActive } = req.query;

    // Build filter object
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sports = await AdventureSport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalSports = await AdventureSport.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        sports,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalSports / Number(limit)),
          totalSports,
          hasNextPage: Number(page) < Math.ceil(totalSports / Number(limit)),
          hasPrevPage: Number(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get adventure sports for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};