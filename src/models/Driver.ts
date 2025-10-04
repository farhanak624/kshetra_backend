import mongoose, { Document, Schema } from 'mongoose';

export interface IDriver extends Document {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseType: 'light_vehicle' | 'heavy_vehicle' | 'commercial' | 'international';
  licenseExpiryDate: Date;
  licenseImage?: string; // URL to license image
  profilePhoto?: string; // URL to profile photo
  agencyId: mongoose.Types.ObjectId;
  isAvailable: boolean;
  experience: number; // years of experience
  languages: string[];
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'License number cannot be more than 20 characters']
    },
    licenseType: {
      type: String,
      required: [true, 'License type is required'],
      enum: {
        values: ['light_vehicle', 'heavy_vehicle', 'commercial', 'international'],
        message: 'Invalid license type'
      }
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
      validate: {
        validator: function(date: Date) {
          return date > new Date();
        },
        message: 'License expiry date must be in the future'
      }
    },
    licenseImage: {
      type: String,
      trim: true,
      default: null
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: null
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
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot be more than 50 years']
    },
    languages: {
      type: [String],
      default: ['English'],
      validate: {
        validator: function(languages: string[]) {
          return languages.length > 0 && languages.every(lang => typeof lang === 'string' && lang.length <= 30);
        },
        message: 'At least one language is required, each with maximum 30 characters'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot be more than 200 characters']
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required'],
        trim: true,
        maxlength: [100, 'Emergency contact name cannot be more than 100 characters']
      },
      phone: {
        type: String,
        required: [true, 'Emergency contact phone is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid emergency contact phone number']
      },
      relationship: {
        type: String,
        required: [true, 'Emergency contact relationship is required'],
        trim: true,
        maxlength: [50, 'Relationship cannot be more than 50 characters']
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
driverSchema.index({ agencyId: 1, isAvailable: 1 });
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ phone: 1 });
driverSchema.index({ licenseExpiryDate: 1 });

// Virtual to check if license is about to expire (within 30 days)
driverSchema.virtual('isLicenseExpiringSoon').get(function(this: IDriver) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.licenseExpiryDate <= thirtyDaysFromNow;
});

// Virtual to check if license is expired
driverSchema.virtual('isLicenseExpired').get(function(this: IDriver) {
  return this.licenseExpiryDate <= new Date();
});

export default mongoose.model<IDriver>('Driver', driverSchema);