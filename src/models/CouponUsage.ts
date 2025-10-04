import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICouponUsage extends Document {
  couponId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // For registered users
  phoneNumber?: string; // For guest users - primary identifier
  email?: string; // Additional identifier for guests
  bookingId: mongoose.Types.ObjectId;
  usedAt: Date;
  discountAmount: number;
  orderValue: number;
  serviceType: 'airport' | 'yoga' | 'rental' | 'adventure';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponUsageModel extends Model<ICouponUsage> {
  hasUserUsedCoupon(
    couponId: mongoose.Types.ObjectId,
    userId?: mongoose.Types.ObjectId,
    phoneNumber?: string
  ): Promise<boolean>;

  getCouponUsageCount(couponId: mongoose.Types.ObjectId): Promise<number>;

  getUserCouponHistory(
    userId?: mongoose.Types.ObjectId,
    phoneNumber?: string
  ): Promise<ICouponUsage[]>;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: [true, 'Coupon ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function(this: ICouponUsage) {
        return !this.phoneNumber; // Required if phoneNumber is not provided
      }
    },
    phoneNumber: {
      type: String,
      trim: true,
      required: function(this: ICouponUsage) {
        return !this.userId; // Required if userId is not provided
      },
      validate: {
        validator: function(value: string) {
          if (!value) return true; // Will be caught by conditional required
          return /^\+?[1-9]\d{1,14}$/.test(value);
        },
        message: 'Please enter a valid phone number'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true; // Email is optional
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
        },
        message: 'Please enter a valid email'
      }
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required']
    },
    usedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    discountAmount: {
      type: Number,
      required: [true, 'Discount amount is required'],
      min: [0, 'Discount amount cannot be negative']
    },
    orderValue: {
      type: Number,
      required: [true, 'Order value is required'],
      min: [0, 'Order value cannot be negative']
    },
    serviceType: {
      type: String,
      enum: {
        values: ['airport', 'yoga', 'rental', 'adventure'],
        message: 'Service type must be one of: airport, yoga, rental, adventure'
      },
      required: [true, 'Service type is required']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
couponUsageSchema.index({ couponId: 1 });
couponUsageSchema.index({ userId: 1 });
couponUsageSchema.index({ phoneNumber: 1 });
couponUsageSchema.index({ bookingId: 1 });
couponUsageSchema.index({ couponId: 1, userId: 1 }); // Compound index for checking user-specific usage
couponUsageSchema.index({ couponId: 1, phoneNumber: 1 }); // Compound index for checking phone-specific usage
couponUsageSchema.index({ usedAt: -1 });
couponUsageSchema.index({ serviceType: 1 });

// Static method to check if user has used a specific coupon
couponUsageSchema.statics.hasUserUsedCoupon = async function(
  couponId: mongoose.Types.ObjectId,
  userId?: mongoose.Types.ObjectId,
  phoneNumber?: string
): Promise<boolean> {
  const query: any = { couponId };

  if (userId) {
    query.userId = userId;
  } else if (phoneNumber) {
    query.phoneNumber = phoneNumber;
  } else {
    throw new Error('Either userId or phoneNumber must be provided');
  }

  const usage = await this.findOne(query);
  return !!usage;
};

// Static method to get usage count for a coupon
couponUsageSchema.statics.getCouponUsageCount = async function(
  couponId: mongoose.Types.ObjectId
): Promise<number> {
  return this.countDocuments({ couponId });
};

// Static method to get user's coupon usage history
couponUsageSchema.statics.getUserCouponHistory = async function(
  userId?: mongoose.Types.ObjectId,
  phoneNumber?: string
): Promise<ICouponUsage[]> {
  const query: any = {};

  if (userId) {
    query.userId = userId;
  } else if (phoneNumber) {
    query.phoneNumber = phoneNumber;
  } else {
    throw new Error('Either userId or phoneNumber must be provided');
  }

  return this.find(query)
    .populate('couponId', 'code description discountType discountValue')
    .populate('bookingId', 'checkIn checkOut totalAmount')
    .sort({ usedAt: -1 });
};

// Pre-save middleware to ensure either userId or phoneNumber is provided
couponUsageSchema.pre('save', function(next) {
  if (!this.userId && !this.phoneNumber) {
    const error = new Error('Either userId or phoneNumber must be provided');
    return next(error);
  }
  next();
});

export default mongoose.model<ICouponUsage, ICouponUsageModel>('CouponUsage', couponUsageSchema);