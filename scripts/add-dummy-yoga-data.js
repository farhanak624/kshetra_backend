const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resort-booking');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String, required: true },
  specializations: [String],
  experience: { type: Number, required: true },
  certifications: [String],
  email: { type: String, required: true, unique: true },
  phone: String,
  profileImage: String,
  isActive: { type: Boolean, default: true },
  socialMedia: {
    instagram: String,
    facebook: String,
    website: String
  }
}, { timestamps: true });

// Yoga Session Schema
const yogaSessionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['200hr', '300hr']
  },
  batchName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  capacity: { type: Number, default: 15 },
  bookedSeats: { type: Number, default: 0 },
  price: { type: Number, required: true },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  schedule: {
    days: [String],
    time: String
  },
  isActive: { type: Boolean, default: true },
  description: String,
  prerequisites: { type: [String], default: [] }
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);
const YogaSession = mongoose.model('YogaSession', yogaSessionSchema);

const addDummyData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Teacher.deleteMany({});
    await YogaSession.deleteMany({});

    // Create teachers
    const teachers = [
      {
        name: 'Guru Rajeesh Kumar',
        bio: 'A traditional yoga master from Rishikesh with over two decades of teaching experience. Guru Rajeesh specializes in classical Hatha Yoga and Vedic meditation, bringing ancient wisdom to modern practitioners.',
        specializations: ['Hatha Yoga', 'Meditation', 'Pranayama', 'Yoga Philosophy'],
        experience: 20,
        certifications: ['RYT-500', 'Meditation Teacher Training', 'Traditional Hatha Yoga Certification'],
        email: 'rajeesh@kshetraretreat.com',
        phone: '+91-9876543210',
        isActive: true,
        socialMedia: {
          instagram: 'https://instagram.com/gururajeesh',
          website: 'https://rajeeshyoga.com'
        }
      },
      {
        name: 'Acharya Vishnu Das',
        bio: 'A dedicated practitioner and teacher of Ashtanga Yoga with deep knowledge of yoga philosophy and Sanskrit texts. Known for his precise alignment and spiritual teachings.',
        specializations: ['Ashtanga Yoga', 'Yoga Philosophy', 'Sanskrit', 'Advanced Asanas'],
        experience: 15,
        certifications: ['RYT-500', 'Ashtanga Authorization', 'Sanskrit Studies'],
        email: 'vishnu@kshetraretreat.com',
        phone: '+91-9876543211',
        isActive: true,
        socialMedia: {
          instagram: 'https://instagram.com/vishnudas',
          facebook: 'https://facebook.com/vishnudasyoga'
        }
      },
      {
        name: 'Maya Krishnan',
        bio: 'Maya brings a modern approach to traditional yoga practices, specializing in dynamic Vinyasa flows and advanced breathing techniques. Her classes are known for their creativity and therapeutic benefits.',
        specializations: ['Vinyasa Flow', 'Pranayama', 'Therapeutic Yoga', 'Yin Yoga'],
        experience: 8,
        certifications: ['RYT-500', 'Yin Yoga Certification', 'Therapeutic Yoga Training'],
        email: 'maya@kshetraretreat.com',
        phone: '+91-9876543212',
        isActive: true,
        socialMedia: {
          instagram: 'https://instagram.com/mayakrishnanyoga',
          website: 'https://mayayoga.com'
        }
      },
      {
        name: 'Dr. Amit Sharma',
        bio: 'A medical doctor turned yoga therapist, Dr. Amit combines his medical knowledge with ancient yoga practices to create healing-focused sessions. Specializes in yoga for chronic conditions.',
        specializations: ['Yoga Therapy', 'Medical Yoga', 'Restorative Yoga', 'Anatomy'],
        experience: 12,
        certifications: ['MBBS', 'C-IAYT', 'RYT-500', 'Yoga Therapy Certification'],
        email: 'amit@kshetraretreat.com',
        phone: '+91-9876543213',
        isActive: true,
        socialMedia: {
          website: 'https://dramityoga.com'
        }
      }
    ];

    const createdTeachers = await Teacher.insertMany(teachers);
    console.log(`Created ${createdTeachers.length} teachers`);

    // Create yoga sessions
    const yogaSessions = [
      {
        type: '200hr',
        batchName: 'Foundation Teacher Training - January 2025',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-11'), // 28 days
        capacity: 15,
        bookedSeats: 8,
        price: 150000,
        instructor: createdTeachers[0]._id, // Guru Rajeesh Kumar
        schedule: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          time: '06:00'
        },
        isActive: true,
        description: 'A comprehensive 200-hour Yoga Teacher Training program covering traditional Hatha Yoga, pranayama, meditation, philosophy, anatomy, and teaching methodology. Perfect for beginners looking to deepen their practice or become certified instructors.',
        prerequisites: ['Must have accommodation booking', 'Basic yoga experience recommended', 'Commitment to daily practice']
      },
      {
        type: '300hr',
        batchName: 'Advanced Teacher Training - February 2025',
        startDate: new Date('2025-02-20'),
        endDate: new Date('2025-03-26'), // 35 days
        capacity: 12,
        bookedSeats: 4,
        price: 200000,
        instructor: createdTeachers[1]._id, // Acharya Vishnu Das
        schedule: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          time: '05:30'
        },
        isActive: true,
        description: 'Advanced 300-hour training for certified teachers looking to deepen their knowledge and expand their teaching skills. Covers advanced asanas, adjustments, sequencing, and business aspects of yoga teaching.',
        prerequisites: ['Must hold 200hr YTT certification', 'Minimum 1 year teaching experience', 'Must have accommodation booking']
      },
      {
        type: '200hr',
        batchName: 'Spring Intensive - March 2025',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-04-06'), // 28 days
        capacity: 15,
        bookedSeats: 2,
        price: 155000,
        instructor: createdTeachers[2]._id, // Maya Krishnan
        schedule: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          time: '06:30'
        },
        isActive: true,
        description: 'A modern approach to traditional 200-hour teacher training with emphasis on Vinyasa flow, creative sequencing, and therapeutic applications. Includes anatomy, philosophy, and business skills.',
        prerequisites: ['Must have accommodation booking', 'Basic yoga experience recommended']
      },
      {
        type: '300hr',
        batchName: 'Therapeutic Yoga Specialization - April 2025',
        startDate: new Date('2025-04-15'),
        endDate: new Date('2025-05-19'), // 35 days
        capacity: 10,
        bookedSeats: 1,
        price: 220000,
        instructor: createdTeachers[3]._id, // Dr. Amit Sharma
        schedule: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          time: '07:00'
        },
        isActive: true,
        description: 'Specialized 300-hour training focusing on therapeutic applications of yoga. Learn to work with various health conditions, injuries, and chronic diseases using yoga as a healing modality.',
        prerequisites: ['Must hold 200hr YTT certification', 'Healthcare background preferred', 'Must have accommodation booking']
      },
      {
        type: '200hr',
        batchName: 'Summer Foundation Course - May 2025',
        startDate: new Date('2025-05-25'),
        endDate: new Date('2025-06-21'), // 28 days
        capacity: 15,
        bookedSeats: 0,
        price: 150000,
        instructor: createdTeachers[0]._id, // Guru Rajeesh Kumar
        schedule: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          time: '06:00'
        },
        isActive: true,
        description: 'Traditional Hatha Yoga teacher training with strong emphasis on meditation and spiritual practices. Includes comprehensive study of yoga philosophy and pranayama techniques.',
        prerequisites: ['Must have accommodation booking', 'Willingness to follow ashram lifestyle']
      }
    ];

    const createdSessions = await YogaSession.insertMany(yogaSessions);
    console.log(`Created ${createdSessions.length} yoga sessions`);

    console.log('Dummy yoga data added successfully!');
    console.log('\nTeachers created:');
    createdTeachers.forEach(teacher => {
      console.log(`- ${teacher.name} (${teacher.specializations.join(', ')})`);
    });

    console.log('\nYoga sessions created:');
    createdSessions.forEach(session => {
      console.log(`- ${session.batchName} (${session.type}) - ${session.bookedSeats}/${session.capacity} booked`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error adding dummy data:', error);
    process.exit(1);
  }
};

addDummyData();