import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AdventureSport } from '../models';

dotenv.config();

const adventureSportsData = [
  {
    name: "Professional Surfing Lessons",
    category: "surfing",
    price: 150,
    priceUnit: "per_session",
    description: "Learn to surf with professional instructors in pristine waters. Perfect for beginners and intermediate surfers.",
    detailedDescription: "Our comprehensive surfing program offers 2-hour sessions with certified instructors who have over 10 years of experience. You'll learn ocean safety, proper surfing techniques, and wave reading skills. All equipment is included, and we ensure small group sizes for personalized attention.",
    duration: "2 hours",
    difficulty: "beginner",
    location: "Main Beach, Kshetra Resort",
    features: [
      "Professional certified instructors",
      "Small group classes (max 6 people)",
      "All equipment included",
      "Ocean safety training",
      "Photo package available"
    ],
    includedItems: [
      "Surfboard rental",
      "Wetsuit",
      "Safety helmet",
      "Professional instruction",
      "Beach shower access"
    ],
    requirements: [
      "Basic swimming ability required",
      "Must be comfortable in ocean water",
      "No prior surfing experience needed"
    ],
    images: [
      "/images/surfing/surf-lesson-1.jpg",
      "/images/surfing/surf-lesson-2.jpg",
      "/images/surfing/instructor-demo.jpg"
    ],
    ageRestriction: {
      minAge: 12,
      maxAge: 65
    },
    instructor: {
      name: "Jake Thompson",
      experience: "15 years professional surfing instruction",
      certifications: [
        "ISA Level 2 Surf Instructor",
        "Water Safety Certified",
        "First Aid & CPR Certified"
      ]
    },
    safety: [
      "All participants must pass basic swim test",
      "Weather conditions monitored continuously",
      "Emergency response team on standby",
      "Quality safety equipment provided",
      "Instructor to student ratio never exceeds 1:6"
    ],
    whatToBring: [
      "Swimwear",
      "Towel",
      "Sunscreen (reef-safe only)",
      "Water bottle",
      "Change of clothes"
    ],
    cancellationPolicy: "Free cancellation up to 24 hours before the session. 50% refund for cancellations within 24 hours due to weather conditions.",
    maxQuantity: 6,
    isActive: true
  },
  {
    name: "Advanced Surfing Masterclass",
    category: "surfing",
    price: 250,
    priceUnit: "per_session",
    description: "Take your surfing to the next level with advanced techniques and personalized coaching.",
    detailedDescription: "This intensive 3-hour masterclass is designed for intermediate to advanced surfers looking to improve their technique. Focus on advanced maneuvers, wave selection, and competitive surfing strategies.",
    duration: "3 hours",
    difficulty: "advanced",
    location: "Advanced Break, North Shore",
    features: [
      "Video analysis of your surfing",
      "Personalized coaching",
      "Advanced technique training",
      "Competition preparation",
      "Performance surfboards available"
    ],
    includedItems: [
      "High-performance surfboard",
      "Video analysis session",
      "Personalized feedback report",
      "Advanced technique guide"
    ],
    requirements: [
      "Minimum 2 years surfing experience",
      "Ability to surf green waves consistently",
      "Strong swimming skills required"
    ],
    ageRestriction: {
      minAge: 16,
      maxAge: 55
    },
    instructor: {
      name: "Maria Rodriguez",
      experience: "Former professional surfer, 12 years coaching",
      certifications: [
        "ISA Level 3 Performance Coach",
        "Surfing Australia High Performance Coach",
        "Sports Psychology Certified"
      ]
    },
    safety: [
      "Advanced swimmer verification required",
      "Suitable wave conditions only",
      "Emergency jet ski backup",
      "Professional grade safety equipment"
    ],
    whatToBring: [
      "Performance swimwear",
      "Personal surfboard (optional)",
      "GoPro or action camera (optional)",
      "Athletic mindset"
    ],
    cancellationPolicy: "48-hour cancellation policy. No refunds for cancellations within 48 hours unless due to dangerous weather conditions.",
    maxQuantity: 3,
    isActive: true
  },
  {
    name: "Scuba Diving Discovery",
    category: "diving",
    price: 180,
    priceUnit: "per_person",
    description: "Discover the underwater world with guided scuba diving for beginners and certified divers.",
    detailedDescription: "Explore pristine coral reefs and marine life in crystal clear waters. This program includes equipment, safety briefing, and guided underwater tour with experienced dive masters.",
    duration: "4 hours (including training)",
    difficulty: "beginner",
    location: "Coral Bay Marine Reserve",
    features: [
      "PADI certified instructors",
      "Professional diving equipment",
      "Underwater photography",
      "Marine life identification guide",
      "Post-dive refreshments"
    ],
    includedItems: [
      "Complete diving gear",
      "Underwater camera rental",
      "Safety briefing",
      "Marine life guide book",
      "Certificate of completion"
    ],
    requirements: [
      "Medical clearance form",
      "Basic swimming ability",
      "Age restrictions apply"
    ],
    ageRestriction: {
      minAge: 14,
      maxAge: 60
    },
    instructor: {
      name: "Captain Dave Wilson",
      experience: "20 years diving instruction, 5000+ dives",
      certifications: [
        "PADI Master Instructor",
        "Emergency First Response Instructor",
        "Dive Safety Officer"
      ]
    },
    safety: [
      "Medical questionnaire required",
      "Buddy system enforced",
      "Emergency oxygen on boat",
      "Depth limit strictly enforced",
      "Weather conditions monitored"
    ],
    whatToBring: [
      "Medical clearance (if over 45)",
      "Swimwear",
      "Towel",
      "Reef-safe sunscreen",
      "Excitement for underwater adventure"
    ],
    cancellationPolicy: "Free cancellation 48 hours prior. Weather-related cancellations receive full refund or reschedule option.",
    maxQuantity: 8,
    isActive: true
  },
  {
    name: "Mountain Trekking Adventure",
    category: "trekking",
    price: 120,
    priceUnit: "per_person",
    description: "Explore scenic mountain trails with experienced guides. Suitable for all fitness levels.",
    detailedDescription: "Journey through lush forests, past waterfalls, and up to breathtaking viewpoints. Our guides share local flora, fauna, and cultural knowledge throughout the 6-hour trek.",
    duration: "6 hours",
    difficulty: "intermediate",
    location: "Mystic Mountains Trail System",
    features: [
      "Experienced local guides",
      "Scenic viewpoints",
      "Wildlife spotting opportunities",
      "Traditional lunch included",
      "Photography stops"
    ],
    includedItems: [
      "Professional guide service",
      "Trail lunch and snacks",
      "Trekking poles",
      "First aid kit",
      "Trail map and nature guide"
    ],
    requirements: [
      "Moderate fitness level required",
      "Proper hiking footwear",
      "Weather-appropriate clothing"
    ],
    ageRestriction: {
      minAge: 16,
      maxAge: 70
    },
    instructor: {
      name: "Michael Chen",
      experience: "15 years mountain guiding, local expert",
      certifications: [
        "Wilderness First Aid Certified",
        "Mountain Leader Qualification",
        "Local Flora & Fauna Expert"
      ]
    },
    safety: [
      "Weather monitoring system",
      "Emergency communication devices",
      "Trained in mountain rescue",
      "Group size limited for safety",
      "Alternative routes for weather"
    ],
    whatToBring: [
      "Sturdy hiking boots",
      "Weather-appropriate layers",
      "Personal water bottle",
      "Sun hat and sunglasses",
      "Small backpack"
    ],
    cancellationPolicy: "Free cancellation 24 hours in advance. Weather cancellations eligible for full refund or alternative date.",
    maxQuantity: 12,
    isActive: true
  },
  {
    name: "Rock Climbing Experience",
    category: "adventure",
    price: 200,
    priceUnit: "per_person",
    description: "Challenge yourself with guided rock climbing on natural cliff faces. All skill levels welcome.",
    detailedDescription: "Scale dramatic cliff faces with top-rope safety systems. Professional instruction covers climbing techniques, safety procedures, and equipment use. Multiple route options available for different skill levels.",
    duration: "5 hours",
    difficulty: "intermediate",
    location: "Eagle's Peak Climbing Area",
    features: [
      "Multiple climbing routes",
      "Professional safety equipment",
      "Technique instruction",
      "Rappelling experience",
      "Achievement certificate"
    ],
    includedItems: [
      "Climbing harness and helmet",
      "Rock climbing shoes",
      "Professional instruction",
      "Safety equipment",
      "Energy snacks and water"
    ],
    requirements: [
      "Good physical condition",
      "No fear of heights",
      "Follow safety instructions"
    ],
    ageRestriction: {
      minAge: 18,
      maxAge: 55
    },
    instructor: {
      name: "Sarah Mitchell",
      experience: "12 years professional climbing instruction",
      certifications: [
        "Rock Climbing Instructor Certification",
        "Rope Access Technician",
        "Wilderness Emergency Medical Technician"
      ]
    },
    safety: [
      "Double-checked safety systems",
      "Weather condition assessment",
      "Emergency rescue protocols",
      "Quality climbing equipment",
      "Instructor safety briefings"
    ],
    whatToBring: [
      "Athletic clothing",
      "Closed-toe shoes (if no rental)",
      "Hair tie (for long hair)",
      "Personal water bottle",
      "Positive attitude"
    ],
    cancellationPolicy: "Cancellations accepted up to 48 hours prior for full refund. Weather-related cancellations rescheduled at no charge.",
    maxQuantity: 6,
    isActive: true
  },
  {
    name: "Kayak & Wildlife Tour",
    category: "adventure",
    price: 95,
    priceUnit: "per_person",
    description: "Paddle through mangroves and coastal waters while spotting local wildlife and learning about marine ecosystems.",
    detailedDescription: "Enjoy a peaceful paddle through protected mangrove channels and open coastal waters. Our naturalist guides help spot dolphins, sea turtles, tropical birds, and other wildlife while sharing ecological knowledge.",
    duration: "3 hours",
    difficulty: "beginner",
    location: "Mangrove Conservation Area",
    features: [
      "Wildlife spotting opportunities",
      "Naturalist guide education",
      "Stable touring kayaks",
      "Snorkeling stop included",
      "Waterproof storage provided"
    ],
    includedItems: [
      "Single or tandem kayak",
      "Paddle and safety vest",
      "Snorkeling gear",
      "Waterproof bag",
      "Wildlife identification guide"
    ],
    requirements: [
      "Basic swimming ability",
      "Comfortable in water",
      "No prior kayaking experience needed"
    ],
    ageRestriction: {
      minAge: 8,
      maxAge: 75
    },
    instructor: {
      name: "Dr. Elena Vasquez",
      experience: "Marine biologist, 8 years eco-tour guiding",
      certifications: [
        "Marine Biology PhD",
        "Kayak Instructor Certification",
        "Naturalist Guide License"
      ]
    },
    safety: [
      "Coast Guard approved safety vests",
      "Emergency whistle for each participant",
      "Weather monitoring",
      "Calm water route selection",
      "Safety kayak accompanies group"
    ],
    whatToBring: [
      "Swimwear and change of clothes",
      "Reef-safe sunscreen",
      "Hat with chin strap",
      "Water bottle",
      "Waterproof camera (optional)"
    ],
    cancellationPolicy: "Free cancellation up to 24 hours before tour. Weather cancellations receive full refund or alternative booking.",
    maxQuantity: 10,
    isActive: true
  }
];

const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const seedAdventureSports = async () => {
  try {
    console.log('🌱 Starting adventure sports seeding...');

    // Clear existing adventure sports data
    await AdventureSport.deleteMany({});
    console.log('🗑️  Cleared existing adventure sports data');

    // Insert new adventure sports data
    const createdSports = await AdventureSport.insertMany(adventureSportsData);
    console.log(`✅ Successfully created ${createdSports.length} adventure sports`);

    // Display created sports summary
    createdSports.forEach((sport, index) => {
      console.log(`${index + 1}. ${sport.name} (${sport.category}) - $${sport.price} ${sport.priceUnit}`);
    });

    console.log('🎉 Adventure sports seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding adventure sports data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
};

const main = async () => {
  await connectToDatabase();
  await seedAdventureSports();
};

// Run the seeding script
if (require.main === module) {
  main();
}

export { adventureSportsData };