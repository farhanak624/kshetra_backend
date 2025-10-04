import mongoose, { Document, Schema } from 'mongoose';

export interface ITransportAssignment extends Document {
  bookingId: mongoose.Types.ObjectId;
  agencyId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  assignedDate: Date;
  pickupTime?: Date;
  dropTime?: Date;
  status: 'assigned' | 'in_progress' | 'pickup_completed' | 'drop_completed' | 'completed' | 'cancelled';
  notes?: string;
  customerNotified: boolean;
  agencyNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transportAssignmentSchema = new Schema<ITransportAssignment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true // Each booking can have only one transport assignment
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency ID is required']
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required']
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver ID is required']
    },
    assignedDate: {
      type: Date,
      required: [true, 'Assigned date is required'],
      default: Date.now
    },
    pickupTime: {
      type: Date,
      validate: {
        validator: function(this: ITransportAssignment, pickupTime?: Date) {
          if (!pickupTime) return true;
          return pickupTime >= new Date();
        },
        message: 'Pickup time cannot be in the past'
      }
    },
    dropTime: {
      type: Date,
      validate: {
        validator: function(this: ITransportAssignment, dropTime?: Date) {
          if (!dropTime || !this.pickupTime) return true;
          return dropTime > this.pickupTime;
        },
        message: 'Drop time must be after pickup time'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['assigned', 'in_progress', 'pickup_completed', 'drop_completed', 'completed', 'cancelled'],
        message: 'Invalid assignment status'
      },
      default: 'assigned'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters']
    },
    customerNotified: {
      type: Boolean,
      default: false
    },
    agencyNotified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
transportAssignmentSchema.index({ bookingId: 1 });
transportAssignmentSchema.index({ agencyId: 1, status: 1 });
transportAssignmentSchema.index({ vehicleId: 1 });
transportAssignmentSchema.index({ driverId: 1 });
transportAssignmentSchema.index({ assignedDate: -1 });
transportAssignmentSchema.index({ status: 1 });

// Virtual to check if assignment is active
transportAssignmentSchema.virtual('isActive').get(function(this: ITransportAssignment) {
  return ['assigned', 'in_progress', 'pickup_completed', 'drop_completed'].includes(this.status);
});

// Virtual to check if assignment needs pickup
transportAssignmentSchema.virtual('needsPickup').get(function(this: ITransportAssignment) {
  return this.status === 'assigned' && this.pickupTime && this.pickupTime <= new Date();
});

// Virtual to check if assignment needs drop
transportAssignmentSchema.virtual('needsDrop').get(function(this: ITransportAssignment) {
  return this.status === 'pickup_completed' && this.dropTime && this.dropTime <= new Date();
});

export default mongoose.model<ITransportAssignment>('TransportAssignment', transportAssignmentSchema);