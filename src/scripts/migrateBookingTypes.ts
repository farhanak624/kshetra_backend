import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Service from '../models/Service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateBookingTypes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URL not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all bookings that need migration
    const bookings = await Booking.find({
      $or: [
        { bookingType: { $exists: false } },
        { bookingCategory: { $exists: false } },
        { primaryService: { $exists: false } }
      ]
    }).populate('selectedServices.serviceId', 'name category');

    console.log(`📋 Found ${bookings.length} bookings to migrate`);

    let migratedCount = 0;

    for (const booking of bookings) {
      let needsUpdate = false;
      const updates: any = {};

      // Detect and set booking type if missing
      if (!booking.bookingType) {
        if (booking.roomId && booking.roomPrice > 0) {
          updates.bookingType = 'room';
          updates.bookingCategory = 'accommodation';
        } else if (booking.yogaPrice > 0 || booking.yogaSessionId) {
          updates.bookingType = 'yoga';
          updates.bookingCategory = 'activity';
          updates.primaryService = 'Yoga Session';
        } else if (booking.transportPrice > 0 && booking.servicesPrice === 0 && !booking.roomId) {
          updates.bookingType = 'transport';
          updates.bookingCategory = 'transport';

          const services = [];
          if (booking.transport?.pickup) services.push('Airport Pickup');
          if (booking.transport?.drop) services.push('Airport Drop');
          updates.primaryService = services.join(' + ') || 'Transport Service';
        } else if (booking.selectedServices && booking.selectedServices.length > 0) {
          // Check if it's adventure sports
          const hasAdventure = booking.selectedServices.some((service: any) =>
            service.serviceId?.category === 'adventure' ||
            ['surfing', 'diving', 'trekking', 'adventure'].some(keyword =>
              service.serviceId?.name?.toLowerCase().includes(keyword))
          );

          updates.bookingType = hasAdventure ? 'adventure' : 'service';
          updates.bookingCategory = 'activity';

          if (hasAdventure) {
            updates.primaryService = 'Adventure Sports';
          } else {
            updates.primaryService = `${booking.selectedServices.length} Service(s)`;
          }
        } else {
          updates.bookingType = 'service';
          updates.bookingCategory = 'activity';
          updates.primaryService = 'General Service';
        }
        needsUpdate = true;
      }

      // Set booking category if missing
      if (!booking.bookingCategory) {
        if (updates.bookingType === 'room') updates.bookingCategory = 'accommodation';
        else if (['yoga', 'adventure', 'service'].includes(updates.bookingType || booking.bookingType)) {
          updates.bookingCategory = 'activity';
        } else if (updates.bookingType === 'transport') {
          updates.bookingCategory = 'transport';
        } else {
          updates.bookingCategory = 'mixed';
        }
        needsUpdate = true;
      }

      // Set primary service if missing for non-room bookings
      if (!booking.primaryService && (updates.bookingType !== 'room' || booking.bookingType !== 'room')) {
        const currentType = updates.bookingType || booking.bookingType;

        if (currentType === 'transport') {
          const services = [];
          if (booking.transport?.pickup) services.push('Airport Pickup');
          if (booking.transport?.drop) services.push('Airport Drop');
          updates.primaryService = services.join(' + ') || 'Transport Service';
        } else if (currentType === 'yoga') {
          updates.primaryService = 'Yoga Session';
        } else if (currentType === 'adventure') {
          updates.primaryService = 'Adventure Sports';
        } else if (booking.selectedServices && booking.selectedServices.length > 0) {
          updates.primaryService = `${booking.selectedServices.length} Service(s)`;
        } else {
          updates.primaryService = 'General Service';
        }
        needsUpdate = true;
      }

      // Update the booking if changes are needed
      if (needsUpdate) {
        await Booking.findByIdAndUpdate(booking._id, updates);
        migratedCount++;

        console.log(`✅ Migrated booking ${booking._id}: ${updates.bookingType} (${updates.bookingCategory})`);
      }
    }

    console.log(`🎉 Migration completed! Updated ${migratedCount} bookings`);

    // Summary statistics
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Booking Type Distribution:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} bookings`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateBookingTypes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export default migrateBookingTypes;