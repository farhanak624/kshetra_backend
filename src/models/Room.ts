import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  roomType: 'AC' | 'Non-AC';
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  isAvailable: boolean;
  description?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true
    },
    roomType: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: ['AC', 'Non-AC'],
        message: 'Room type must be AC or Non-AC'
      }
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative']
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [10, 'Capacity cannot exceed 10']
    },
    amenities: {
      type: [String],
      default: []
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    images: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

roomSchema.index({ roomType: 1, isAvailable: 1 });

export default mongoose.model<IRoom>('Room', roomSchema);