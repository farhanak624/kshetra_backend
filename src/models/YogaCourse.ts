import mongoose, { Document, Schema } from 'mongoose';

export interface IYogaCourse extends Document {
  courseName: string;
  level: number;
  type: 'certification' | 'session' | 'cleansing';
  courseFeeUSD: number;
  courseFeePractitionerUSD?: number;
  examinationFeeUSD: number;
  courseFeeINR: number;
  coursFeePractitionerINR?: number;
  examinationFeeINR: number;
  minimumAttendanceDays?: string;
  description?: string;
  courseImage?: string; // URL to course thumbnail image
  sessionTimes?: string[];
  isActive: boolean;
  category: 'YCB' | 'Regular' | 'Therapy' | 'Cleansing';
  duration?: string;
  prerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const yogaCourseSchema = new Schema<IYogaCourse>(
  {
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [200, 'Course name cannot be more than 200 characters']
    },
    level: {
      type: Number,
      required: [true, 'Level is required'],
      min: [1, 'Level must be at least 1'],
      max: [7, 'Level cannot exceed 7']
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['certification', 'session', 'cleansing'],
        message: 'Type must be certification, session, or cleansing'
      }
    },
    courseFeeUSD: {
      type: Number,
      required: [true, 'Course fee in USD is required'],
      min: [0, 'Course fee cannot be negative']
    },
    courseFeePractitionerUSD: {
      type: Number,
      min: [0, 'Practitioner course fee cannot be negative']
    },
    examinationFeeUSD: {
      type: Number,
      required: [true, 'Examination fee in USD is required'],
      min: [0, 'Examination fee cannot be negative']
    },
    courseFeeINR: {
      type: Number,
      required: [true, 'Course fee in INR is required'],
      min: [0, 'Course fee cannot be negative']
    },
    coursFeePractitionerINR: {
      type: Number,
      min: [0, 'Practitioner course fee cannot be negative']
    },
    examinationFeeINR: {
      type: Number,
      required: [true, 'Examination fee in INR is required'],
      min: [0, 'Examination fee cannot be negative']
    },
    minimumAttendanceDays: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    courseImage: {
      type: String,
      trim: true,
      default: null
    },
    sessionTimes: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['YCB', 'Regular', 'Therapy', 'Cleansing'],
        message: 'Category must be YCB, Regular, Therapy, or Cleansing'
      }
    },
    duration: {
      type: String,
      trim: true
    },
    prerequisites: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

yogaCourseSchema.index({ category: 1, isActive: 1, level: 1 });
yogaCourseSchema.index({ type: 1, isActive: 1 });

export default mongoose.model<IYogaCourse>('YogaCourse', yogaCourseSchema);