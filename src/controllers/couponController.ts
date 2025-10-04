import { Response } from 'express';
import mongoose from 'mongoose';
import { Coupon, CouponUsage } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { pricingCalculator } from '../utils/pricing';

// Admin Functions

// Create a new coupon
export const createCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      applicableServices,
      minOrderValue,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
      return;
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      applicableServices,
      minOrderValue,
      maxDiscount,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit,
      createdBy: new mongoose.Types.ObjectId(req.user?.userId)
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create coupon'
    });
  }
};

// Get all coupons with pagination and filters
export const getAllCoupons = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.serviceType) {
      filter.applicableServices = { $in: [req.query.serviceType] };
    }

    if (req.query.discountType) {
      filter.discountType = req.query.discountType;
    }

    // Date filters
    if (req.query.validFrom) {
      filter.validFrom = { $gte: new Date(req.query.validFrom as string) };
    }

    if (req.query.validUntil) {
      filter.validUntil = { $lte: new Date(req.query.validUntil as string) };
    }

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Coupon.countDocuments(filter);

    res.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons'
    });
  }
};

// Get coupon by ID
export const getCouponById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
      return;
    }

    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }

    // Get usage statistics
    const usageCount = await CouponUsage.getCouponUsageCount(coupon._id as mongoose.Types.ObjectId);
    const recentUsages = await CouponUsage.find({ couponId: coupon._id })
      .populate('bookingId', 'checkIn checkOut totalAmount')
      .sort({ usedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        coupon,
        statistics: {
          totalUsages: usageCount,
          recentUsages
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon'
    });
  }
};

// Update coupon
export const updateCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
      return;
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.createdBy;
    delete updates.currentUsageCount;

    // If code is being updated, check for duplicates
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
      const existingCoupon = await Coupon.findOne({
        code: updates.code,
        _id: { $ne: id }
      });

      if (existingCoupon) {
        res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
        return;
      }
    }

    updates.updatedBy = new mongoose.Types.ObjectId(req.user?.userId);

    const coupon = await Coupon.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('createdBy', 'name email').populate('updatedBy', 'name email');

    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update coupon'
    });
  }
};

// Toggle coupon status
export const toggleCouponStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
      return;
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }

    coupon.isActive = !coupon.isActive;
    coupon.updatedBy = new mongoose.Types.ObjectId(req.user?.userId);
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: coupon
    });
  } catch (error: any) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle coupon status'
    });
  }
};

// Delete coupon
export const deleteCoupon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
      return;
    }

    // Check if coupon has been used
    const usageCount = await CouponUsage.countDocuments({ couponId: id });
    if (usageCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete coupon that has been used. Please deactivate it instead.'
      });
      return;
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon'
    });
  }
};

// Public Functions

// Validate coupon
export const validateCoupon = async (req: any, res: Response): Promise<void> => {
  try {
    const { code, serviceType, orderValue, userId, phoneNumber } = req.body;

    if (!code || !serviceType || !orderValue) {
      res.status(400).json({
        success: false,
        message: 'Coupon code, service type, and order value are required'
      });
      return;
    }

    // Find coupon by code
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
      return;
    }

    // Validate coupon for service
    const validation = pricingCalculator.validateCouponForService(coupon, serviceType);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
    }

    // Check if user has already used this coupon
    if (userId || phoneNumber) {
      const hasUsed = await CouponUsage.hasUserUsedCoupon(
        coupon._id as mongoose.Types.ObjectId,
        userId ? new mongoose.Types.ObjectId(userId) : undefined,
        phoneNumber
      );
      if (hasUsed) {
        res.status(400).json({
          success: false,
          message: 'You have already used this coupon'
        });
        return;
      }
    }

    // Calculate discount
    const discount = pricingCalculator.calculateCouponDiscount(coupon, orderValue);
    const finalAmount = orderValue - discount;

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        discount,
        finalAmount
      }
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon'
    });
  }
};

// Get coupon usage statistics
export const getCouponStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    const expiredCoupons = await Coupon.countDocuments({
      validUntil: { $lt: new Date() }
    });

    const totalUsages = await CouponUsage.countDocuments();
    const totalDiscountGiven = await CouponUsage.aggregate([
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: '$discountAmount' }
        }
      }
    ]);

    // Most used coupons
    const mostUsedCoupons = await CouponUsage.aggregate([
      {
        $group: {
          _id: '$couponId',
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' }
        }
      },
      {
        $lookup: {
          from: 'coupons',
          localField: '_id',
          foreignField: '_id',
          as: 'coupon'
        }
      },
      {
        $unwind: '$coupon'
      },
      {
        $sort: { usageCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          code: '$coupon.code',
          description: '$coupon.description',
          usageCount: 1,
          totalDiscount: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCoupons,
          activeCoupons,
          expiredCoupons,
          totalUsages,
          totalDiscountGiven: totalDiscountGiven[0]?.totalDiscount || 0
        },
        mostUsedCoupons
      }
    });
  } catch (error: any) {
    console.error('Error fetching coupon statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon statistics'
    });
  }
};