import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicleRental extends Document {
  name: string;
  type: '2-wheeler' | '4-wheeler';
  category: 'scooter' | 'bike' | 'car' | 'suv';
  brand: string;
  vehicleModel: string;
  year: number;
  fuelType: 'petrol' | 'diesel' | 'electric';
  transmission: 'manual' | 'automatic';
  seatingCapacity: number;
  pricePerDay: number;
  images: string[];
  features: string[];
  description: string;
  specifications: {
    engine?: string;
    mileage?: string;
    fuelCapacity?: string;
    power?: string;
    torque?: string;
    topSpeed?: string;
  };
  availability: {
    isAvailable: boolean;
    availableFrom?: Date;
    availableTo?: Date;
  };
  location: {
    pickupLocation: string;
    dropLocation?: string;
  };
  insurance: {
    included: boolean;
    coverage?: string;
  };
  driverOption: {
    withDriver: boolean;
    withoutDriver: boolean;
    driverChargePerDay?: number;
  };
  depositAmount: number;
  termsAndConditions: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleRentalSchema = new Schema<IVehicleRental>(
  {
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['2-wheeler', '4-wheeler'],
      required: [true, 'Vehicle type is required']
    },
    category: {
      type: String,
      enum: ['scooter', 'bike', 'car', 'suv'],
      required: [true, 'Vehicle category is required']
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1990, 'Year cannot be less than 1990'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric'],
      required: [true, 'Fuel type is required']
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic'],
      required: [true, 'Transmission type is required']
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Seating capacity must be at least 1'],
      max: [20, 'Seating capacity cannot exceed 20']
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative']
    },
    images: [{
      type: String,
      trim: true
    }],
    features: [{
      type: String,
      trim: true
    }],
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    specifications: {
      engine: {
        type: String,
        trim: true
      },
      mileage: {
        type: String,
        trim: true
      },
      fuelCapacity: {
        type: String,
        trim: true
      },
      power: {
        type: String,
        trim: true
      },
      torque: {
        type: String,
        trim: true
      },
      topSpeed: {
        type: String,
        trim: true
      }
    },
    availability: {
      isAvailable: {
        type: Boolean,
        default: true
      },
      availableFrom: {
        type: Date
      },
      availableTo: {
        type: Date
      }
    },
    location: {
      pickupLocation: {
        type: String,
        required: [true, 'Pickup location is required'],
        trim: true
      },
      dropLocation: {
        type: String,
        trim: true
      }
    },
    insurance: {
      included: {
        type: Boolean,
        default: true
      },
      coverage: {
        type: String,
        trim: true
      }
    },
    driverOption: {
      withDriver: {
        type: Boolean,
        default: true
      },
      withoutDriver: {
        type: Boolean,
        default: true
      },
      driverChargePerDay: {
        type: Number,
        min: [0, 'Driver charge cannot be negative']
      }
    },
    depositAmount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit amount cannot be negative']
    },
    termsAndConditions: [{
      type: String,
      trim: true
    }],
    contactInfo: {
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        trim: true,
        lowercase: true
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

// Indexes for efficient querying
vehicleRentalSchema.index({ type: 1, isActive: 1 });
vehicleRentalSchema.index({ category: 1, isActive: 1 });
vehicleRentalSchema.index({ 'availability.isAvailable': 1 });
vehicleRentalSchema.index({ pricePerDay: 1 });

export default mongoose.model<IVehicleRental>('VehicleRental', vehicleRentalSchema);