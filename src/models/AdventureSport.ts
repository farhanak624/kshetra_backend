import mongoose, { Document, Schema } from 'mongoose';

export interface IAdventureSport extends Document {
  name: string;
  category: 'adventure' | 'surfing' | 'diving' | 'trekking';
  price: number;
  priceUnit: 'per_session' | 'per_person' | 'per_day' | 'per_trip';
  description: string;
  detailedDescription?: string;
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  location?: string;
  features: string[];
  includedItems?: string[];
  requirements?: string[];
  images?: string[];
  ageRestriction?: {
    minAge?: number;
    maxAge?: number;
  };
  instructor?: {
    name: string;
    experience: string;
    certifications: string[];
  };
  safety?: string[];
  whatToBring?: string[];
  cancellationPolicy?: string;
  maxQuantity?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adventureSportSchema = new Schema<IAdventureSport>(
  {
    name: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['adventure', 'surfing', 'diving', 'trekking'],
      required: [true, 'Category is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    priceUnit: {
      type: String,
      enum: ['per_session', 'per_person', 'per_day', 'per_trip'],
      required: [true, 'Price unit is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    detailedDescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Detailed description cannot exceed 2000 characters']
    },
    duration: {
      type: String,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    location: {
      type: String,
      trim: true
    },
    features: [{
      type: String,
      trim: true
    }],
    includedItems: [{
      type: String,
      trim: true
    }],
    requirements: [{
      type: String,
      trim: true
    }],
    images: [{
      type: String,
      trim: true
    }],
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
    instructor: {
      name: {
        type: String,
        trim: true
      },
      experience: {
        type: String,
        trim: true
      },
      certifications: [{
        type: String,
        trim: true
      }]
    },
    safety: [{
      type: String,
      trim: true
    }],
    whatToBring: [{
      type: String,
      trim: true
    }],
    cancellationPolicy: {
      type: String,
      trim: true
    },
    maxQuantity: {
      type: Number,
      min: [1, 'Maximum quantity must be at least 1'],
      default: 10
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
adventureSportSchema.index({ category: 1, isActive: 1 });
adventureSportSchema.index({ name: 'text', description: 'text' });
adventureSportSchema.index({ price: 1 });
adventureSportSchema.index({ difficulty: 1 });

export default mongoose.model<IAdventureSport>('AdventureSport', adventureSportSchema);