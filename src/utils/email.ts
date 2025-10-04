import nodemailer from 'nodemailer';
import { IBooking } from '../models/Booking';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
        console.log('📧 Email not configured - would send email to:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Note: Configure EMAIL_USER and EMAIL_PASS in .env to enable email sending');

        return {
          success: true,
          messageId: 'dev-mode-' + Date.now()
        };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error: any) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateBookingConfirmationEmail(booking: any, user: any): string {
    const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN');
    const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .booking-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .highlight { color: #2c5aa0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmation</h1>
            <h2>Kshetra Retreat Resort</h2>
          </div>
          
          <div class="content">
            <h3>Dear ${user.name},</h3>
            <p>Thank you for choosing Kshetra Retreat Resort! Your booking has been confirmed.</p>
            
            <div class="booking-details">
              <h4>Booking Details:</h4>
              <p><strong>Booking ID:</strong> <span class="highlight">${booking._id}</span></p>
              <p><strong>Room:</strong> ${booking.roomId.roomNumber} (${booking.roomId.roomType})</p>
              <p><strong>Check-in:</strong> ${checkInDate}</p>
              <p><strong>Check-out:</strong> ${checkOutDate}</p>
              <p><strong>Guests:</strong> ${booking.totalGuests} (${booking.adults} Adults, ${booking.children} Children)</p>
              <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
            </div>

            ${booking.transport && (booking.transport.pickup || booking.transport.drop) ? `
            <div class="booking-details">
              <h4>Transport Details:</h4>
              ${booking.transport.pickup ? `<p><strong>Airport Pickup:</strong> Yes</p>` : ''}
              ${booking.transport.flightNumber ? `<p><strong>Flight Number:</strong> ${booking.transport.flightNumber}</p>` : ''}
              ${booking.transport.drop ? `<p><strong>Airport Drop:</strong> Yes</p>` : ''}
            </div>
            ` : ''}

            ${booking.selectedServices && booking.selectedServices.length > 0 ? `
            <div class="booking-details">
              <h4>Additional Services:</h4>
              ${booking.selectedServices.map((service: any) => `
                <p>• ${service.serviceId.name} (Qty: ${service.quantity}) - ₹${service.totalPrice}</p>
              `).join('')}
            </div>
            ` : ''}

            ${booking.yogaSessionId ? `
            <div class="booking-details">
              <h4>Yoga Session:</h4>
              <p><strong>Type:</strong> ${booking.yogaSessionId.type}</p>
              <p><strong>Batch:</strong> ${booking.yogaSessionId.batchName}</p>
              <p><strong>Start Date:</strong> ${new Date(booking.yogaSessionId.startDate).toLocaleDateString('en-IN')}</p>
            </div>
            ` : ''}

            <p>We look forward to welcoming you to our resort!</p>
            
            <p><strong>Contact Information:</strong><br>
            Phone: +91-XXXXXXXXXX<br>
            Email: info@kshetraretreat.com</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>&copy; 2025 Kshetra Retreat Resort. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateBookingCancellationEmail(booking: any, user: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .booking-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancellation</h1>
            <h2>Kshetra Retreat Resort</h2>
          </div>
          
          <div class="content">
            <h3>Dear ${user.name},</h3>
            <p>Your booking has been cancelled as requested.</p>
            
            <div class="booking-details">
              <h4>Cancelled Booking Details:</h4>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Room:</strong> ${booking.roomId.roomNumber} (${booking.roomId.roomType})</p>
              <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString('en-IN')}</p>
              <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString('en-IN')}</p>
              <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
            </div>

            <p>If you made a payment, our team will process the refund within 5-7 business days.</p>
            <p>We hope to serve you in the future!</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 Kshetra Retreat Resort. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendBookingConfirmation(booking: any, user?: any): Promise<{ success: boolean; error?: string }> {
    // Handle both user account and public bookings
    const guestInfo = user || {
      name: booking.primaryGuestInfo?.name || 'Guest',
      email: booking.guestEmail || booking.primaryGuestInfo?.email
    };

    if (!guestInfo.email) {
      return {
        success: false,
        error: 'No email address available for booking confirmation'
      };
    }

    const html = this.generateBookingConfirmationEmail(booking, guestInfo);

    return this.sendEmail({
      to: guestInfo.email,
      subject: 'Booking Confirmation - Kshetra Retreat Resort',
      html,
      text: `Your booking ${booking._id} at Kshetra Retreat Resort has been confirmed.`
    });
  }

  async sendBookingCancellation(booking: any, user: any): Promise<{ success: boolean; error?: string }> {
    const html = this.generateBookingCancellationEmail(booking, user);

    return this.sendEmail({
      to: user.email,
      subject: 'Booking Cancellation - Kshetra Retreat Resort',
      html,
      text: `Your booking ${booking._id} at Kshetra Retreat Resort has been cancelled.`
    });
  }

  async sendAgencyBookingNotification(booking: any, agency: any): Promise<{ success: boolean; error?: string }> {
    const html = this.generateAgencyBookingNotificationEmail(booking, agency);

    return this.sendEmail({
      to: agency.email,
      subject: 'New Transport Booking Assignment - Kshetra Retreat Resort',
      html,
      text: `New transport booking ${booking._id} requires vehicle and driver assignment.`
    });
  }

  private generateAgencyBookingNotificationEmail(booking: any, agency: any): string {
    // Get customer information
    const customerName = booking.primaryGuestInfo?.name || booking.guests[0]?.name || 'Guest';
    const customerEmail = booking.guestEmail || booking.userId?.email || booking.primaryGuestInfo?.email;
    const customerPhone = booking.primaryGuestInfo?.phone || booking.guests[0]?.phone;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .booking-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { background-color: #eee; padding: 15px; text-align: center; font-size: 12px; }
          .urgent { background-color: #ffebcc; border-left: 4px solid #ff9800; padding: 10px; margin: 15px 0; }
          .transport-info { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Transport Booking Assignment</h1>
            <p>Kshetra Retreat Resort</p>
          </div>

          <div class="content">
            <p>Dear ${agency.name},</p>

            <div class="urgent">
              <h3>🚨 Urgent: New Transport Booking Requires Assignment</h3>
              <p>A new booking with transport services has been created and requires immediate vehicle and driver assignment.</p>
            </div>

            <div class="booking-details">
              <h3>Booking Information</h3>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString('en-IN')}</p>
              <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString('en-IN')}</p>
              <p><strong>Total Guests:</strong> ${booking.totalGuests}</p>
              <p><strong>Status:</strong> ${booking.status}</p>
            </div>

            <div class="booking-details">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
              ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
              ${booking.primaryGuestInfo?.address ? `<p><strong>Address:</strong> ${booking.primaryGuestInfo.address}</p>` : ''}
            </div>

            ${booking.transport ? `
            <div class="transport-info">
              <h3>🚗 Transport Requirements</h3>
              ${booking.transport.pickup ? `<p><strong>✅ Airport Pickup Required</strong></p>` : ''}
              ${booking.transport.drop ? `<p><strong>✅ Airport Drop Required</strong></p>` : ''}
              ${booking.transport.flightNumber ? `<p><strong>Flight Number:</strong> ${booking.transport.flightNumber}</p>` : ''}
              ${booking.transport.pickupTerminal ? `<p><strong>Pickup Terminal:</strong> ${booking.transport.pickupTerminal}</p>` : ''}
              ${booking.transport.dropTerminal ? `<p><strong>Drop Terminal:</strong> ${booking.transport.dropTerminal}</p>` : ''}
              ${booking.transport.airportFrom ? `<p><strong>Airport From:</strong> ${booking.transport.airportFrom}</p>` : ''}
              ${booking.transport.airportTo ? `<p><strong>Airport To:</strong> ${booking.transport.airportTo}</p>` : ''}
              ${booking.transport.flightArrivalTime ? `<p><strong>Flight Arrival:</strong> ${new Date(booking.transport.flightArrivalTime).toLocaleString('en-IN')}</p>` : ''}
              ${booking.transport.flightDepartureTime ? `<p><strong>Flight Departure:</strong> ${new Date(booking.transport.flightDepartureTime).toLocaleString('en-IN')}</p>` : ''}
              ${booking.transport.specialInstructions ? `<p><strong>Special Instructions:</strong> ${booking.transport.specialInstructions}</p>` : ''}
            </div>
            ` : ''}

            ${booking.specialRequests ? `
            <div class="booking-details">
              <h3>Special Requests</h3>
              <p>${booking.specialRequests}</p>
            </div>
            ` : ''}

            <div class="urgent">
              <h3>Next Steps</h3>
              <p>1. Login to your agency dashboard</p>
              <p>2. Assign an available vehicle and driver</p>
              <p>3. Confirm pickup/drop times</p>
              <p>4. Customer will be automatically notified</p>
            </div>

            <p><strong>Login to your agency portal to assign vehicle and driver for this booking.</strong></p>

            <p>Best regards,<br>Kshetra Retreat Resort Management</p>
          </div>

          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>&copy; 2025 Kshetra Retreat Resort. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();