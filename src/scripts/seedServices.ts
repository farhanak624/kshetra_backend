import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service';

dotenv.config();

const servicesData = [
  // Adventure Sports
  {
    name: "Professional Surfing Lessons",
    category: "adventure",
    subcategory: "surfing",
    price: 1500,
    priceUnit: "per_session",
    isActive: true,
    description: "Learn to surf with professional instructors in pristine waters. Perfect for beginners and intermediate surfers.",
    duration: 120, // 2 hours
    requirements: ["Swimming ability", "Age 10+"]
  },
  {
    name: "Deep Sea Diving",
    category: "adventure",
    subcategory: "diving",
    price: 2500,
    priceUnit: "per_session",
    isActive: true,
    description: "Explore the underwater world with certified diving instructors. Equipment included.",
    duration: 180, // 3 hours
    requirements: ["PADI certification or beginner course", "Age 16+"]
  },
  {
    name: "Mountain Trekking",
    category: "adventure",
    subcategory: "trekking",
    price: 800,
    priceUnit: "per_person",
    isActive: true,
    description: "Guided mountain trekking experience with scenic views and wildlife spotting.",
    duration: 240, // 4 hours
    requirements: ["Good physical fitness", "Age 12+"]
  },
  {
    name: "Kayaking Adventure",
    category: "adventure",
    subcategory: "water_sports",
    price: 1200,
    priceUnit: "per_session",
    isActive: true,
    description: "Paddle through calm waters and explore hidden coves with our guided kayaking tours.",
    duration: 150, // 2.5 hours
    requirements: ["Basic swimming", "Age 8+"]
  },

  // Yoga Services
  {
    name: "Morning Yoga Session",
    category: "yoga",
    subcategory: "hatha",
    price: 500,
    priceUnit: "per_session",
    isActive: true,
    description: "Start your day with energizing yoga practice overlooking the ocean.",
    duration: 90,
    requirements: ["Suitable for all levels"]
  },
  {
    name: "Sunset Meditation",
    category: "yoga",
    subcategory: "meditation",
    price: 400,
    priceUnit: "per_session",
    isActive: true,
    description: "Peaceful meditation session during the golden hour with ocean views.",
    duration: 60,
    requirements: ["Open to beginners"]
  },

  // Transport Services
  {
    name: "Airport Pickup",
    category: "transport",
    subcategory: "pickup",
    price: 800,
    priceUnit: "flat_rate",
    isActive: true,
    description: "Comfortable airport pickup service from Kochi or Trivandrum airports.",
    requirements: ["Flight details required"]
  },
  {
    name: "Airport Drop",
    category: "transport",
    subcategory: "drop",
    price: 800,
    priceUnit: "flat_rate",
    isActive: true,
    description: "Reliable airport drop service to Kochi or Trivandrum airports.",
    requirements: ["Flight details required"]
  },

  // Food Services
  {
    name: "Special Dinner",
    category: "food",
    subcategory: "dinner",
    price: 1200,
    priceUnit: "per_person",
    isActive: true,
    description: "Authentic local cuisine dinner with fresh seafood and vegetarian options.",
    requirements: ["Dietary preferences noted"]
  },
  {
    name: "Beach BBQ",
    category: "food",
    subcategory: "bbq",
    price: 1500,
    priceUnit: "per_person",
    isActive: true,
    description: "Exclusive beach barbecue experience with grilled seafood and local delicacies.",
    requirements: ["Advance booking required"]
  },

  // Add-on Services
  {
    name: "Spa Massage",
    category: "addon",
    subcategory: "wellness",
    price: 2000,
    priceUnit: "per_session",
    isActive: true,
    description: "Relaxing full-body massage with natural oils and traditional techniques.",
    duration: 90,
    requirements: ["Advance booking recommended"]
  },
  {
    name: "Photography Session",
    category: "addon",
    subcategory: "photography",
    price: 3000,
    priceUnit: "per_session",
    isActive: true,
    description: "Professional photography session capturing your special moments at scenic locations.",
    duration: 120,
    requirements: ["Weather dependent"]
  }
];

async function seedServices() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URL not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing services
    const deleteResult = await Service.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing services`);

    // Insert new services
    const insertedServices = await Service.insertMany(servicesData);
    console.log(`✅ Inserted ${insertedServices.length} services`);

    // Summary by category
    const summary = await Service.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          services: { $push: '$name' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Services by category:');
    summary.forEach(cat => {
      console.log(`\n${cat._id.toUpperCase()} (${cat.count}):` );
      cat.services.forEach((service: string) => {
        console.log(`  - ${service}`);
      });
    });

    console.log('\n🎉 Service seeding completed successfully!');

  } catch (error) {
    console.error('❌ Service seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedServices()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Seeding error:', error);
      process.exit(1);
    });
}

export default seedServices;