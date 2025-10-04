import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking, Room, Service, YogaSession, User, Agency, Coupon, CouponUsage } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { pricingCalculator } from '../utils/pricing';
import { bookingValidator } from '../utils/bookingValidation';
import { emailService } from '../utils/email';

// Helper function to notify active agency about transport bookings
const notifyActiveAgencyAboutTransport = async (booking: any) => {
  try {
    // Check if booking has transport requirements
    if (!booking.transport || (!booking.transport.pickup && !booking.transport.drop)) {
      return;
    }

    // Find the active agency
    const activeAgency = await Agency.findOne({ isActive: true });
    if (!activeAgency) {
      console.log('No active agency found for transport notification');
      return;
    }

    // Send notification to agency
    await emailService.sendAgencyBookingNotification(booking, activeAgency);
    console.log(`Transport booking notification sent to agency: ${activeAgency.name}`);
  } catch (error) {
    console.error('Failed to notify agency about transport booking:', error);
    // Don't fail the booking if agency notification fails
  }
};

// Helper function to convert userId to ObjectId
const getUserObjectId = (userId: string | undefined): mongoose.Types.ObjectId => {
  if (userId === 'admin_id_123') {
    return new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
  }
  return new mongoose.Types.ObjectId(userId);
};

// Public booking creation (no auth required)
export const createPublicBooking = async (req: any, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      primaryGuestInfo,
      includeFood = true,
      includeBreakfast = false,
      transport,
      selectedServices = [],
      yogaSessionId,
      specialRequests,
      bookingType,
      couponCode
    } = req.body;

    // For public bookings, we don't have a userId, so we'll use the primary guest email as identifier
    const guestEmail = primaryGuestInfo.email;

    // Check if this is a yoga booking (special case)
    const isYogaBooking = bookingType === 'yoga' || yogaSessionId || roomId === '000000000000000000000000';

    let room = null;

    if (isYogaBooking) {
      console.log('🧘‍♀️ Processing yoga booking...');

      // For yoga bookings, validate yoga session instead of room
      if (yogaSessionId && mongoose.isValidObjectId(yogaSessionId)) {
        // Only validate if it's a real ObjectId (scheduled sessions)
        const yogaValidation = await bookingValidator.validateYogaSessionAvailability(yogaSessionId, 1);
        if (!yogaValidation.valid) {
          res.status(400).json({
            success: false,
            message: yogaValidation.message
          });
          await session.abortTransaction();
          return;
        }
      }
      // For daily sessions with string IDs, skip validation as they don't have capacity limits

      // Skip room validation for yoga bookings
      console.log('✅ Yoga session validation passed');
    } else {
      // Regular room booking validation
      console.log('🏨 Processing room booking...');

      // Validate dates
      const dateValidation = bookingValidator.validateBookingDates(new Date(checkIn), new Date(checkOut));
      if (!dateValidation.valid) {
        res.status(400).json({
          success: false,
          message: dateValidation.message
        });
        await session.abortTransaction();
        return;
      }

      // Validate room exists and is available
      room = await Room.findById(roomId).session(session);
      if (!room || !room.isAvailable) {
        res.status(400).json({
          success: false,
          message: 'Room not found or not available'
        });
        await session.abortTransaction();
        return;
      }

      // Validate guests
      const guestValidation = bookingValidator.validateGuests(guests, room.capacity);
      if (!guestValidation.valid) {
        res.status(400).json({
          success: false,
          message: guestValidation.message
        });
        await session.abortTransaction();
        return;
      }

      // Check for date overlap
      const overlapCheck = await bookingValidator.checkDateOverlap(
        roomId,
        new Date(checkIn),
        new Date(checkOut)
      );

      if (overlapCheck.hasOverlap) {
        res.status(400).json({
          success: false,
          message: 'Room is already booked for the selected dates',
          conflictingBookings: overlapCheck.conflictingBookings
        });
        await session.abortTransaction();
        return;
      }
    }

    // Calculate pricing
    let pricing;
    if (isYogaBooking) {
      // For yoga bookings, use simple pricing from totalAmount in request
      pricing = {
        totalAmount: req.body.totalAmount || 0,
        roomPrice: 0,
        foodPrice: 0,
        breakfastPrice: 0,
        servicesPrice: 0,
        transportPrice: 0,
        yogaPrice: req.body.totalAmount || 0
      };
    } else {
      // Regular room booking pricing
      if (!room) {
        throw new Error('Room is required for room bookings');
      }
      pricing = pricingCalculator.calculateBookingPrice(
        room.pricePerNight,
        new Date(checkIn),
        new Date(checkOut),
        guests,
        includeFood,
        includeBreakfast,
        0,
        [],
        0,
        0
      );
    }

    // Process coupon if provided
    let coupon = null;
    let couponDiscount = 0;
    let finalAmount = pricing.totalAmount;

    if (couponCode) {
      // Find and validate coupon
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() }).session(session);
      if (!coupon) {
        res.status(400).json({
          success: false,
          message: 'Invalid coupon code'
        });
        await session.abortTransaction();
        return;
      }

      // Determine service type for coupon validation
      let serviceType = 'airport'; // default
      if (isYogaBooking) {
        serviceType = 'yoga';
      } else if (transport?.pickup || transport?.drop) {
        serviceType = 'airport';
      }
      // Add logic for rental and adventure based on your booking structure

      // Validate coupon for service
      const validation = pricingCalculator.validateCouponForService(coupon, serviceType);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.message
        });
        await session.abortTransaction();
        return;
      }

      // Check if user has already used this coupon
      const phoneNumber = primaryGuestInfo.phone;
      const hasUsed = await CouponUsage.hasUserUsedCoupon(coupon._id, undefined, phoneNumber);
      if (hasUsed) {
        res.status(400).json({
          success: false,
          message: 'You have already used this coupon'
        });
        await session.abortTransaction();
        return;
      }

      // Calculate discount
      couponDiscount = pricingCalculator.calculateCouponDiscount(coupon, pricing.totalAmount);
      finalAmount = pricing.totalAmount - couponDiscount;

      // Update coupon usage count
      coupon.currentUsageCount += 1;
      await coupon.save({ session });
    }

    // Create booking for public user (no userId)
    const booking = new Booking({
      roomId: isYogaBooking ? null : roomId, // No room for yoga bookings
      userId: null, // No user account for public bookings
      guestEmail, // Store guest email for identification
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: guests.map((guest: any) => ({
        name: guest.name,
        age: parseInt(guest.age),
        isChild: parseInt(guest.age) < 5,
        gender: guest.gender,
        // Only include ID fields for room bookings, not yoga bookings
        ...(isYogaBooking ? {} : {
          idType: guest.idType,
          idNumber: guest.idNumber
        })
      })),
      primaryGuestInfo,
      totalGuests: guests.length,
      adults: guests.filter((g: any) => parseInt(g.age) >= 5).length,
      children: guests.filter((g: any) => parseInt(g.age) < 5).length,
      totalAmount: pricing.totalAmount,
      couponCode: couponCode || undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      finalAmount: couponDiscount > 0 ? finalAmount : undefined,
      roomPrice: pricing.roomPrice,
      foodPrice: pricing.foodPrice,
      breakfastPrice: pricing.breakfastPrice,
      servicesPrice: pricing.servicesPrice,
      transportPrice: pricing.transportPrice,
      yogaPrice: pricing.yogaPrice,
      includeFood,
      includeBreakfast,
      transport,
      specialRequests: specialRequests || '',
      status: 'pending',
      paymentStatus: 'pending',
      // Add yoga-specific fields
      yogaSessionId: yogaSessionId || null,
      bookingType: isYogaBooking ? 'yoga' : 'room'
    });

    await booking.save({ session });

    // Coupon usage will be tracked only after successful payment

    await session.commitTransaction();

    // Send email notification for public booking
    try {
      await emailService.sendBookingConfirmation(booking);
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the booking creation if email fails
    }

    // Notify agency about transport booking if applicable
    await notifyActiveAgencyAboutTransport(booking);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          _id: booking._id,
          roomId: booking.roomId,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          totalAmount: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        }
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Public booking creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  } finally {
    await session.endSession();
  }
};

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      primaryGuestInfo,
      includeFood = true,
      includeBreakfast = false,
      transport,
      selectedServices = [],
      yogaSessionId,
      specialRequests,
      couponCode
    } = req.body;

    const userId = req.user?.userId;
    const userObjectId = getUserObjectId(userId);

    // Validate dates
    const dateValidation = bookingValidator.validateBookingDates(new Date(checkIn), new Date(checkOut));
    if (!dateValidation.valid) {
      res.status(400).json({
        success: false,
        message: dateValidation.message
      });
      await session.abortTransaction();
      return;
    }

    // Validate room exists and is available
    const room = await Room.findById(roomId).session(session);
    if (!room || !room.isAvailable) {
      res.status(400).json({
        success: false,
        message: 'Room not found or not available'
      });
      await session.abortTransaction();
      return;
    }

    // Validate guests
    const guestValidation = bookingValidator.validateGuests(guests, room.capacity);
    if (!guestValidation.valid) {
      res.status(400).json({
        success: false,
        message: guestValidation.message
      });
      await session.abortTransaction();
      return;
    }

    // Check for date overlap
    const overlapCheck = await bookingValidator.checkDateOverlap(
      roomId,
      new Date(checkIn),
      new Date(checkOut)
    );

    if (overlapCheck.hasOverlap) {
      res.status(400).json({
        success: false,
        message: 'Room is already booked for the selected dates',
        conflictingBookings: overlapCheck.conflictingBookings
      });
      await session.abortTransaction();
      return;
    }

    // Validate and calculate service prices
    let calculatedServices = [];
    let servicesPrice = 0;

    if (selectedServices.length > 0) {
      for (const serviceSelection of selectedServices) {
        const service = await Service.findById(serviceSelection.serviceId).session(session);
        if (!service || !service.isActive) {
          res.status(400).json({
            success: false,
            message: `Service not found or not active: ${serviceSelection.serviceId}`
          });
          await session.abortTransaction();
          return;
        }

        // Validate age restrictions
        const ageValidation = pricingCalculator.validateServiceAge(service, guests);
        if (!ageValidation.valid) {
          res.status(400).json({
            success: false,
            message: ageValidation.message
          });
          await session.abortTransaction();
          return;
        }

        // Calculate service price
        const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24));
        const calculatedPrice = pricingCalculator.calculateServicePrice(
          service,
          serviceSelection.quantity,
          guests,
          nights
        );

        calculatedServices.push({
          serviceId: service._id as mongoose.Types.ObjectId,
          quantity: serviceSelection.quantity,
          totalPrice: calculatedPrice,
          details: serviceSelection.details
        });

        servicesPrice += calculatedPrice;
      }
    }

    // Validate yoga session if selected
    let yogaPrice = 0;
    if (yogaSessionId) {
      const yogaValidation = await bookingValidator.validateYogaSessionAvailability(
        yogaSessionId,
        guests.length
      );
      if (!yogaValidation.valid) {
        res.status(400).json({
          success: false,
          message: yogaValidation.message
        });
        await session.abortTransaction();
        return;
      }

      const yogaSession = await YogaSession.findById(yogaSessionId).session(session);
      yogaPrice = yogaSession!.price;
    }

    // Calculate transport price
    let transportPrice = 0;
    if (transport) {
      transportPrice = pricingCalculator.calculateTransportPrice(
        transport.pickup,
        transport.drop
      );
    }

    // Get breakfast price from service if selected
    let breakfastPrice = 0;
    if (includeBreakfast) {
      const breakfastService = await Service.findOne({ 
        category: 'food', 
        subcategory: 'breakfast',
        isActive: true 
      }).session(session);
      breakfastPrice = breakfastService?.price || 200; // fallback price
    }

    // Calculate total pricing
    const pricing = pricingCalculator.calculateBookingPrice(
      room.pricePerNight,
      new Date(checkIn),
      new Date(checkOut),
      guests,
      includeFood,
      includeBreakfast,
      breakfastPrice,
      calculatedServices,
      transportPrice,
      yogaPrice
    );

    // Process coupon if provided
    let coupon = null;
    let couponDiscount = 0;
    let finalAmount = pricing.totalAmount;

    if (couponCode) {
      // Find and validate coupon
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() }).session(session);
      if (!coupon) {
        res.status(400).json({
          success: false,
          message: 'Invalid coupon code'
        });
        await session.abortTransaction();
        return;
      }

      // Determine service type (for authenticated bookings, it's mostly room bookings)
      let serviceType = 'airport'; // default for room bookings with transport
      if (yogaSessionId) {
        serviceType = 'yoga';
      }

      // Validate coupon for service
      const validation = pricingCalculator.validateCouponForService(coupon, serviceType);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.message
        });
        await session.abortTransaction();
        return;
      }

      // Check if user has already used this coupon
      const hasUsed = await CouponUsage.hasUserUsedCoupon(coupon._id, userObjectId);
      if (hasUsed) {
        res.status(400).json({
          success: false,
          message: 'You have already used this coupon'
        });
        await session.abortTransaction();
        return;
      }

      // Calculate discount
      couponDiscount = pricingCalculator.calculateCouponDiscount(coupon, pricing.totalAmount);
      finalAmount = pricing.totalAmount - couponDiscount;

      // Update coupon usage count
      coupon.currentUsageCount += 1;
      await coupon.save({ session });
    }

    // Create booking
    const booking = new Booking({
      userId: userObjectId,
      roomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      primaryGuestInfo,
      totalGuests: guests.length,
      adults: guests.filter((g: any) => !g.isChild).length,
      children: guests.filter((g: any) => g.isChild).length,
      totalAmount: pricing.totalAmount,
      couponCode: couponCode || undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      finalAmount: couponDiscount > 0 ? finalAmount : undefined,
      roomPrice: pricing.roomPrice,
      foodPrice: pricing.foodPrice,
      breakfastPrice: pricing.breakfastPrice,
      servicesPrice: pricing.servicesPrice,
      transportPrice: pricing.transportPrice,
      yogaPrice: pricing.yogaPrice,
      includeFood,
      includeBreakfast,
      transport,
      selectedServices: calculatedServices,
      yogaSessionId: yogaSessionId || undefined,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await booking.save({ session });

    // Coupon usage will be tracked only after successful payment

    // Yoga session booked seats will be updated only after successful payment

    await session.commitTransaction();

    // Populate booking for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight')
      .populate('selectedServices.serviceId', 'name category price')
      .populate('yogaSessionId', 'type batchName startDate endDate');

    // Send booking confirmation email
    try {
      if (userId === 'admin_id_123') {
        // For admin bookings, use admin info
        const adminUser = {
          name: 'Admin User',
          email: 'admin@gmail.com'
        };
        await emailService.sendBookingConfirmation(populatedBooking, adminUser);
      } else {
        // For regular users, find user in database
        const user = await User.findById(userId);
        if (user) {
          await emailService.sendBookingConfirmation(populatedBooking, user);
        }
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the booking creation if email fails
    }

    // Notify agency about transport booking if applicable
    await notifyActiveAgencyAboutTransport(populatedBooking);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: populatedBooking
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  } finally {
    await session.endSession();
  }
};

export const getUserBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 10 } = req.query;
    const userObjectId = getUserObjectId(userId);

    const query: any = { userId: userObjectId };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const bookings = await Booking.find(query)
      .populate('roomId', 'roomNumber roomType pricePerNight amenities')
      .populate('selectedServices.serviceId', 'name category price')
      .populate('yogaSessionId', 'type batchName startDate endDate instructor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get bookings'
    });
  }
};

export const getBookingById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const query: any = { _id: id };
    
    // Non-admin users can only see their own bookings
    if (userRole !== 'admin') {
      query.userId = getUserObjectId(userId);
    }

    const booking = await Booking.findOne(query)
      .populate('userId', 'name email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight amenities description images')
      .populate('selectedServices.serviceId', 'name category price description')
      .populate('yogaSessionId', 'type batchName startDate endDate instructor schedule description');

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get booking'
    });
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const query: any = { _id: id };
    
    // Non-admin users can only cancel their own bookings
    if (userRole !== 'admin') {
      query.userId = getUserObjectId(userId);
    }

    const booking = await Booking.findOne(query).session(session);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      await session.abortTransaction();
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
      await session.abortTransaction();
      return;
    }

    if (booking.status === 'checked_in' || booking.status === 'checked_out') {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel booking after check-in'
      });
      await session.abortTransaction();
      return;
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save({ session });

    // Release yoga session seats if applicable
    if (booking.yogaSessionId) {
      await YogaSession.findByIdAndUpdate(
        booking.yogaSessionId,
        { $inc: { bookedSeats: -booking.guests.length } },
        { session }
      );
    }

    await session.commitTransaction();

    // Send cancellation email
    try {
      if (booking.userId) {
        if (booking.userId.toString() === '507f1f77bcf86cd799439011') {
          // Admin booking
          const adminUser = {
            name: 'Admin User',
            email: 'admin@gmail.com'
          };
          await emailService.sendBookingCancellation(booking, adminUser);
        } else {
          // Regular user booking
          const user = await User.findById(booking.userId);
          if (user) {
            await emailService.sendBookingCancellation(booking, user);
          }
        }
      } else if (booking.guestEmail) {
        // Public booking
        const guestUser = {
          name: booking.primaryGuestInfo?.name || 'Guest',
          email: booking.guestEmail
        };
        await emailService.sendBookingCancellation(booking, guestUser);
      }
    } catch (emailError) {
      console.error('Failed to send booking cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking'
    });
  } finally {
    await session.endSession();
  }
};

// Public booking details (no auth required - can fetch any booking by ID)
export const getPublicBookingById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find booking by ID and populate all related fields for complete details
    const booking = await Booking.findById(id)
      .populate('userId', 'name email phone')
      .populate('roomId', 'roomNumber roomType description pricePerNight amenities images')
      .populate('selectedServices.serviceId', 'name category price description')
      .populate('yogaSessionId', 'type batchName startDate endDate instructor schedule description location specialization');

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get booking details'
    });
  }
};