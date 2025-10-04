import { Booking } from '../models';

export interface DateOverlapCheck {
  hasOverlap: boolean;
  conflictingBookings?: any[];
}

export class BookingValidator {
  
  async checkDateOverlap(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<DateOverlapCheck> {
    try {
      const query: any = {
        roomId,
        status: { $in: ['pending', 'confirmed', 'checked_in'] }, // Only active bookings
        $or: [
          {
            // New booking starts before existing booking ends
            // AND new booking ends after existing booking starts
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn }
          }
        ]
      };

      // Exclude current booking if updating
      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }

      const conflictingBookings = await Booking.find(query)
        .populate('userId', 'name email')
        .populate('roomId', 'roomNumber roomType');

      return {
        hasOverlap: conflictingBookings.length > 0,
        conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined
      };
    } catch (error) {
      throw new Error('Failed to check date overlap');
    }
  }

  validateBookingDates(checkIn: Date, checkOut: Date): { valid: boolean; message?: string } {
    const now = new Date();
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Reset time to start of day for comparison
    now.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    // Check if check-in is in the past
    if (checkInDate < now) {
      return {
        valid: false,
        message: 'Check-in date cannot be in the past'
      };
    }

    // Check if check-out is after check-in
    if (checkOutDate <= checkInDate) {
      return {
        valid: false,
        message: 'Check-out date must be after check-in date'
      };
    }

    // Check if booking is not too far in advance (1 year max)
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setFullYear(maxAdvanceDate.getFullYear() + 1);
    if (checkInDate > maxAdvanceDate) {
      return {
        valid: false,
        message: 'Cannot book more than 1 year in advance'
      };
    }

    return { valid: true };
  }

  validateGuests(guests: any[], roomCapacity: number): { valid: boolean; message?: string } {
    if (!guests || guests.length === 0) {
      return {
        valid: false,
        message: 'At least one guest is required'
      };
    }

    if (guests.length > roomCapacity) {
      return {
        valid: false,
        message: `Room capacity is ${roomCapacity}. Cannot accommodate ${guests.length} guests.`
      };
    }

    const adults = guests.filter(guest => guest.age >= 18).length;
    if (adults === 0) {
      return {
        valid: false,
        message: 'At least one adult (18+) is required'
      };
    }

    // Validate each guest
    for (const guest of guests) {
      if (!guest.name || guest.name.trim().length === 0) {
        return {
          valid: false,
          message: 'All guests must have a name'
        };
      }

      if (!guest.age || guest.age < 0 || guest.age > 120) {
        return {
          valid: false,
          message: 'All guests must have a valid age (0-120)'
        };
      }
    }

    return { valid: true };
  }

  async validateYogaSessionAvailability(
    yogaSessionId: string,
    seatsRequired: number = 1
  ): Promise<{ valid: boolean; message?: string; availableSeats?: number }> {
    try {
      const YogaSession = (await import('../models')).YogaSession;
      const yogaSession = await YogaSession.findById(yogaSessionId);

      if (!yogaSession) {
        return {
          valid: false,
          message: 'Yoga session not found'
        };
      }

      if (!yogaSession.isActive) {
        return {
          valid: false,
          message: 'Yoga session is not active'
        };
      }

      const availableSeats = yogaSession.capacity - yogaSession.bookedSeats;
      if (availableSeats < seatsRequired) {
        return {
          valid: false,
          message: `Only ${availableSeats} seats available in yoga session. Required: ${seatsRequired}`,
          availableSeats
        };
      }

      // Check if session has already started
      const now = new Date();
      if (yogaSession.startDate < now) {
        return {
          valid: false,
          message: 'Yoga session has already started'
        };
      }

      return {
        valid: true,
        availableSeats
      };
    } catch (error) {
      throw new Error('Failed to validate yoga session availability');
    }
  }

  async validateRoomAvailability(roomId: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const Room = (await import('../models')).Room;
      const room = await Room.findById(roomId);

      if (!room) {
        return {
          valid: false,
          message: 'Room not found'
        };
      }

      if (!room.isAvailable) {
        return {
          valid: false,
          message: 'Room is not available'
        };
      }

      return { valid: true };
    } catch (error) {
      throw new Error('Failed to validate room availability');
    }
  }
}

export const bookingValidator = new BookingValidator();