import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  vehicleNumber: string;
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'minivan' | 'bus' | 'luxury_sedan' | 'luxury_suv';
  brand: string;
  vehicleModel: string;
  capacity: number;
  vehicleImages: string[]; // Array of image URLs
  agencyId: mongoose.Types.ObjectId;
  isAvailable: boolean;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, 'Please enter a valid vehicle number (e.g., KL07AB1234)']
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['sedan', 'suv', 'hatchback', 'minivan', 'bus', 'luxury_sedan', 'luxury_suv'],
        message: 'Invalid vehicle type'
      }
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true,
      maxlength: [50, 'Brand name cannot be more than 50 characters']
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
      maxlength: [50, 'Model name cannot be more than 50 characters']
    },
    capacity: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [50, 'Capacity cannot be more than 50']
    },
    vehicleImages: {
      type: [String],
      default: [],
      validate: {
        validator: function(images: string[]) {
          return images.length <= 10; // Limit to 10 images per vehicle
        },
        message: 'Cannot have more than 10 images per vehicle'
      }
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency ID is required']
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    features: {
      type: [String],
      default: [],
      validate: {
        validator: function(features: string[]) {
          return features.every(feature => typeof feature === 'string' && feature.length <= 50);
        },
        message: 'Each feature must be a string with maximum 50 characters'
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
vehicleSchema.index({ agencyId: 1, isAvailable: 1 });
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ vehicleType: 1 });

// Virtual for full vehicle name
vehicleSchema.virtual('fullName').get(function(this: IVehicle) {
  return `${this.brand} ${this.vehicleModel} (${this.vehicleNumber})`;
});

export default mongoose.model<IVehicle>('Vehicle', vehicleSchema);