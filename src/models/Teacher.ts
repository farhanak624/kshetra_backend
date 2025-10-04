import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  bio: string;
  specializations: string[];
  experience: number;
  certifications: string[];
  email: string;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    bio: {
      type: String,
      required: [true, 'Teacher bio is required'],
      trim: true,
      maxlength: [1000, 'Bio cannot be more than 1000 characters']
    },
    specializations: {
      type: [String],
      required: [true, 'At least one specialization is required'],
      validate: {
        validator: function(specializations: string[]) {
          return specializations.length > 0;
        },
        message: 'At least one specialization is required'
      }
    },
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years']
    },
    certifications: {
      type: [String],
      default: []
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
    },
    profileImage: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    socialMedia: {
      instagram: {
        type: String,
        trim: true
      },
      facebook: {
        type: String,
        trim: true
      },
      website: {
        type: String,
        trim: true
      }
    }
  },
  {
    timestamps: true
  }
);

teacherSchema.index({ email: 1 }, { unique: true });
teacherSchema.index({ isActive: 1, specializations: 1 });

export default mongoose.model<ITeacher>('Teacher', teacherSchema);