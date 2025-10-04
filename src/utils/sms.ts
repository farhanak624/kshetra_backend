import twilio from 'twilio';

export class SMSService {
  private client: twilio.Twilio;
  private twilioPhoneNumber: string;
  private whatsappNumber: string;

  constructor() {
    console.log("ooomb",process.env.TWILIO_ACCOUNT_SID );
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN ||
        process.env.TWILIO_ACCOUNT_SID === 'your-twilio-account-sid') {
      if (process.env.NODE_ENV === 'production') {
        console.log();
        throw new Error('Twilio credentials are not configured');
      }
      console.warn('⚠️ Twilio credentials not configured - using development mode');
    }

    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID || 'placeholder_account_sid',
      process.env.TWILIO_AUTH_TOKEN || 'placeholder_auth_token'
    );

    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
  }

  async sendSMS(
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: to
      });

      return {
        success: true,
        messageId: result.sid
      };
    } catch (error: any) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWhatsApp(
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Format phone number for WhatsApp
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.whatsappNumber,
        to: formattedTo
      });

      return {
        success: true,
        messageId: result.sid
      };
    } catch (error: any) {
      console.error('WhatsApp sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateBookingConfirmationMessage(booking: any, user: any): string {
    const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN');
    const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN');
    
    return `🏨 Kshetra Retreat Resort - Booking Confirmed!

Dear ${user.name},

Your booking is confirmed:
📅 Check-in: ${checkInDate}
📅 Check-out: ${checkOutDate}
🏠 Room: ${booking.roomId.roomNumber} (${booking.roomId.roomType})
👥 Guests: ${booking.totalGuests}
💰 Total: ₹${booking.totalAmount}
🆔 Booking ID: ${booking._id}

${booking.transport && (booking.transport.pickup || booking.transport.drop) ? 
  `🚗 Transport: ${booking.transport.pickup ? 'Pickup ✓' : ''} ${booking.transport.drop ? 'Drop ✓' : ''}` : ''}

We look forward to welcoming you!

📞 Contact: +91-XXXXXXXXXX
📧 Email: info@kshetraretreat.com`;
  }

  generateBookingCancellationMessage(booking: any, user: any): string {
    return `❌ Kshetra Retreat Resort - Booking Cancelled

Dear ${user.name},

Your booking ${booking._id} has been cancelled.

Room: ${booking.roomId.roomNumber}
Dates: ${new Date(booking.checkIn).toLocaleDateString('en-IN')} - ${new Date(booking.checkOut).toLocaleDateString('en-IN')}

Refund will be processed within 5-7 business days.

Thank you for choosing us. We hope to serve you in the future!`;
  }

  async sendBookingConfirmation(
    phoneNumber: string,
    booking: any,
    user: any,
    useWhatsApp: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    const message = this.generateBookingConfirmationMessage(booking, user);
    
    if (useWhatsApp) {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }

  async sendBookingCancellation(
    phoneNumber: string,
    booking: any,
    user: any,
    useWhatsApp: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    const message = this.generateBookingCancellationMessage(booking, user);
    
    if (useWhatsApp) {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }

  async sendCustomMessage(
    phoneNumber: string,
    message: string,
    useWhatsApp: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    if (useWhatsApp) {
      return this.sendWhatsApp(phoneNumber, message);
    } else {
      return this.sendSMS(phoneNumber, message);
    }
  }
}

export const smsService = new SMSService();