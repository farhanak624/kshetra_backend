// @ts-nocheck
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { VehicleRental } from '../models';
import {
  uploadMultipleImages,
  IMAGE_FOLDERS,
  IMAGE_TRANSFORMATIONS
} from '../utils/imagekitUpload';

// Get all vehicles (public)
export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { type, category, minPrice, maxPrice, sortBy = 'pricePerDay', sortOrder = 'asc' } = req.query;
    console.log('sahgdsahgsdaad');
    // Build filter object
    const filter: any = { isActive: true, 'availability.isAvailable': true };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const vehicles = await VehicleRental.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        count: vehicles.length
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get vehicle by ID (public)
export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vehicle = await VehicleRental.findOne({
      _id: id,
      isActive: true,
      'availability.isAvailable': true
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get vehicles by type (public)
export const getVehiclesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!['2-wheeler', '4-wheeler'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle type. Must be "2-wheeler" or "4-wheeler"'
      });
    }

    const vehicles = await VehicleRental.find({
      type,
      isActive: true,
      'availability.isAvailable': true
    }).sort({ pricePerDay: 1 });

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        count: vehicles.length,
        type
      }
    });
  } catch (error) {
    console.error('Get vehicles by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create vehicle (admin only)
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vehicle = new VehicleRental(req.body);
    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);

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

// Update vehicle (admin only)
export const updateVehicle = async (req: Request, res: Response) => {
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

    const vehicle = await VehicleRental.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);

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

// Delete vehicle (admin only)
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vehicle = await VehicleRental.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all vehicles for admin
export const getVehiclesForAdmin = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type, category, isActive } = req.query;

    // Build filter object
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const vehicles = await VehicleRental.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalVehicles = await VehicleRental.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalVehicles / Number(limit)),
          totalVehicles,
          hasNextPage: Number(page) < Math.ceil(totalVehicles / Number(limit)),
          hasPrevPage: Number(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get vehicles for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload vehicle rental images
export const uploadVehicleRentalImages = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const { id: vehicleId } = req.params;

    // Verify vehicle exists
    const vehicle = await VehicleRental.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if adding new images would exceed the limit
    const currentImageCount = vehicle.images.length;
    const newImageCount = req.files.length;
    if (currentImageCount + newImageCount > 10) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${newImageCount} images. Vehicle already has ${currentImageCount} images. Maximum allowed is 10.`
      });
    }

    // Upload vehicle images to ImageKit
    const imageUrls = await uploadMultipleImages(req.files, {
      folder: IMAGE_FOLDERS.VEHICLES,
      fileName: `vehicle_rental_${vehicleId}`,
      transformation: IMAGE_TRANSFORMATIONS.VEHICLE_PHOTO
    });

    // Add new image URLs to vehicle's image array
    vehicle.images.push(...imageUrls);
    await vehicle.save();

    res.json({
      success: true,
      message: `${imageUrls.length} vehicle images uploaded successfully`,
      data: {
        vehicle,
        newImageUrls: imageUrls,
        totalImages: vehicle.images.length
      }
    });
  } catch (error) {
    console.error('Upload vehicle rental images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload vehicle images'
    });
  }
};