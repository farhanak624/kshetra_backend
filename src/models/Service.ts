import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  name: string;
  category: 'addon' | 'transport' | 'food' | 'yoga' | 'adventure';
  subcategory?: string;
  price: number;
  priceUnit: 'per_person' | 'per_day' | 'per_session' | 'flat_rate';
  isActive: boolean;
  description?: string;
  ageRestriction?: {
    minAge?: number;
    maxAge?: number;
  };
  availableSlots?: number;
  duration?: number; // in minutes
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [100, 'Service name cannot be more than 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      enum: {
        values: ['addon', 'transport', 'food', 'yoga', 'adventure'],
        message: 'Category must be addon, transport, food, yoga, or adventure'
      }
    },
    subcategory: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative']
    },
    priceUnit: {
      type: String,
      required: [true, 'Price unit is required'],
      enum: {
        values: ['per_person', 'per_day', 'per_session', 'flat_rate'],
        message: 'Price unit must be per_person, per_day, per_session, or flat_rate'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    ageRestriction: {
      minAge: {
        type: Number,
        min: [0, 'Minimum age cannot be negative']
      },
      maxAge: {
        type: Number,
        min: [0, 'Maximum age cannot be negative']
      }
    },
    availableSlots: {
      type: Number,
      min: [0, 'Available slots cannot be negative']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    requirements: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

serviceSchema.index({ category: 1, isActive: 1 });

export default mongoose.model<IService>('Service', serviceSchema);