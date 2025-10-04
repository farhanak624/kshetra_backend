import mongoose, { Document, Schema } from 'mongoose';

export interface IGuestInfo {
  name: string;
  age: number;
  isChild: boolean;
  gender?: 'Male' | 'Female' | 'Other';
  idType?: 'Aadhar' | 'Passport' | 'Driving License' | 'PAN Card';
  idNumber?: string;
  email?: string;
  phone?: string;
}

export interface IPrimaryGuestInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface ITransportInfo {
  pickup: boolean;
  drop: boolean;
  flightNumber?: string;
  eta?: Date;
  pickupTime?: Date;
  airportFrom?: string;
  airportTo?: string;
  pickupTerminal?: 'T1' | 'T2' | 'T3';
  dropTerminal?: 'T1' | 'T2' | 'T3';
  flightArrivalTime?: Date;
  flightDepartureTime?: Date;
  arrivalTime?: string;
  departureTime?: string;
  pickupFlightNumber?: string;
  dropFlightNumber?: string;
  specialInstructions?: string;
}

export interface ISelectedService {
  serviceId: mongoose.Types.ObjectId;
  quantity: number;
  totalPrice: number;
  details?: any;
}

export interface IBooking extends Document {
  userId?: mongoose.Types.ObjectId; // Made optional for public bookings
  roomId?: mongoose.Types.ObjectId; // Made optional for yoga bookings
  checkIn: Date;
  checkOut: Date;
  guests: IGuestInfo[];
  totalGuests: number;
  adults: number;
  children: number;

  // Primary Guest Information
  primaryGuestInfo?: IPrimaryGuestInfo;
  guestEmail?: string; // For public bookings without user accounts

  // Services
  includeFood: boolean;
  includeBreakfast: boolean;
  transport?: ITransportInfo;
  selectedServices: ISelectedService[];
  yogaSessionId?: mongoose.Types.ObjectId | string; // Can be ObjectId for scheduled sessions or string for daily sessions

  // Pricing
  roomPrice: number;
  foodPrice: number;
  breakfastPrice: number;
  servicesPrice: number;
  transportPrice: number;
  yogaPrice: number;
  totalAmount: number;

  // Coupon Information
  couponCode?: string;
  couponDiscount?: number;
  finalAmount?: number;

  // Status
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;

  // Special requests
  specialRequests?: string;
  notes?: string;

  // Booking type
  bookingType?: 'room' | 'yoga';

  createdAt: Date;
  updatedAt: Date;
}

const guestInfoSchema = new Schema<IGuestInfo>({
  name: {
    type: String,
    required: [true, 'Guest name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Guest age is required'],
    min: [0, 'Age cannot be negative'],
    max: [120, 'Age cannot be more than 120']
  },
  isChild: {
    type: Boolean,
    default: function(this: IGuestInfo) {
      return this.age < 5;
    }
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  idType: {
    type: String,
    enum: ['Aadhar', 'Passport', 'Driving License', 'PAN Card']
  },
  idNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  }
});

const primaryGuestInfoSchema = new Schema<IPrimaryGuestInfo>({
  name: {
    type: String,
    required: [true, 'Primary guest name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Primary guest email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Primary guest phone is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'PIN code is required'],
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  }
});

const transportInfoSchema = new Schema<ITransportInfo>({
  pickup: {
    type: Boolean,
    default: false
  },
  drop: {
    type: Boolean,
    default: false
  },
  flightNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  eta: {
    type: Date
  },
  pickupTime: {
    type: Date
  },
  airportFrom: {
    type: String,
    enum: ['Kochi', 'Trivandrum'],
    trim: true
  },
  airportTo: {
    type: String,
    enum: ['Kochi', 'Trivandrum'],
    trim: true
  },
  pickupTerminal: {
    type: String,
    enum: ['T1', 'T2', 'T3'],
    trim: true
  },
  dropTerminal: {
    type: String,
    enum: ['T1', 'T2', 'T3'],
    trim: true
  },
  flightArrivalTime: {
    type: Date
  },
  flightDepartureTime: {
    type: Date
  },
  arrivalTime: {
    type: String,
    trim: true
  },
  departureTime: {
    type: String,
    trim: true
  },
  pickupFlightNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  dropFlightNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [300, 'Special instructions cannot be more than 300 characters']
  }
});

const selectedServiceSchema = new Schema<ISelectedService>({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  details: {
    type: Schema.Types.Mixed
  }
});

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false // Made optional for public bookings
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: function(this: IBooking) {
        return !this.userId; // Required for public bookings (when no userId)
      }
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: function(this: IBooking) {
        return this.bookingType !== 'yoga'; // Only required for non-yoga bookings
      }
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required']
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required']
    },
    guests: {
      type: [guestInfoSchema],
      required: [true, 'At least one guest is required'],
      validate: {
        validator: function(guests: IGuestInfo[]) {
          return guests.length > 0;
        },
        message: 'At least one guest is required'
      }
    },
    totalGuests: {
      type: Number,
      required: true,
      min: [1, 'Total guests must be at least 1']
    },
    adults: {
      type: Number,
      required: true,
      min: [1, 'At least one adult is required']
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children count cannot be negative']
    },

    // Primary Guest Information
    primaryGuestInfo: primaryGuestInfoSchema,

    // Services
    includeFood: {
      type: Boolean,
      default: true
    },
    includeBreakfast: {
      type: Boolean,
      default: false
    },
    transport: transportInfoSchema,
    selectedServices: {
      type: [selectedServiceSchema],
      default: []
    },
    yogaSessionId: {
      type: Schema.Types.Mixed, // Can be ObjectId for scheduled sessions or string for daily sessions
      validate: {
        validator: function(value: any) {
          if (!value) return true; // Optional field
          // Allow ObjectId for scheduled sessions
          if (mongoose.isValidObjectId(value)) return true;
          // Allow strings for daily sessions
          if (typeof value === 'string' && value.length > 0) return true;
          return false;
        },
        message: 'yogaSessionId must be a valid ObjectId or non-empty string'
      }
    },
    
    // Pricing
    roomPrice: {
      type: Number,
      required: true,
      min: [0, 'Room price cannot be negative']
    },
    foodPrice: {
      type: Number,
      default: 0,
      min: [0, 'Food price cannot be negative']
    },
    breakfastPrice: {
      type: Number,
      default: 0,
      min: [0, 'Breakfast price cannot be negative']
    },
    servicesPrice: {
      type: Number,
      default: 0,
      min: [0, 'Services price cannot be negative']
    },
    transportPrice: {
      type: Number,
      default: 0,
      min: [0, 'Transport price cannot be negative']
    },
    yogaPrice: {
      type: Number,
      default: 0,
      min: [0, 'Yoga price cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },

    // Coupon Information
    couponCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    couponDiscount: {
      type: Number,
      min: [0, 'Coupon discount cannot be negative'],
      default: 0
    },
    finalAmount: {
      type: Number,
      min: [0, 'Final amount cannot be negative'],
      validate: {
        validator: function(this: IBooking, value?: number) {
          if (value !== undefined) {
            return value <= this.totalAmount;
          }
          return true;
        },
        message: 'Final amount cannot be greater than total amount'
      }
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'],
        message: 'Invalid booking status'
      },
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: 'Invalid payment status'
      },
      default: 'pending'
    },
    paymentId: {
      type: String,
      trim: true
    },
    
    // Special requests
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [500, 'Special requests cannot be more than 500 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot be more than 1000 characters']
    },

    // Booking type
    bookingType: {
      type: String,
      enum: ['room', 'yoga'],
      default: 'room'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for number of nights
bookingSchema.virtual('nights').get(function(this: IBooking) {
  const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  if (this.checkOut <= this.checkIn) {
    const error = new Error('Check-out date must be after check-in date');
    return next(error);
  }
  
  // Calculate guests count
  this.totalGuests = this.guests.length;
  this.adults = this.guests.filter(guest => !guest.isChild).length;
  this.children = this.guests.filter(guest => guest.isChild).length;
  
  if (this.adults === 0) {
    const error = new Error('At least one adult is required');
    return next(error);
  }
  
  next();
});

export default mongoose.model<IBooking>('Booking', bookingSchema);