import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyYogaSession extends Document {
  name: string;
  type: 'regular' | 'therapy';
  price: number;
  duration: number; // in minutes
  description: string;
  timeSlots: {
    time: string;
    isActive: boolean;
  }[];
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dailyYogaSessionSchema = new Schema<IDailyYogaSession>(
  {
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
      maxlength: [100, 'Session name cannot be more than 100 characters']
    },
    type: {
      type: String,
      required: [true, 'Session type is required'],
      enum: {
        values: ['regular', 'therapy'],
        message: 'Session type must be regular or therapy'
      }
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [30, 'Duration must be at least 30 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes'],
      default: 90
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    timeSlots: [{
      time: {
        type: String,
        required: [true, 'Time slot is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    features: {
      type: [String],
      required: [true, 'Features are required'],
      validate: {
        validator: function(features: string[]) {
          return features.length > 0;
        },
        message: 'At least one feature is required'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

dailyYogaSessionSchema.index({ type: 1, isActive: 1 });
dailyYogaSessionSchema.index({ 'timeSlots.isActive': 1 });

export default mongoose.model<IDailyYogaSession>('DailyYogaSession', dailyYogaSessionSchema);