import { Response } from 'express';
import { Booking, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { emailService } from '../utils/email';
import { smsService } from '../utils/sms';

export const sendBookingNotifications = async (
  bookingId: string,
  type: 'confirmation' | 'cancellation'
): Promise<{ success: boolean; results: any }> => {
  try {
    // Get booking with populated data
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email phone')
      .populate('roomId', 'roomNumber roomType')
      .populate('selectedServices.serviceId', 'name')
      .populate('yogaSessionId', 'type batchName startDate');

    if (!booking) {
      return {
        success: false,
        results: { error: 'Booking not found' }
      };
    }

    const user = booking.userId as any;
    const results: any = {};

    // Send email notification
    try {
      if (type === 'confirmation') {
        results.email = await emailService.sendBookingConfirmation(booking, user);
      } else {
        results.email = await emailService.sendBookingCancellation(booking, user);
      }
    } catch (error: any) {
      results.email = { success: false, error: error.message };
    }

    // Send WhatsApp/SMS notification
    try {
      const phoneNumber = user.phone;
      if (phoneNumber) {
        if (type === 'confirmation') {
          results.whatsapp = await smsService.sendBookingConfirmation(phoneNumber, booking, user, true);
        } else {
          results.whatsapp = await smsService.sendBookingCancellation(phoneNumber, booking, user, true);
        }
      } else {
        results.whatsapp = { success: false, error: 'Phone number not available' };
      }
    } catch (error: any) {
      results.whatsapp = { success: false, error: error.message };
    }

    const overallSuccess = results.email?.success || results.whatsapp?.success;

    return {
      success: overallSuccess,
      results
    };
  } catch (error: any) {
    console.error('Notification sending error:', error);
    return {
      success: false,
      results: { error: error.message }
    };
  }
};

export const sendTestNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, email, phone, message } = req.body;
    const userId = req.user?.userId;

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const results: any = {};

    // Send test email
    if (type === 'email' || type === 'both') {
      const targetEmail = email || user.email;
      results.email = await emailService.sendEmail({
        to: targetEmail,
        subject: 'Test Notification - Kshetra Retreat Resort',
        html: `
          <h2>Test Notification</h2>
          <p>This is a test email from Kshetra Retreat Resort booking system.</p>
          <p>Message: ${message || 'No custom message provided'}</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
        text: `Test notification: ${message || 'No custom message provided'}`
      });
    }

    // Send test SMS/WhatsApp
    if (type === 'sms' || type === 'whatsapp' || type === 'both') {
      const targetPhone = phone || user.phone;
      if (targetPhone) {
        const testMessage = message || 'This is a test message from Kshetra Retreat Resort booking system.';
        
        if (type === 'sms') {
          results.sms = await smsService.sendSMS(targetPhone, testMessage);
        } else {
          results.whatsapp = await smsService.sendWhatsApp(targetPhone, testMessage);
        }
      } else {
        results[type === 'sms' ? 'sms' : 'whatsapp'] = { 
          success: false, 
          error: 'Phone number not available' 
        };
      }
    }

    const overallSuccess = Object.values(results).some((result: any) => result.success);

    res.json({
      success: overallSuccess,
      message: 'Test notification sent',
      results
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test notification'
    });
  }
};

export const resendBookingNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const { type } = req.body; // 'confirmation' or 'cancellation'
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Validate booking access
    const query: any = { _id: bookingId };
    if (userRole !== 'admin') {
      query.userId = userId;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    // Send notifications
    const notificationResult = await sendBookingNotifications(bookingId, type || 'confirmation');

    res.json({
      success: notificationResult.success,
      message: 'Notification sent',
      results: notificationResult.results
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend notification'
    });
  }
};