import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableServices: ('airport' | 'yoga' | 'rental' | 'adventure')[];
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  currentUsageCount: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  isCurrentlyValid: boolean;

  // Instance methods
  isApplicableToService(serviceType: string): boolean;
  calculateDiscount(orderValue: number): number;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers']
    },
    description: {
      type: String,
      required: [true, 'Coupon description is required'],
      trim: true,
      maxlength: [200, 'Description cannot be more than 200 characters']
    },
    discountType: {
      type: String,
      enum: {
        values: ['percentage', 'fixed'],
        message: 'Discount type must be either percentage or fixed'
      },
      required: [true, 'Discount type is required']
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
      validate: {
        validator: function(this: ICoupon, value: number) {
          if (this.discountType === 'percentage') {
            return value <= 100;
          }
          return true;
        },
        message: 'Percentage discount cannot be more than 100%'
      }
    },
    applicableServices: {
      type: [String],
      enum: {
        values: ['airport', 'yoga', 'rental', 'adventure'],
        message: 'Service must be one of: airport, yoga, rental, adventure'
      },
      required: [true, 'At least one applicable service is required'],
      validate: {
        validator: function(services: string[]) {
          return services.length > 0;
        },
        message: 'At least one applicable service is required'
      }
    },
    minOrderValue: {
      type: Number,
      min: [0, 'Minimum order value cannot be negative'],
      default: 0
    },
    maxDiscount: {
      type: Number,
      min: [0, 'Maximum discount cannot be negative'],
      validate: {
        validator: function(this: ICoupon, value?: number) {
          if (this.discountType === 'fixed' && value !== undefined) {
            return value >= this.discountValue;
          }
          return true;
        },
        message: 'Maximum discount cannot be less than discount value for fixed discounts'
      }
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required']
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
      validate: {
        validator: function(this: ICoupon, value: Date) {
          return value > this.validFrom;
        },
        message: 'Valid until date must be after valid from date'
      }
    },
    usageLimit: {
      type: Number,
      min: [1, 'Usage limit must be at least 1']
    },
    currentUsageCount: {
      type: Number,
      default: 0,
      min: [0, 'Current usage count cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ applicableServices: 1 });
couponSchema.index({ createdAt: -1 });

// Virtual to check if coupon is currently valid
couponSchema.virtual('isCurrentlyValid').get(function(this: ICoupon) {
  const now = new Date();
  return this.isActive &&
         this.validFrom <= now &&
         this.validUntil >= now &&
         (!this.usageLimit || this.currentUsageCount < this.usageLimit);
});

// Method to check if coupon is applicable to a service
couponSchema.methods.isApplicableToService = function(serviceType: string): boolean {
  return this.applicableServices.includes(serviceType as any);
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderValue: number): number {
  if (this.minOrderValue && orderValue < this.minOrderValue) {
    return 0;
  }

  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderValue * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  // Apply maximum discount limit if specified
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  return Math.min(discount, orderValue); // Discount cannot exceed order value
};

// Pre-save middleware
couponSchema.pre('save', function(next) {
  // Convert code to uppercase
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }

  next();
});

export default mongoose.model<ICoupon>('Coupon', couponSchema);