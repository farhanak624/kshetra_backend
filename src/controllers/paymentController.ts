import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking, Payment, User, Coupon, CouponUsage, YogaSession, Service } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { razorpayService } from '../utils/razorpay';

export const createPaymentOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user?.userId;

    // Validate required fields
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
      return;
    }

    // Find and validate booking
    const booking = await Booking.findOne({
      _id: bookingId,
      userId,
      status: 'pending',
      paymentStatus: 'pending'
    }).populate('userId', 'name email phone');

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for payment'
      });
      return;
    }

    // Validate that amount doesn't exceed original booking amount
    if (amount > booking.totalAmount) {
      res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed booking total'
      });
      return;
    }

    // Check if payment order already exists
    const existingPayment = await Payment.findOne({
      bookingId,
      status: { $in: ['created', 'attempted'] }
    });

    if (existingPayment) {
      res.json({
        success: true,
        message: 'Payment order already exists',
        data: {
          orderId: existingPayment.razorpayOrderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          bookingId: booking._id,
          customerInfo: {
            name: (booking.userId as any).name,
            email: (booking.userId as any).email,
            phone: (booking.userId as any).phone
          }
        }
      });
      return;
    }

    // Create Razorpay order
    const customerInfo = {
      name: (booking.userId as any).name,
      email: (booking.userId as any).email,
      phone: (booking.userId as any).phone
    };

    const orderResult = await razorpayService.createOrder(
      amount,
      (booking._id as any).toString(),
      customerInfo
    );

    if (!orderResult.success) {
      res.status(500).json({
        success: false,
        message: orderResult.message
      });
      return;
    }

    // Save payment record
    const payment = new Payment({
      bookingId: booking._id,
      razorpayOrderId: orderResult.data!.orderId,
      amount: amount,
      currency: 'INR',
      status: 'created'
    });

    await payment.save();

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.data!.orderId,
        amount: orderResult.data!.amount,
        currency: orderResult.data!.currency,
        bookingId: booking._id,
        customerInfo
      }
    });

  } catch (error: any) {
    console.error('Payment order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const userId = req.user?.userId;

    // Verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
      await session.abortTransaction();
      return;
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id
    }).session(session);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
      await session.abortTransaction();
      return;
    }

    // Find and validate booking
    const booking = await Booking.findOne({
      _id: payment.bookingId,
      userId
    }).session(session);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      await session.abortTransaction();
      return;
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);

    if (!paymentDetails.success) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment with Razorpay'
      });
      await session.abortTransaction();
      return;
    }

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = paymentDetails.data?.status === 'captured' ? 'paid' : 'failed';
    payment.paymentMethod = paymentDetails.data?.method;

    if (paymentDetails.data?.status !== 'captured') {
      payment.failureReason = paymentDetails.data?.error_description || 'Payment not captured';
    }

    await payment.save({ session });

    // Update booking status
    if (payment.status === 'paid') {
      booking.paymentStatus = 'paid';
      booking.paymentId = razorpay_payment_id;
      booking.status = 'confirmed';
      await booking.save({ session });

      // Create coupon usage record if coupon was used
      if (booking.couponCode && booking.couponDiscount && booking.couponDiscount > 0) {
        try {
          const coupon = await Coupon.findOne({ code: booking.couponCode.toUpperCase() });
          if (coupon) {
            const couponUsage = new CouponUsage({
              couponId: coupon._id,
              userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
              phoneNumber: (booking.userId as any)?.phone || booking.primaryGuestInfo?.phone,
              email: (booking.userId as any)?.email || booking.primaryGuestInfo?.email,
              bookingId: booking._id,
              discountAmount: booking.couponDiscount,
              orderValue: booking.totalAmount,
              serviceType: booking.yogaSessionId ? 'yoga' : 'airport'
            });
            await couponUsage.save({ session });
          }
        } catch (couponError) {
          console.error('Error creating coupon usage record:', couponError);
          // Don't fail the payment if coupon usage tracking fails
        }
      }

      // Update yoga session booked seats if applicable
      if (booking.yogaSessionId) {
        try {
          await YogaSession.findByIdAndUpdate(
            booking.yogaSessionId,
            { $inc: { bookedSeats: booking.guests.length } },
            { session }
          );
        } catch (yogaError) {
          console.error('Error updating yoga session booked seats:', yogaError);
          // Don't fail the payment if booking count update fails
        }
      }

      // Update service available slots if applicable
      if (booking.selectedServices && booking.selectedServices.length > 0) {
        try {
          for (const selectedService of booking.selectedServices) {
            await Service.findByIdAndUpdate(
              selectedService.serviceId,
              { $inc: { availableSlots: -selectedService.quantity } },
              { session }
            );
          }
        } catch (serviceError) {
          console.error('Error updating service available slots:', serviceError);
          // Don't fail the payment if service availability update fails
        }
      }
    } else {
      booking.paymentStatus = 'failed';
      await booking.save({ session });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: payment.status === 'paid' ? 'Payment successful' : 'Payment failed',
      data: {
        paymentStatus: payment.status,
        bookingStatus: booking.status,
        paymentId: razorpay_payment_id,
        bookingId: booking._id
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  } finally {
    await session.endSession();
  }
};

export const getPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.userId;

    // Validate booking belongs to user
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    // Find payment record
    const payment = await Payment.findOne({ bookingId }).sort({ createdAt: -1 });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        bookingStatus: booking.status
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment status'
    });
  }
};

export const refundPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;
    const { refundAmount, reason } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Find booking
    const query: any = { _id: bookingId };
    if (userRole !== 'admin') {
      query.userId = userId;
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

    if (booking.paymentStatus !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Booking payment is not in paid status'
      });
      await session.abortTransaction();
      return;
    }

    // Find payment record
    const payment = await Payment.findOne({
      bookingId,
      status: 'paid'
    }).session(session);

    if (!payment || !payment.razorpayPaymentId) {
      res.status(404).json({
        success: false,
        message: 'Valid payment record not found'
      });
      await session.abortTransaction();
      return;
    }

    // Process refund
    const refundResult = await razorpayService.refundPayment(
      payment.razorpayPaymentId,
      refundAmount,
      reason
    );

    if (!refundResult.success) {
      res.status(500).json({
        success: false,
        message: refundResult.message
      });
      await session.abortTransaction();
      return;
    }

    // Update payment record
    payment.status = refundAmount && refundAmount < payment.amount ? 'partial_refund' : 'refunded';
    payment.refundAmount = refundAmount || payment.amount;
    payment.refundId = refundResult.data?.id;
    await payment.save({ session });

    // Update booking status
    booking.paymentStatus = 'refunded';
    booking.status = 'cancelled';
    await booking.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundResult.data?.id,
        refundAmount: payment.refundAmount,
        status: payment.status
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  } finally {
    await session.endSession();
  }
};

// Public payment endpoints (no authentication required)
export const createPublicPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, amount } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
      return;
    }

    // Find and validate public booking
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: null, // Public bookings have null userId
      status: 'pending',
      paymentStatus: 'pending'
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for payment'
      });
      return;
    }

    // Validate that amount doesn't exceed original booking amount
    if (amount > booking.totalAmount) {
      res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed booking total'
      });
      return;
    }

    // Check if payment order already exists
    const existingPayment = await Payment.findOne({
      bookingId,
      status: { $in: ['created', 'attempted'] }
    });

    if (existingPayment) {
      res.json({
        success: true,
        message: 'Payment order already exists',
        data: {
          id: existingPayment.razorpayOrderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          bookingId: booking._id
        }
      });
      return;
    }

    // Create Razorpay order
    const customerInfo = {
      name: booking.primaryGuestInfo?.name || 'Guest',
      email: booking.guestEmail || booking.primaryGuestInfo?.email || '',
      phone: booking.primaryGuestInfo?.phone || ''
    };

    const orderResult = await razorpayService.createOrder(
      amount,
      (booking._id as any).toString(),
      customerInfo
    );

    if (!orderResult.success) {
      res.status(500).json({
        success: false,
        message: orderResult.message
      });
      return;
    }

    // Save payment record
    const payment = new Payment({
      bookingId: booking._id,
      razorpayOrderId: orderResult.data!.orderId,
      amount: amount,
      currency: 'INR',
      status: 'created'
    });

    await payment.save();

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        id: orderResult.data!.orderId,
        amount: orderResult.data!.amount,
        currency: orderResult.data!.currency,
        bookingId: booking._id
      }
    });

  } catch (error: any) {
    console.error('Public payment order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

export const verifyPublicPayment = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    // Verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
      await session.abortTransaction();
      return;
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id
    }).session(session);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
      await session.abortTransaction();
      return;
    }

    // Find and validate public booking
    const booking = await Booking.findOne({
      _id: payment.bookingId,
      userId: null // Public booking
    }).session(session);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      await session.abortTransaction();
      return;
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);

    if (!paymentDetails.success) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment with Razorpay'
      });
      await session.abortTransaction();
      return;
    }

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = paymentDetails.data?.status === 'captured' ? 'paid' : 'failed';
    payment.paymentMethod = paymentDetails.data?.method;

    if (paymentDetails.data?.status !== 'captured') {
      payment.failureReason = paymentDetails.data?.error_description || 'Payment not captured';
    }

    await payment.save({ session });

    // Update booking status
    if (payment.status === 'paid') {
      booking.paymentStatus = 'paid';
      booking.paymentId = razorpay_payment_id;
      booking.status = 'confirmed';
      await booking.save({ session });

      // Create coupon usage record if coupon was used
      if (booking.couponCode && booking.couponDiscount && booking.couponDiscount > 0) {
        try {
          const coupon = await Coupon.findOne({ code: booking.couponCode.toUpperCase() });
          if (coupon) {
            const couponUsage = new CouponUsage({
              couponId: coupon._id,
              phoneNumber: booking.primaryGuestInfo?.phone || booking.guestEmail,
              email: booking.primaryGuestInfo?.email || booking.guestEmail,
              bookingId: booking._id,
              discountAmount: booking.couponDiscount,
              orderValue: booking.totalAmount,
              serviceType: booking.yogaSessionId ? 'yoga' : 'airport'
            });
            await couponUsage.save({ session });
          }
        } catch (couponError) {
          console.error('Error creating coupon usage record:', couponError);
          // Don't fail the payment if coupon usage tracking fails
        }
      }

      // Update yoga session booked seats if applicable
      if (booking.yogaSessionId) {
        try {
          await YogaSession.findByIdAndUpdate(
            booking.yogaSessionId,
            { $inc: { bookedSeats: booking.guests.length } },
            { session }
          );
        } catch (yogaError) {
          console.error('Error updating yoga session booked seats:', yogaError);
          // Don't fail the payment if booking count update fails
        }
      }

      // Update service available slots if applicable
      if (booking.selectedServices && booking.selectedServices.length > 0) {
        try {
          for (const selectedService of booking.selectedServices) {
            await Service.findByIdAndUpdate(
              selectedService.serviceId,
              { $inc: { availableSlots: -selectedService.quantity } },
              { session }
            );
          }
        } catch (serviceError) {
          console.error('Error updating service available slots:', serviceError);
          // Don't fail the payment if service availability update fails
        }
      }
    } else {
      booking.paymentStatus = 'failed';
      await booking.save({ session });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: payment.status === 'paid' ? 'Payment successful' : 'Payment failed',
      data: {
        paymentStatus: payment.status,
        bookingStatus: booking.status,
        paymentId: razorpay_payment_id,
        bookingId: booking._id
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Public payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  } finally {
    await session.endSession();
  }
};