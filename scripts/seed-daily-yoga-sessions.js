const mongoose = require('mongoose');
const { Schema } = require('mongoose');
require('dotenv').config();

const dailyYogaSessionSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['regular', 'therapy'] },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  description: { type: String, required: true },
  timeSlots: [{
    time: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  features: [{ type: String, required: true }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const DailyYogaSession = mongoose.model('DailyYogaSession', dailyYogaSessionSchema);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/booking_kshetra';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const seedDailySessions = async () => {
  try {
    // Clear existing daily sessions
    await DailyYogaSession.deleteMany({});

    const dailySessions = [
      {
        name: "Regular Yoga Sessions",
        type: "regular",
        price: 500,
        duration: 90,
        description: "Traditional Hatha Yoga sessions with pranayama and meditation, perfect for all levels",
        timeSlots: [
          { time: "07:30", isActive: true },
          { time: "09:00", isActive: true },
          { time: "16:00", isActive: true }
        ],
        features: [
          "Traditional Hatha Yoga",
          "Pranayama (Breathing)",
          "Meditation Practice",
          "Perfect for all levels"
        ],
        isActive: true
      },
      {
        name: "Yoga Therapy Sessions",
        type: "therapy",
        price: 1500,
        duration: 90,
        description: "Personalized therapeutic yoga sessions focused on healing and restoration",
        timeSlots: [
          { time: "11:00", isActive: true },
          { time: "17:30", isActive: true }
        ],
        features: [
          "Personalized therapy approach",
          "Healing-focused practices",
          "One-on-one guidance",
          "Therapeutic techniques"
        ],
        isActive: true
      }
    ];

    await DailyYogaSession.insertMany(dailySessions);
    console.log('Daily yoga sessions seeded successfully');

    // Display created sessions
    const sessions = await DailyYogaSession.find({});
    console.log('Created sessions:', sessions.map(s => ({
      name: s.name,
      type: s.type,
      price: s.price,
      timeSlots: s.timeSlots.length
    })));

  } catch (error) {
    console.error('Error seeding daily sessions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(() => {
  seedDailySessions();
});