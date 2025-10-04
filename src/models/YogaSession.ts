import mongoose, { Document, Schema } from 'mongoose';

export interface IYogaSession extends Document {
  type: '200hr' | '300hr';
  batchName: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  bookedSeats: number;
  price: number;
  instructor: mongoose.Types.ObjectId;
  schedule: {
    days: string[];
    time: string;
  };
  isActive: boolean;
  description?: string;
  prerequisites: string[];
  createdAt: Date;
  updatedAt: Date;
}

const yogaSessionSchema = new Schema<IYogaSession>(
  {
    type: {
      type: String,
      required: [true, 'Yoga session type is required'],
      enum: {
        values: ['200hr', '300hr'],
        message: 'Yoga session type must be 200hr or 300hr'
      }
    },
    batchName: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      maxlength: [100, 'Batch name cannot be more than 100 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      default: 15,
      min: [1, 'Capacity must be at least 1'],
      max: [50, 'Capacity cannot exceed 50']
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: [0, 'Booked seats cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Instructor is required']
    },
    schedule: {
      days: {
        type: [String],
        required: [true, 'Schedule days are required'],
        validate: {
          validator: function(days: string[]) {
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            return days.every(day => validDays.includes(day));
          },
          message: 'Invalid day in schedule'
        }
      },
      time: {
        type: String,
        required: [true, 'Schedule time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    prerequisites: {
      type: [String],
      default: ['Must have accommodation booking', 'Basic yoga experience recommended']
    }
  },
  {
    timestamps: true
  }
);

yogaSessionSchema.index({ type: 1, isActive: 1, startDate: 1 });

yogaSessionSchema.virtual('availableSeats').get(function(this: IYogaSession) {
  return this.capacity - this.bookedSeats;
});

yogaSessionSchema.pre('save', function(next) {
  if (this.bookedSeats > this.capacity) {
    const error = new Error('Booked seats cannot exceed capacity');
    return next(error);
  }
  if (this.endDate <= this.startDate) {
    const error = new Error('End date must be after start date');
    return next(error);
  }
  next();
});

export default mongoose.model<IYogaSession>('YogaSession', yogaSessionSchema);